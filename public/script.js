const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===================== SETTINGS =====================
const TILE = 48;
const PLAYER_SIZE = 18;

// movement tuning (AAA feel)
const INPUT_RATE = 60;
const SMOOTH = 0.18;

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

let inputX = 0;
let inputY = 0;

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

// ===================== JOIN =====================
function join() {
  socket.emit("joinRoom", {
    name: document.getElementById("name").value,
    roomId: document.getElementById("room").value
  });

  document.getElementById("menu").style.display = "none";
}

// ===================== SOCKET =====================
socket.on("state", (data) => {
  state = data;
});

socket.on("win", (data) => {
  alert("🏆 " + data.name + " escaped!");
});

// ===================== QUESTION UI =====================
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
document.addEventListener("keydown", (e) => {
  keysPressed[e.key] = true;
});

document.addEventListener("keyup", (e) => {
  keysPressed[e.key] = false;
});

// ===================== INPUT UPDATE =====================
function updateInput() {
  inputX = 0;
  inputY = 0;

  if (keysPressed["w"]) inputY -= 1;
  if (keysPressed["s"]) inputY += 1;
  if (keysPressed["a"]) inputX -= 1;
  if (keysPressed["d"]) inputX += 1;
}

// ===================== MOVEMENT (SMOOTH + CONTROLLED) =====================
let lastSendTime = 0;

function updateMovement() {
  const me = state.players[socket.id];
  if (!me) return;

  updateInput();

  const now = performance.now();

  if (now - lastSendTime < INPUT_RATE) return;

  if (inputX === 0 && inputY === 0) return;

  const nx = me.x + inputX;
  const ny = me.y + inputY;

  socket.emit("move", { x: nx, y: ny });

  lastSendTime = now;
}

// ===================== SMOOTH PLAYER RENDER =====================
function drawPlayer(p) {
  if (p.renderX === undefined) p.renderX = p.x;
  if (p.renderY === undefined) p.renderY = p.y;

  p.renderX += (p.x - p.renderX) * SMOOTH;
  p.renderY += (p.y - p.renderY) * SMOOTH;

  ctx.fillRect(
    p.renderX * TILE - camX + (TILE - PLAYER_SIZE) / 2,
    p.renderY * TILE - camY + (TILE - PLAYER_SIZE) / 2,
    PLAYER_SIZE,
    PLAYER_SIZE
  );
}

// ===================== DRAW LOOP =====================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const me = state.players[socket.id];

  // ===================== CAMERA FOLLOW =====================
  if (me) {
    const tx = (me.renderX ?? me.x) * TILE;
    const ty = (me.renderY ?? me.y) * TILE;

    camX += (tx - camX - canvas.width / 2) * 0.12;
    camY += (ty - camY - canvas.height / 2) * 0.12;
  }

  // ===================== BACKGROUND =====================
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ===================== MAZE =====================
  for (let y = 0; y < (state.maze || []).length; y++) {
    for (let x = 0; x < (state.maze[y] || []).length; x++) {
      if (state.maze[y][x] === 1) {
        ctx.fillStyle = "#2f2f2f";
        ctx.fillRect(
          x * TILE - camX,
          y * TILE - camY,
          TILE,
          TILE
        );
      }
    }
  }

  // ===================== KEYS =====================
  for (const k of state.keys || []) {
    ctx.fillStyle = colors[k.subject] || "white";
    ctx.fillRect(
      k.x * TILE - camX + TILE * 0.3,
      k.y * TILE - camY + TILE * 0.3,
      TILE * 0.4,
      TILE * 0.4
    );
  }

  // ===================== FRAGMENTS =====================
  for (const f of state.fragments || []) {
    ctx.fillStyle = colors[f.subject] || "yellow";
    ctx.fillRect(
      f.x * TILE - camX + TILE * 0.25,
      f.y * TILE - camY + TILE * 0.25,
      TILE * 0.5,
      TILE * 0.5
    );
  }

  // ===================== EXIT =====================
  if (state.exit) {
    ctx.fillStyle = state.exit.unlocked ? "lime" : "red";
    ctx.fillRect(
      state.exit.x * TILE - camX,
      state.exit.y * TILE - camY,
      TILE,
      TILE
    );
  }

  // ===================== PLAYERS =====================
  for (const id in state.players) {
    const p = state.players[id];

    ctx.fillStyle = "cyan";
    drawPlayer(p);
  }

  // ===================== HUD =====================
  if (me) {
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";

    ctx.fillText(`Keys: ${me.keys}/10`, 20, 30);
    ctx.fillText(`Fragments: ${me.fragments}/10`, 20, 60);
  }

  requestAnimationFrame(draw);
}

// ===================== START =====================
setInterval(updateMovement, 16);
draw();