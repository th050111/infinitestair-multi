const express = require("express");
const appEx = express();
const app = require("http").Server(appEx);
const io = require("socket.io")(app);
const fs = require("fs");
const single = io.of("/single");

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
  const player = new Player(socket.id);
  players.push(player);
  playerMap[socket.id] = player;
  joinRoom(socket.id, player.room);
  return player;
}

//player 클래스
class Player {
  constructor(id) {
    this.id = id;
    this.stairs = [];
    this.playerMoment = 0;
    this.skins = {
      background: 0,
      player: 0,
      stair: 0,
    };
    this.room = "ready";
  }
}

//플레이어들의 정보저장
const players = [];
const playerMap = {};

//룸
const rooms = {
  ready: {
    players: [],
  },
};

function endGame(socket) {
  for (var i = 0; i < players.length; i++) {
    if (players[i].id == socket.id) {
      players.splice(i, 1);
      break;
    }
  }
  leaveRoom(socket.id);
  delete playerMap[socket.id];
}

function leaveRoom(id) {
  const currentRoom = playerMap[id].room;
  if (!rooms[currentRoom]) return;
  for (var i = 0; i < rooms[currentRoom].players.length; i++) {
    if (rooms[currentRoom].players[i].id == id) {
      rooms[currentRoom].players.splice(i, 1);
      break;
    }
  }
  for (var i = 0; i < players.length; i++) {
    if (players[i].id == id) {
      players[i].room = "ready";
      break;
    }
  }
  playerMap[id].room = "ready";
  if (rooms[currentRoom].players.length <= 0) delete rooms[currentRoom];
  return currentRoom;
}
//동시간에 되면 어떨지 생각
function joinRoom(id, name) {
  const currentRoom = leaveRoom(id);
  if (!rooms[name]) rooms[name] = { players: [], name };
  const currentPlayers = rooms[name].players;
  playerMap[id].room = name;
  currentPlayers.push(playerMap[id]);
  rooms[name].players = currentPlayers;

  for (var i = 0; i < players.length; i++) {
    if (players[i].id == id) {
      players[i].room = name;
      break;
    }
  }
}

//소켓에 연결시

io.on("connection", (socket) => {
  console.log(`${socket.id}님이 입장하셨습니다`);

  socket.on("disconnect", function (reason) {
    //접속이 끊어졋을때

    console.log(`${socket.id}님이 ${reason}의 이유로 퇴장하셨습니다. `);
    endGame(socket);
    socket.broadcast.emit("leave_user", socket.id); //나를 제외한 다른 소켓 클라이언트들에게 이벤트 보내기 가능
  });

  const newPlayer = joinGame(socket);

  socket.on("join-room", (name) => {
    leaveRoom(socket.id);
    joinRoom(socket.id, name);
  });
  socket.on("get-room", (func) => {
    console.log(func)
    func(rooms)
  });
  // socket.emit("user_id", socket.id);
  // //현재 접속중인 플레이어 얻어오기
  // for (let i = 0; i < players.length; i++) {
  //   let player = players[i];
  //   socket.emit("join_user", {
  //     id: player.id,
  //     stairs: player.stairs,
  //     skins: player.skins,
  //   });
  // }

  // //자신외의 클라이언트들에 새로운 유저 알림
  // socket.broadcast.emit("join_user", {
  //   id: socket.id,
  //   skins: newPlayer.skins,
  // });
  // socket.emit("start");
  // //stairs 변경요청을 받았을때
  // socket.on("send_stairs", function (stringData) {
  //   const data = JSON.parse(stringData);
  //   socket.broadcast.emit("update_state", {
  //     id: data.id,
  //     stairs: data.stairs,
  //     skins: data.skins,
  //   });
  //   for (let i = 0; i < players.length; i++) {
  //     if (players[i].id == data.id) {
  //       players[i].stairs = data.stairs;
  //       players[i].skins = data.skins;
  //       break;
  //     }
  //   }
  //   playerMap[data.id].stair = data.stairs;
  //   playerMap[data.id].skins = data.skins;
  // });
});

single.on("connection", (socket) => {
  console.log(`single서버로 ${socket.id}님이 접속 하셨습니다`);
  const newPlayer = joinGame(socket);
  socket.emit("user_id", socket.id);
  socket.emit("join_user", {
    id: newPlayer.id,
    stairs: newPlayer.stairs,
    skins: newPlayer.skins,
  });
  socket.emit("start");
  //stairs 변경요청을 받았을때
  socket.on("send_stairs", function (stringData) {
    const data = JSON.parse(stringData);
  });
});
