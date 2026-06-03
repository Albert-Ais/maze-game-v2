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
let exit;

// ===================== MAZE =====================
function generateMaze() {
  maze = Array.from({ length: H }, () =>
    Array.from({ length: W }, () => 1)
  );

  function carve(x, y) {
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]].sort(() => Math.random() - 0.5);

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

// ===================== SAFE SPAWN =====================
function emptyTile() {
  let x, y;
  do {
    x = Math.floor(Math.random() * W);
    y = Math.floor(Math.random() * H);
  } while (maze[y][x] === 1);
  return { x, y };
}

// ===================== SPAWN ITEMS =====================
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

// ===================== RESET WORLD =====================
function resetWorld() {
  generateMaze();
  spawnItems();

  exit = {
    x: W - 2,
    y: H - 2,
    unlocked: false
  };
}

resetWorld();

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

// ===================== PICKUP TRIGGER =====================
function tryPickup(socket, p) {
  for (const f of fragments) {
    if (!f.collected && f.x === p.x && f.y === p.y) {
      socket.emit("question", {
        type: "fragment",
        id: f.id,
        question: getRandomQuestion(f.subject)
      });
    }
  }

  for (const k of keys) {
    if (!k.collected && k.x === p.x && k.y === p.y) {
      socket.emit("question", {
        type: "key",
        id: k.id,
        question: getRandomQuestion(k.subject)
      });
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

    tryPickup(socket, players[socket.id]);
    broadcast(roomId);
  });

  socket.on("move", ({ x, y }) => {
    const p = players[socket.id];
    if (!p) return;

    if (maze[y]?.[x] === 1) return;

    p.x = x;
    p.y = y;

    tryPickup(socket, p);
    broadcast(p.roomId);
  });

  // ===================== FIXED ANSWER SYSTEM =====================
  socket.on("answer", ({ type, id, correct }) => {
    const p = players[socket.id];
    if (!p) return;

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

    broadcast(p.roomId);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
  });
});

// ===================== START =====================
server.listen(3000, () => {
  console.log("Maze running on port 3000");
});