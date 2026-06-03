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
  "math","english","biology","chemistry","physics",
  "economics","geography","business","computer_science","sociology"
];

// ===================== MAZE =====================
const W = 25;
const H = 25;

let maze = Array.from({ length: H }, () =>
  Array.from({ length: W }, () => 1)
);

// generate procedural maze
function carve(x, y) {
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]]
    .sort(() => Math.random() - 0.5);

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

// ===================== HELPERS =====================
function randomEmptyCell() {
  let x, y;

  do {
    x = Math.floor(Math.random() * W);
    y = Math.floor(Math.random() * H);
  } while (maze[y][x] === 1);

  return { x, y };
}

// ===================== PLAYERS =====================
const players = {};

// ===================== EXIT =====================
let exit = { x: W - 2, y: H - 2, unlocked: false };

// ===================== ITEM GENERATION =====================
function createItems() {
  const keys = [];
  const fragments = [];

  for (let i = 0; i < 10; i++) {
    const subject = SUBJECTS[i % SUBJECTS.length];

    let kPos = randomEmptyCell();
    let fPos = randomEmptyCell();

    keys.push({
      id: "k_" + i,
      x: kPos.x,
      y: kPos.y,
      subject,
      collected: false
    });

    fragments.push({
      id: "f_" + i,
      x: fPos.x,
      y: fPos.y,
      subject,
      collected: false
    });
  }

  return { keys, fragments };
}

// ===================== SOCKET =====================
io.on("connection", (socket) => {

  socket.on("joinRoom", ({ name, roomId }) => {
    socket.join(roomId);

    const items = createItems(); // NEW RANDOM WORLD EACH JOIN

    players[socket.id] = {
      id: socket.id,
      name,
      roomId,
      x: 1,
      y: 1,

      // smooth movement support
      renderX: 1,
      renderY: 1,

      keys: 0,
      fragments: 0,
      items
    };

    broadcast(roomId);
  });

  // ===================== MOVEMENT =====================
  socket.on("move", ({ x, y }) => {
    const p = players[socket.id];
    if (!p) return;

    if (maze[y]?.[x] === 1) return;

    p.x = x;
    p.y = y;

    const allItems = [...p.items.keys, ...p.items.fragments];

    for (const item of allItems) {
      if (!item.collected && item.x === x && item.y === y) {

        const question = getRandomQuestion(item.subject);

        socket.emit("question", {
          type: item.id.startsWith("k_") ? "key" : "fragment",
          id: item.id,
          question
        });
      }
    }

    checkWin(p);
    broadcast(p.roomId);
  });

  // ===================== ANSWER =====================
  socket.on("answer", ({ type, id, correct }) => {
    const p = players[socket.id];
    if (!p) return;

    const list = type === "key" ? p.items.keys : p.items.fragments;

    const item = list.find(i => i.id === id);
    if (!item || item.collected) return;

    if (correct) {
      item.collected = true;

      if (type === "key") p.keys++;
      if (type === "fragment") p.fragments++;
    }

    checkWin(p);
    broadcast(p.roomId);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("state", { players, maze, exit });
  });
});

// ===================== WIN CHECK =====================
function checkWin(p) {
  const allKeys = p.items.keys.every(k => k.collected);
  const allFragments = p.items.fragments.every(f => f.collected);

  if (allKeys && allFragments) {
    exit.unlocked = true;
  }

  if (p.x === exit.x && p.y === exit.y && exit.unlocked) {
    io.to(p.roomId).emit("win", { name: p.name });
  }
}

// ===================== BROADCAST =====================
function broadcast(roomId) {
  io.to(roomId).emit("state", {
    players,
    maze,
    exit
  });
}

// ===================== START =====================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Maze running on port", PORT);
});