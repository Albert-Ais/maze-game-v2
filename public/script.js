const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===================== SETTINGS =====================
const TILE = 48;
const PLAYER_SIZE = 18;
const SPEED = 4;

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

// ===================== INPUT HANDLING =====================
document.addEventListener("keydown", (e) => keysPressed[e.key] = true);
document.addEventListener("keyup", (e) => keysPressed[e.key] = false);

// ===================== MOVEMENT =====================
function updateMovement() {
  const me = state.players[socket.id];
  if (!me) return;

  let nx = me.x;
  let ny = me.y;

  if (keysPressed["w"]) ny -= 1;
  if (keysPressed["s"]) ny += 1;
  if (keysPressed["a"]) nx -= 1;
  if (keysPressed["d"]) nx += 1;

  socket.emit("move", { x: nx, y: ny });

  // touch fragments
  for (const f of state.fragments || []) {
    if (f.x === nx && f.y === ny) {
      socket.emit("touchFragment", { fragmentId: f.id });
    }
  }

  // touch keys
  for (const k of state.keys || []) {
    if (k.x === nx && k.y === ny) {
      socket.emit("touchKey", { keyId: k.id });
    }
  }
}

// ===================== DRAW =====================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const me = state.players[socket.id];

  // smooth camera
  if (me) {
    camX += (me.x * TILE - camX - canvas.width / 2) * 0.15;
    camY += (me.y * TILE - camY - canvas.height / 2) * 0.15;
  }

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

  // ===================== KEYS (GLOW) =====================
  for (const k of state.keys || []) {
    ctx.shadowColor = colors[k.subject] || "white";
    ctx.shadowBlur = 15;

    ctx.fillStyle = colors[k.subject] || "white";

    ctx.fillRect(
      k.x * TILE - camX + TILE * 0.3,
      k.y * TILE - camY + TILE * 0.3,
      TILE * 0.4,
      TILE * 0.4
    );

    ctx.shadowBlur = 0;
  }

  // ===================== FRAGMENTS (GLOW) =====================
  for (const f of state.fragments || []) {
    ctx.shadowColor = colors[f.subject] || "yellow";
    ctx.shadowBlur = 18;

    ctx.fillStyle = colors[f.subject] || "yellow";

    ctx.fillRect(
      f.x * TILE - camX + TILE * 0.25,
      f.y * TILE - camY + TILE * 0.25,
      TILE * 0.5,
      TILE * 0.5
    );

    ctx.shadowBlur = 0;
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

    ctx.fillRect(
      p.x * TILE - camX + (TILE - PLAYER_SIZE) / 2,
      p.y * TILE - camY + (TILE - PLAYER_SIZE) / 2,
      PLAYER_SIZE,
      PLAYER_SIZE
    );
  }

  // ===================== FOG OF WAR (SMOOTH) =====================
  if (me) {
    ctx.save();

    ctx.fillStyle = "rgba(0,0,0,0.88)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = "destination-out";

    const px = me.x * TILE - camX + TILE / 2;
    const py = me.y * TILE - camY + TILE / 2;

    const radius = 260;

    const gradient = ctx.createRadialGradient(px, py, 40, px, py, radius);
    gradient.addColorStop(0, "rgba(0,0,0,1)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
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

// ===================== LOOP =====================
setInterval(updateMovement, 80);
draw();