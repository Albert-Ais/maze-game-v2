const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const { initQuestions, getRandomQuestion } = require("./questions");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

initQuestions();

const W = 25;
const H = 25;

let maze = [];
let players = {};
let keys = [];
let fragments = [];
let exit = { x: 0, y: 0, unlocked: false };

const activeQuiz = {};

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

// ===================== SAFE TILE =====================
function emptyTile() {
  let x, y;
  do {
    x = Math.floor(Math.random() * W);
    y = Math.floor(Math.random() * H);
  } while (!maze[y] || maze[y][x] === 1);
  return { x, y };
}

// ===================== SPAWN =====================
function spawn() {
  keys = [];
  fragments = [];

  for (let i = 0; i < 10; i++) {
    keys.push({ id: "k"+i, ...emptyTile(), subject:"math", collected:false });
    fragments.push({ id: "f"+i, ...emptyTile(), subject:"science", collected:false });
  }

  exit = emptyTile();
  exit.unlocked = false;
}

// ===================== RESET WORLD =====================
function resetWorld() {
  generateMaze();
  spawn();
}

resetWorld();

// ===================== DIST =====================
function dist(a,b){
  return Math.hypot(a.x-b.x,a.y-b.y);
}

// ===================== BROADCAST =====================
function send(room){
  io.to(room).emit("state", {
    players,
    maze,
    keys,
    fragments,
    exit
  });
}

// ===================== PICKUP =====================
function checkPickup(socket, p) {
  if (activeQuiz[socket.id]) return;

  for (const f of fragments) {
    if (!f.collected && dist(p,f) < 1.2) {
      activeQuiz[socket.id] = { type:"fragment", id:f.id };

      socket.emit("question", {
        type:"fragment",
        id:f.id,
        question:getRandomQuestion("math")
      });

      return;
    }
  }

  for (const k of keys) {
    if (!k.collected && dist(p,k) < 1.2) {
      activeQuiz[socket.id] = { type:"key", id:k.id };

      socket.emit("question", {
        type:"key",
        id:k.id,
        question:getRandomQuestion("math")
      });

      return;
    }
  }
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

    send(roomId);
  });

  socket.on("move", ({ x, y }) => {
    const p = players[socket.id];
    if (!p) return;

    if (maze[y]?.[x] === 1) return;

    p.x = x;
    p.y = y;

    checkPickup(socket, p);
    send(p.roomId);
  });

  socket.on("answer", ({ type, id, correct }) => {
    const p = players[socket.id];
    if (!p) return;

    const q = activeQuiz[socket.id];
    if (!q || q.id !== id) return;

    if (correct) {
      if (type === "fragment") {
        const f = fragments.find(x=>x.id===id);
        if (f) {
          f.collected = true;
          p.fragments++;
        }
      }

      if (type === "key") {
        const k = keys.find(x=>x.id===id);
        if (k) {
          k.collected = true;
          p.keys++;
        }
      }
    }

    delete activeQuiz[socket.id];
    send(p.roomId);
  });

  // 🌍 WOW MOMENT: regenerate maze
  socket.on("regenMaze", (roomId) => {
    resetWorld();

    io.to(roomId).emit("mazeRegen", { maze, keys, fragments, exit });

    io.to(roomId).emit("systemMessage", {
      text: "🌍 WORLD REBUILT!"
    });
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    delete activeQuiz[socket.id];
  });
});

// ===================== START =====================
server.listen(3000, () =>
  console.log("WOW MODE GAME RUNNING")
);