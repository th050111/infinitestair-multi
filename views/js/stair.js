const wrapper = document.querySelector(".wrapper");

//줄 생성
function prependNewLine(playground, type) {
  const ground = document.createElement("ul");
  for (let i = 0; i < GAME_ROWS; i++) {
    const li = document.createElement("li");
    const ul = document.createElement("ul");
    for (let j = 0; j < GAME_COLS; j++) {
      const matrix = document.createElement("li");

      ul.prepend(matrix);
    }
    li.prepend(ul);
    ground.prepend(li);
  }
  ground.classList = backNames[type];
  playground.prepend(ground);
  wrapper.prepend(playground);
}
function createNewGround(id, type) {
  const playground = document.createElement("div");
  playground.id = id;
  playground.classList = "playground";
  prependNewLine(playground, type);
}

//게임
const BOLCK_MAX = 7;
const BLOCK_MIN = 4;
const BLOCK_HEIGHT = 35;

//서버관련 변수들
let myId = "";
const socket = io();

const players = [];
const playerMap = {};

//variables

const currentPlayerLocation = [(GAME_COLS - 1) / 2, GAME_ROWS - 5];
let currentBlocks = [[3, GAME_ROWS - 4]];
let groundDirection = "left";
let playerDirection = "left";
let toCreatBlocks;
let isRun = false;
let moveTimer = null;

//서버 연결

function Player(id) {
  this.id = id;
  this.stairs = "";
  this.skins = "";
}

function joinUser({ id, stairs, skins }) {
  let player = new Player(id);
  if (stairs) player.stairs = stairs;
  player.skins = skins;
  players.push(player);
  playerMap[id] = player;
  createNewGround(id, skins.background);
  return player;
}
function updateState({ id, stairs, skins}) {
  let player = playerMap[id];
  console.log(skins)
  if (!player) {
    return;
  }
  player.stairs = stairs;
  player.skins = skins;
  renderBlock();
}
function leaveUser(id) {
  for (var i = 0; i < players.length; i++) {
    if (players[i].id == id) {
      players.splice(i, 1);
      break;
    }
  }
  delete playerMap[id];
  document.getElementById(id).remove();
  //renderBlock();
}

socket.on("user_id", (data) => {
  myId = data;
});
socket.on("start", () => {
  init();
});
socket.on("leave_user", function (data) {
  leaveUser(data);
});
socket.on("join_user", function (data) {
  joinUser(data);
});
socket.on("update_state", function (data) {
  console.log(data)
  updateState(data);
});

function sendData() {
  let curPlayer = playerMap[myId];
  data = JSON.stringify(curPlayer);
  if (data) {
    socket.emit("send_stairs", data);
  }
}
// function update() {
//   console.log(players);
//   sendData();
// }

// setInterval(update, 1000);
//키 입력 받기
document.addEventListener("keydown", (event) => {
  let isMove = true;
  switch (event.keyCode) {
    case 39:
      playerDirection = "right";
      break;
    case 37:
      playerDirection = "left";
      break;
    default:
      isMove = false;
      break;
  }
  if (isMove) {
    move();
  }
});

function init() {
  toCreatBlocks = Math.floor(Math.random() * BOLCK_MAX) + BLOCK_MIN - 3;
  createNewBlocks();
  playerMap[myId].stairs = currentBlocks;

  //스킨 불러오기
  playerMap[myId].skins.background = !localStorage.getItem("ground-type")
    ? 0
    : localStorage.getItem("ground-type");
  playerMap[myId].skins.stair = !localStorage.getItem("stair-type")
    ? 0
    : localStorage.getItem("stair-type");
  playerMap[myId].skins.player = !localStorage.getItem("player-type")
    ? 0
    : localStorage.getItem("player-type");
  sendData();
  renderBlock();
}

//움직이기
function move() {
  //새로운 배열 생성
  createNewBlocks();

  let i = 0;
  currentBlocks.forEach((block) => {
    const x = block[0];
    const y = block[1];
    currentBlocks[i++] =
      playerDirection === "left" ? [x + 1, y + 1] : [x - 1, y + 1];
  });
  playerMap[myId].stairs = currentBlocks;
  sendData();
  renderBlock();

  isEmpty(currentPlayerLocation);
}

//빈곳인지 확인
function isEmpty(location) {
  const x = location[0];
  const y = location[1];
  const target = playground.childNodes[y + 1].childNodes[0].childNodes[x];

  if (!target.classList.contains("stair")) {
    console.log("you die");
  }
}

//나올 블럭 배열 생성
function createNewBlocks() {
  let extra = 0;
  while (currentBlocks.length + extra < GAME_ROWS) {
    if (toCreatBlocks === 0) {
      toCreatBlocks = Math.floor(Math.random() * BOLCK_MAX);
      if (toCreatBlocks < 1) toCreatBlocks = 1;
      else if (toCreatBlocks < 4) {
        toCreatBlocks += BLOCK_MIN;
      }
      groundDirection = groundDirection === "right" ? "left" : "right";
    }
    let newLocation = currentBlocks[0];
    const x = newLocation[0];
    const y = newLocation[1];
    if (y > 0 && y < GAME_ROWS) {
      newLocation =
        groundDirection === "right" ? [x + 1, y - 1] : [x - 1, y - 1];
      currentBlocks.unshift(newLocation);
    } else {
      extra++;
      toCreatBlocks++;
    }
    toCreatBlocks--;
  }
  if (extra === 0) {
    currentBlocks.pop();
  }
}

//블럭 생성
function renderBlock() {
  //격자안의 계단 블럭들 삭제
  const stairBlocks = document.querySelectorAll(".stair");
  stairBlocks.forEach((moving) => {
    moving.classList = "";
  });
  players.forEach((player) => {
    const blocks = [...player.stairs];
    //배경바꾸기 최적화 생각해보기
    document.getElementById(player.id).querySelector("ul").classList =
      backNames[player.skins.background];
    blocks.forEach((block) => {
      const x = block[0];
      const y = block[1];
      if (x >= 0 && x < GAME_COLS && y >= 0 && y <= GAME_ROWS) {
        changeClassName(
          block,
          "stair " + stairNames[player.skins.stair],
          null,
          player.id
        );
      }
    });
  });
}

//좌표와 추가할 클래스이름, 삭제할 클래스이름
function changeClassName(location, addName = null, deleteName = null, id) {
  const x = location[0];
  const y = location[1];
  const playground = document.getElementById(id).querySelector("ul");
  const target = playground.childNodes[y].childNodes[0].childNodes[x];
  // if (!target.classList.contains("player")) {
  if (target.classList) target.classList = addName;
  else if (addName != null) target.classList.add(addName);
  if (deleteName != null) target.classList.remove(deleteName);
  // }
}
