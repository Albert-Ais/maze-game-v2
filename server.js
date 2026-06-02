const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const { initQuestions, getRandomQuestion } = require("./questions");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

initQuestions();

// ===================== MAP =====================
const W = 25;
const H = 25;

// 1 = wall, 0 = path
let maze = Array.from({ length: H }, () =>
  Array.from({ length: W }, () => 1)
);

function carve(x, y) {
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]].sort(() => Math.random() - 0.5);

  maze[y][x] = 0;

  for (const [dx, dy] of dirs) {
    const nx = x + dx * 2;
    const ny = y + dy * 2;

    if (ny > 0 && ny < H && nx > 0 && nx < W && maze[ny][nx] === 1) {
      maze[y + dy][x + dx] = 0;
      carve(nx, ny);
    }
  }
}

carve(1, 1);

// ===================== GAME STATE =====================
const players = {};

let fragments = [
  { id: 1, x: 3, y: 3, color: "math" },
  { id: 2, x: 7, y: 4, color: "english" },
  { id: 3, x: 11, y: 8, color: "biology" },
  { id: 4, x: 15, y: 10, color: "chemistry" }
];

let exit = { x: W - 2, y: H - 2, unlocked: false };

// ===================== SOCKET =====================
io.on("connection", (socket) => {

  socket.on("joinRoom", ({ name, roomId }) => {
    socket.join(roomId);

    players[socket.id] = {
      id: socket.id,
      name,
      roomId,
      x: 1,
      y: 1,
      fragments: 0
    };

    broadcast(roomId);
  });

  socket.on("move", ({ x, y }) => {
    const p = players[socket.id];
    if (!p) return;

    if (maze[y]?.[x] === 1) return;

    p.x = x;
    p.y = y;

    if (p.x === exit.x && p.y === exit.y && exit.unlocked) {
      io.to(p.roomId).emit("win", { name: p.name });
    }

    broadcast(p.roomId);
  });

  socket.on("touchFragment", ({ fragmentId }) => {
    const p = players[socket.id];
    const f = fragments.find(x => x.id === fragmentId);
    if (!p || !f) return;

    const question = getRandomQuestion(f.color, p.roomId);

    socket.emit("question", {
      fragmentId,
      question
    });
  });

  socket.on("answer", ({ fragmentId, correct }) => {
    const p = players[socket.id];
    if (!p) return;

    if (correct) {
      p.fragments++;
      fragments = fragments.filter(f => f.id !== fragmentId);
    }

    if (fragments.length === 0) {
      exit.unlocked = true;
    }

    broadcast(p.roomId);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("state", { players, fragments, maze, exit });
  });

});

function broadcast(roomId) {
  io.to(roomId).emit("state", {
    players,
    fragments,
    maze,
    exit
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Maze running on port", PORT);
});