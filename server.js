const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const { initQuestions, getRandomQuestion } = require("./questions");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

initQuestions();

// ===================== GAME STATE =====================
const players = {};

const W = 25;
const H = 25;

// simple maze (safe fallback)
let maze = Array.from({ length: H }, (_, y) =>
  Array.from({ length: W }, (_, x) =>
    x === 0 || y === 0 || x === W - 1 || y === H - 1 ? 1 : 0
  )
);

let fragments = [
  { id: 1, x: 3, y: 3, color: "math" },
  { id: 2, x: 6, y: 5, color: "english" },
  { id: 3, x: 10, y: 7, color: "biology" },
  { id: 4, x: 15, y: 10, color: "chemistry" }
];

let exit = { x: W - 3, y: H - 3, unlocked: false };

// ===================== SOCKET =====================
io.on("connection", (socket) => {

  socket.on("joinRoom", ({ name, roomId }) => {
    socket.join(roomId);

    players[socket.id] = {
      id: socket.id,
      name,
      roomId,
      x: 2,
      y: 2,
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

// ===================== BROADCAST =====================
function broadcast(roomId) {
  io.to(roomId).emit("state", {
    players,
    fragments,
    maze,
    exit
  });
}

// ===================== RENDER PORT FIX =====================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Maze server running on port", PORT);
});