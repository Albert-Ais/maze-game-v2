const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const { initQuestions, getRandomQuestion } = require("./questions");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

initQuestions();

// ===================== WORLD =====================
const W = 25;
const H = 25;

const SUBJECTS = [
  "math","english","biology","chemistry","physics",
  "economics","geography","business","computer_science","sociology"
];

let maze = [];
let players = {};
let keys = [];
let fragments = [];
let exit = null;

// ===================== AAA SETTINGS =====================
const PICKUP_RADIUS = 0.75;
const activeQuiz = {};
const cooldown = {};

// ===================== MAZE =====================
function generateMaze() {
  maze = Array.from({ length: H }, () =>
    Array.from({ length: W }, () => 1)
  );

  function carve(x, y) {
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]]
      .sort(() => Math.random() - 0.5);

    maze[y][x] = 0;

    for (const [dx, dy] of dirs) {
      const nx = x + dx * 2;
      const ny = y + dy * 2;

      if (maze[ny]?.[nx] === 1) {
        maze[y + dy][x + dx] = 0;
        carve(nx, ny);
      }
    }
  }

  carve(1, 1);
}

// ===================== SPAWN =====================
function emptyTile() {
  let x, y;
  do {
    x = Math.floor(Math.random() * W);
    y = Math.floor(Math.random() * H);
  } while (!maze[y] || maze[y][x] === 1);
  return { x, y };
}

function spawnItems() {
  keys = [];
  fragments = [];

  for (let i = 0; i < 10; i++) {
    keys.push({
      id: "k" + i,
      ...emptyTile(),
      subject: SUBJECTS[i],
      collected: false
    });

    fragments.push({
      id: "f" + i,
      ...emptyTile(),
      subject: SUBJECTS[i],
      collected: false
    });
  }
}

function resetWorld() {
  generateMaze();
  spawnItems();

  exit = { x: W - 2, y: H - 2, unlocked: false };
}

resetWorld();

// ===================== UTIL =====================
function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ===================== PICKUP SYSTEM =====================
function checkPickup(socket, p) {
  if (activeQuiz[socket.id]) return;
  if (cooldown[socket.id] && Date.now() - cooldown[socket.id] < 300) return;

  for (const f of fragments) {
    if (!f.collected && dist(p, f) <= PICKUP_RADIUS) {
      activeQuiz[socket.id] = { type: "fragment", id: f.id };
      socket.emit("question", {
        type: "fragment",
        id: f.id,
        question: getRandomQuestion(f.subject)
      });
      cooldown[socket.id] = Date.now();
      return;
    }
  }

  for (const k of keys) {
    if (!k.collected && dist(p, k) <= PICKUP_RADIUS) {
      activeQuiz[socket.id] = { type: "key", id: k.id };
      socket.emit("question", {
        type: "key",
        id: k.id,
        question: getRandomQuestion(k.subject)
      });
      cooldown[socket.id] = Date.now();
      return;
    }
  }
}

// ===================== BROADCAST =====================
function broadcast(room) {
  io.to(room).emit("state", {
    players,
    maze,
    keys,
    fragments,
    exit
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

    checkPickup(socket, players[socket.id]);
    broadcast(roomId);
  });

  socket.on("move", ({ x, y }) => {
    const p = players[socket.id];
    if (!p) return;

    if (maze[y]?.[x] === 1) return;

    p.x = x;
    p.y = y;

    checkPickup(socket, p);
    broadcast(p.roomId);
  });

  socket.on("answer", ({ type, id, correct }) => {
    const p = players[socket.id];
    if (!p) return;

    const q = activeQuiz[socket.id];
    if (!q || q.id !== id) return;

    if (correct) {
      if (type === "fragment") {
        const f = fragments.find(x => x.id === id);
        if (f && !f.collected) {
          f.collected = true;
          p.fragments++;
        }
      }

      if (type === "key") {
        const k = keys.find(x => x.id === id);
        if (k && !k.collected) {
          k.collected = true;
          p.keys++;
        }
      }
    }

    delete activeQuiz[socket.id];
    broadcast(p.roomId);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    delete activeQuiz[socket.id];
    delete cooldown[socket.id];
  });
});

// ===================== START =====================
server.listen(process.env.PORT || 3000, () =>
  console.log("AAA Maze Game Running")
);