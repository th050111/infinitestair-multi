const express = require("express");
const appEx = express();
const app = require("http").Server(appEx);
const io = require("socket.io")(app);
const fs = require("fs");

app.listen(8080);

appEx.use("/views", express.static(__dirname + "/views"));

//서버에 요청이 왔을 시
appEx.get("/game", (req, res) => {
  res.sendFile(__dirname + "/views/game.html");
});
appEx.get("/home", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
//새로운 플레이어 추가
function joinGame(socket) {
  const player = new Player(socket);

  players.push(player);
  playerMap[socket.id] = player;

  return player;
}

//player 클래스
class Player {
  constructor(socket) {
    this.socket = socket;
    this.stairs = [];
    this.playerMoment = 0;
    this.skins = {
      background: 0,
      player: 0,
      stair: 0,
    };
  }

  get id() {
    return this.socket.id;
  }
}

//플레이어들의 정보저장
const players = [];
const playerMap = {};

function endGame(socket) {
  for (var i = 0; i < players.length; i++) {
    if (players[i].id == socket.id) {
      players.splice(i, 1);
      break;
    }
  }
  delete playerMap[socket.id];
}

//소켓에 연결시

io.on("connection", (socket) => {
  console.log(`${socket.id}님이 입장하셨습니다`);

  socket.on("disconnect", function (reason) {
    //접속이 끊어졋을때
    console.log(`${socket.id}님이 ${reason}의 이유로 퇴장하셨습니다. `);
    endGame(socket);
    socket.broadcast.emit("leave_user", socket.id); //나를 제외한 다른 ㅅ켓 클라이언트들에게 이벤트 보내기 가능
  });

  const newPlayer = joinGame(socket);
  socket.emit("user_id", socket.id);

  //현재 접속중인 플레이어 얻어오기
  for (let i = 0; i < players.length; i++) {
    let player = players[i];
    socket.emit("join_user", {
      id: player.id,
      stairs: player.stairs,
      skins: player.skins,
    });
  }

  //자신외의 클라이언트들에 새로운 유저 알림
  socket.broadcast.emit("join_user", {
    id: socket.id,
    skins: newPlayer.skins,
  });
  socket.emit("start");
  //stairs 변경요청을 받았을때
  socket.on("send_stairs", function (stringData) {
    const data = JSON.parse(stringData);
    socket.broadcast.emit("update_state", {
      id: data.id,
      stairs: data.stairs,
      skins: data.skins,
    });
    for (let i = 0; i < players.length; i++) {
      if (players[i].id == data.id) {
        players[i].stairs = data.stairs;
        players[i].skins = data.skins;
        break;
      }
    }
    playerMap[data.id] = data.stairs;
    playerMap[data.id] = data.skins;
  });
});
