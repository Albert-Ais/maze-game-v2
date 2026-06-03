const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===================== SETTINGS =====================
const TILE = 48;
const PLAYER_SIZE = 18;

// ===================== STATE =====================
let state = {
  players: {},
  maze: [],
  keys: [],
  fragments: [],
  exit: {}
};

// ===================== INPUT =====================
const keysPressed = {};

// ===================== CAMERA =====================
let camX = 0;
let camY = 0;

// ===================== COLORS =====================
const colors = {
  math: "red",
  english: "dodgerblue",
  biology: "limegreen",
  chemistry: "violet",
  physics: "orange",
  economics: "hotpink",
  geography: "cyan",
  business: "gold",
  computer_science: "white",
  sociology: "lime"
};

// ===================== SOCKET =====================
socket.on("state", (data) => {
  state = data;
});

socket.on("question", (data) => {
  const box = document.getElementById("questionBox");
  const q = document.getElementById("q");
  const opts = document.getElementById("opts");

  box.classList.remove("hidden");

  q.innerText = data.question.q;
  opts.innerHTML = "";

  data.question.options.forEach((o, i) => {
    const btn = document.createElement("button");
    btn.innerText = o;

    btn.onclick = () => {
      socket.emit("answer", {
        type: data.type,
        id: data.id,
        correct: i === data.question.answer
      });

      box.classList.add("hidden");
    };

    opts.appendChild(btn);
  });
});

// ===================== INPUT =====================
document.addEventListener("keydown", (e) => keysPressed[e.key] = true);
document.addEventListener("keyup", (e) => keysPressed[e.key] = false);

// ===================== MOVE =====================
let lastMove = 0;

function updateMovement() {
  const me = state.players[socket.id];
  if (!me) return;

  const now = performance.now();
  if (now - lastMove < 90) return;

  let nx = me.x;
  let ny = me.y;

  if (keysPressed["w"]) ny--;
  else if (keysPressed["s"]) ny++;
  else if (keysPressed["a"]) nx--;
  else if (keysPressed["d"]) nx++;

  if (nx !== me.x || ny !== me.y) {
    socket.emit("move", { x: nx, y: ny });
    lastMove = now;
  }
}

// ===================== DRAW PLAYER =====================
function drawPlayer(p) {
  if (p.rx === undefined) p.rx = p.x;
  if (p.ry === undefined) p.ry = p.y;

  p.rx += (p.x - p.rx) * 0.2;
  p.ry += (p.y - p.ry) * 0.2;

  ctx.fillRect(
    p.rx * TILE - camX + (TILE - PLAYER_SIZE) / 2,
    p.ry * TILE - camY + (TILE - PLAYER_SIZE) / 2,
    PLAYER_SIZE,
    PLAYER_SIZE
  );
}

// ===================== DRAW =====================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const me = state.players[socket.id];

  if (me) {
    camX += (me.x * TILE - camX - canvas.width / 2) * 0.12;
    camY += (me.y * TILE - camY - canvas.height / 2) * 0.12;
  }

  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // maze
  for (let y = 0; y < (state.maze || []).length; y++) {
    for (let x = 0; x < (state.maze[y] || []).length; x++) {
      if (state.maze[y][x] === 1) {
        ctx.fillStyle = "#2f2f2f";
        ctx.fillRect(x * TILE - camX, y * TILE - camY, TILE, TILE);
      }
    }
  }

  // keys
  for (const k of state.keys || []) {
    ctx.fillStyle = colors[k.subject] || "white";
    ctx.fillRect(
      k.x * TILE - camX + TILE * 0.3,
      k.y * TILE - camY + TILE * 0.3,
      TILE * 0.4,
      TILE * 0.4
    );
  }

  // fragments
  for (const f of state.fragments || []) {
    ctx.fillStyle = colors[f.subject] || "yellow";
    ctx.fillRect(
      f.x * TILE - camX + TILE * 0.25,
      f.y * TILE - camY + TILE * 0.25,
      TILE * 0.5,
      TILE * 0.5
    );
  }

  // players
  for (const id in state.players) {
    const p = state.players[id];
    ctx.fillStyle = "cyan";
    drawPlayer(p);
  }

  // HUD
  if (me) {
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText(`Keys: ${me.keys}/10`, 20, 30);
    ctx.fillText(`Fragments: ${me.fragments}/10`, 20, 60);
  }

  requestAnimationFrame(draw);
}

// ===================== LOOP =====================
setInterval(updateMovement, 80);
draw();