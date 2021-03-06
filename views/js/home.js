const playground = document.querySelector(".playground > ul");

const stairImg = document.querySelector(".player .stair");
const playerImg = document.querySelector(".player .player-img");
const groundImg = document.querySelector(".playground > ul");
const home = document.getElementById("home");

let socket;

let currentZoom =
  localStorage.getItem("zoom") === null
    ? 100
    : Number(localStorage.getItem("zoom"));

let groundType = !localStorage.getItem("ground-type")
  ? 0
  : localStorage.getItem("ground-type");
let stairType = !localStorage.getItem("stair-type")
  ? 0
  : localStorage.getItem("stair-type");
let playerType = !localStorage.getItem("player-type")
  ? 0
  : localStorage.getItem("player-type");

//스킨 바꾸기
stairImg.classList = "stair " + stairNames[stairType];
groundImg.classList = backNames[groundType];

// 격자 생성
for (let i = 0; i < GAME_ROWS; i++) {
  prependNewLine();
}

//줄 생성
function prependNewLine() {
  const li = document.createElement("li");
  const ul = document.createElement("ul");
  for (let j = 0; j < GAME_COLS; j++) {
    const matrix = document.createElement("li");

    ul.prepend(matrix);
  }
  li.prepend(ul);
  playground.prepend(li);
}

const mainMenu = document.querySelector(".main-menu");
const dressRoom = document.querySelector(".dressing-room");
const player = document.querySelector(".playground .player");
const stair = document.querySelector(".stair");

//스킨 개수
const BACK_MAX = 3;
const STAIR_MAX = 4;
const PLAYER_MAX = 4;

//변수들
let currentY;

function turnToGame(type) {
  home.style.display = "none";
  startGame(type);
}
//플레이버튼 누를 시
document.querySelector(".play-btn").addEventListener("click", () => {
  document.querySelector("#home .choose").style.display = "block";
});

document.querySelector(".choose .close-btn").addEventListener("click", () => {
  document.querySelector("#home .choose").style.display = "none";
});
document
  .querySelector(".room-container .close-btn")
  .addEventListener("click", () => {
    document.querySelector(".room-container").style.display = "none";
    socket.disconnect();
  });
document.querySelector(".choose .single-btn").addEventListener("click", () => {
  turnToGame("single");
});

document.querySelector(".room-btn .join-room").addEventListener("click", () => {
  if (
    document.querySelector(".room-list-container").querySelector(".selected")
  ) {
    alert("join!!");
    joinRoom(
      document
        .querySelector(".room-list-container")
        .querySelector(".selected")
        .querySelector(".list-name").innerHTML
    );
  }
});
document
  .querySelector(".room-btn .start-room")
  .addEventListener("click", () => {
    if (
      document.querySelector(".room-list-container").querySelector(".selected")
    ) {
      socket.emit("game-start-master");
      socket.emit("game-start");
      turnToGame(
        "multi",
        document
          .querySelector(".room-list-container")
          .querySelector(".selected")
          .querySelector(".list-name").innerHTML
      );
    }
  });

function joinRoom(name) {
  socket.emit("join-room", name);
}
document.querySelector(".choose .multi-btn").addEventListener("click", () => {
  document.querySelector(".room-container").style.display = "block";
  socket = io();
  socket.on("get-start", () => {
    console.log("hi");
    socket.emit("game-start");
    turnToGame("multi");
  });
  socket.emit("get-room", (data) => {
    renderRooms(data);
  });
});

function selectRoom() {
  const list = document.querySelector(".room-list").classList.value;
  if (list.indexOf("selceted") !== -1) return;
  if (document.querySelector(".room-list-container").querySelector(".selected"))
    document
      .querySelector(".room-list-container")
      .querySelector(".selected")
      .classList.remove("selecected");
  document.querySelector(".room-list").classList.add("selected");
}

