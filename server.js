const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const { initQuestions, getRandomQuestion } = require("./questions");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

initQuestions();

// ===================== SUBJECTS =====================
const SUBJECTS = [
  "math",
  "english",
  "biology",
  "chemistry",
  "physics",
  "economics",
  "geography",
  "business",
  "computer_science",
  "sociology"
];

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

// ===================== SAFE SPAWN =====================
function getRandomEmptyCell() {
  let x, y;

  do {
    x = Math.floor(Math.random() * W);
    y = Math.floor(Math.random() * H);
  } while (maze[y][x] === 1);

  return { x, y };
}

// ===================== GAME STATE =====================
const players = {};

// 🔥 anti-exploit lock system
const activeLocks = {};

// ===================== KEYS + FRAGMENTS =====================
let keys = [];
let fragments = [];

for (const subject of SUBJECTS) {
  const k = getRandomEmptyCell();
  const f = getRandomEmptyCell();

  keys.push({
    id: "k_" + subject,
    subject,
    x: k.x,
    y: k.y
  });

  fragments.push({
    id: "f_" + subject,
    subject,
    x: f.x,
    y: f.y
  });
}

// ===================== EXIT =====================
let exit = { x: W - 2, y: H - 2, unlocked: false };

// ===================== CHECK WIN CONDITION =====================
function checkUnlock() {
  if (keys.length === 0 && fragments.length === 0) {
    exit.unlocked = true;
  }
}

// ===================== SOCKET =====================
io.on("connection", (socket) => {

  // ===================== JOIN =====================
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

    activeLocks[socket.id] = new Set();

    broadcast(roomId);
  });

  // ===================== MOVE =====================
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

  // ===================== TOUCH FRAGMENT =====================
  socket.on("touchFragment", ({ fragmentId }) => {
    const p = players[socket.id];
    const f = fragments.find(x => x.id === fragmentId);

    if (!p || !f) return;

    // 🚫 anti spam / farming
    if (activeLocks[socket.id].has(fragmentId)) return;

    activeLocks[socket.id].add(fragmentId);

    const question = getRandomQuestion(f.subject);

    socket.emit("question", {
      type: "fragment",
      id: fragmentId,
      question
    });
  });

  // ===================== TOUCH KEY =====================
  socket.on("touchKey", ({ keyId }) => {
    const p = players[socket.id];
    const k = keys.find(x => x.id === keyId);

    if (!p || !k) return;

    if (activeLocks[socket.id].has(keyId)) return;

    activeLocks[socket.id].add(keyId);

    const question = getRandomQuestion(k.subject);

    socket.emit("question", {
      type: "key",
      id: keyId,
      question
    });
  });

  // ===================== ANSWER =====================
  socket.on("answer", ({ type, id, correct }) => {
    const p = players[socket.id];
    if (!p) return;

    // unlock interaction
    if (activeLocks[socket.id]) {
      activeLocks[socket.id].delete(id);
    }

    if (type === "fragment") {
      if (correct) {
        fragments = fragments.filter(f => f.id !== id);
        p.fragments++;
      }
    }

    if (type === "key") {
      if (correct) {
        keys = keys.filter(k => k.id !== id);
        p.keys++;
      }
    }

    checkUnlock();
    broadcast(p.roomId);
  });

  // ===================== DISCONNECT =====================
  socket.on("disconnect", () => {
    delete players[socket.id];
    delete activeLocks[socket.id];
  });

});

// ===================== BROADCAST =====================
function broadcast(roomId) {
  io.to(roomId).emit("state", {
    players,
    maze,
    keys,
    fragments,
    exit
  });
}

// ===================== START =====================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Maze running on port", PORT);
});