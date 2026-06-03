const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const { initQuestions, getRandomQuestion } = require("./questions");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

initQuestions();

// ===================== MAZE =====================
const W = 25;
const H = 25;

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

// ===================== SUBJECTS =====================
const SUBJECTS = [
  "math","english","biology","chemistry","physics",
  "economics","geography","business","computer_science","sociology"
];

// ===================== PLAYERS =====================
const players = {};

// ===================== EXIT =====================
let exit = { x: W - 2, y: H - 2, unlocked: false };

// ===================== ITEMS =====================
let keys = [];
let fragments = [];

function spawnItems() {
  keys = [];
  fragments = [];

  for (let i = 0; i < 10; i++) {
    const subject = SUBJECTS[i];

    keys.push({
      id: "k" + i,
      x: Math.floor(Math.random() * W),
      y: Math.floor(Math.random() * H),
      subject,
      collected: false
    });

    fragments.push({
      id: "f" + i,
      x: Math.floor(Math.random() * W),
      y: Math.floor(Math.random() * H),
      subject,
      collected: false
    });
  }

  // ensure not in walls
  keys = keys.filter(k => maze[k.y]?.[k.x] === 0);
  fragments = fragments.filter(f => maze[f.y]?.[f.x] === 0);
}

spawnItems();

// ===================== STATE SEND =====================
function broadcast(roomId) {
  io.to(roomId).emit("state", {
    players,
    maze,
    exit,
    keys,
    fragments
  });
}

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
      keys: 0,
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

    // check keys
    for (const k of keys) {
      if (!k.collected && k.x === x && k.y === y) {
        socket.emit("question", {
          type: "key",
          id: k.id,
          question: getRandomQuestion(k.subject)
        });
      }
    }

    // check fragments
    for (const f of fragments) {
      if (!f.collected && f.x === x && f.y === y) {
        socket.emit("question", {
          type: "fragment",
          id: f.id,
          question: getRandomQuestion(f.subject)
        });
      }
    }

    broadcast(p.roomId);
  });

  socket.on("answer", ({ type, id, correct }) => {
    const p = players[socket.id];
    if (!p) return;

    const list = type === "key" ? keys : fragments;
    const item = list.find(i => i.id === id);

    if (!item || item.collected) return;

    if (correct) {
      item.collected = true;

      if (type === "key") p.keys++;
      if (type === "fragment") p.fragments++;
    }

    broadcast(p.roomId);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Maze running on port", PORT);
});