function renderRooms(rooms) {
  const ul = document.querySelector(".room-list-container");
  ul.innerHTML = "";
  Object.keys(rooms).forEach((room) => {
    // if (room !== "ready") {
    const div = document.createElement("div");
    div.classList = "room-list";
    const name = document.createElement("span");
    name.classList = "list-name";
    const count = document.createElement("span");
    count.classList = "list-room-count";
    name.innerHTML = rooms[room].name;
    count.innerHTML = rooms[room].players.length;
    div.appendChild(name);
    div.appendChild(count);
    div.addEventListener("click", () => selectRoom());
    ul.appendChild(div);
    // }
  });
}

//드레스룸으로 이동
function turnToDress() {
  mainMenu.style.display = "none";
  dressRoom.style.display = "block";

  const style = getComputedStyle(player);
  currentY = style.getPropertyValue("top");
  currentY = currentY.replace("px", "");
  currentY = Number(currentY);

  player.style.top = currentY - 70 + "px";
}

//드레스룸에서 메인화면으로 이동
function turnToMain() {
  mainMenu.style.display = "block";
  dressRoom.style.display = "none";

  const style = getComputedStyle(player);

  player.style.top = currentY + "px";

  okImg();
}

const changeBack = document.querySelector(".change-back");
const changePlayer = document.querySelector(".change-player");
const changeStair = document.querySelector(".change-stair");

const changeBackText = document.querySelector(".change-back > span");
const changePlayerText = document.querySelector(".change-player > span");
const changeStairText = document.querySelector(".change-stair > span");

let currentBackNumber = groundType;
let currentStairNumber = stairType;
let currentPlayerNumber = playerType;

changeBackText.innerText = backNames[currentBackNumber];
console.log(currentStairNumber);
changeStairText.innerText = stairNames[currentStairNumber];
// changePlayerText.innerText = playerName[currentPlayerNumber];

document.querySelector(".left-back").addEventListener("click", () => {
  currentBackNumber--;
  currentBackNumber = isOkay(currentBackNumber, BACK_MAX);
  console.log(currentBackNumber);
  changeBackText.innerText = backNames[currentBackNumber];
  changeImg(1);
});
document.querySelector(".left-stair").addEventListener("click", () => {
  currentStairNumber--;
  currentStairNumber = isOkay(currentStairNumber, STAIR_MAX);
  changeStairText.innerText = stairNames[currentStairNumber];
  changeImg(3);
});
document.querySelector(".left-player").addEventListener("click", () => {
  currentPlayerNumber--;
  currentPlayerNumber = isOkay(currentPlayerNumber, PLAYER_MAX);
  changePlayerText.innerText = playerName[currentPlayerNumber];
  changeImg(2);
});
document.querySelector(".right-back").addEventListener("click", () => {
  currentBackNumber++;
  currentBackNumber = isOkay(currentBackNumber, BACK_MAX);
  changeBackText.innerText = backNames[currentBackNumber];
  changeImg(1);
});
document.querySelector(".right-stair").addEventListener("click", () => {
  currentStairNumber++;
  currentStairNumber = isOkay(currentStairNumber, STAIR_MAX);
  changeStairText.innerText = stairNames[currentStairNumber];
  changeImg(3);
});
document.querySelector(".right-player").addEventListener("click", () => {
  currentPlayerNumber++;
  currentPlayerNumber = isOkay(currentPlayerNumber, PLAYER_MAX);
  changePlayerText.innerText = playerName[currentPlayerNumber];
  changeImg(2);
});

//변수 1~4만큼 되게
function isOkay(number, max) {
  if (number > max - 1) {
    return 0;
  } else if (number <= 0) {
    return max - 1;
  }

  return number;
}

function changeImg(type) {
  switch (type) {
    case 1:
      groundImg.classList = backNames[currentBackNumber];
      break;
    case 2:
      // playerImg.classList=
      //   document.querySelector(".player-img").style.backgroundImage =
      //     currentPlayerUrl;
      break;
    case 3:
      stairImg.classList = "stair " + stairNames[currentStairNumber];
      break;
  }
}

function okImg() {
  localStorage.setItem("player-type", currentPlayerNumber);
  localStorage.setItem("stair-type", currentStairNumber);
  localStorage.setItem("ground-type", currentBackNumber);
}
