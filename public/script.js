const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

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

// ===================== PLAY BUTTON FIX =====================
window.join = function () {
  const name = document.getElementById("name")?.value;
  const room = document.getElementById("room")?.value;

  if (!name || !room) {
    alert("Enter name + room ID");
    return;
  }

  socket.emit("joinRoom", {
    name,
    roomId: room
  });

  document.getElementById("menu").style.display = "none";
};

// ===================== SOCKET =====================
socket.on("state", (data) => {
  state = data;
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
document.addEventListener("keydown", (e) => keysPressed[e.key.toLowerCase()] = true);
document.addEventListener("keyup", (e) => keysPressed[e.key.toLowerCase()] = false);

// ===================== MOVE =====================
let lastMove = 0;

function updateMovement() {
  const me = state.players[socket.id];
  if (!me) return;

  const now = performance.now();
  if (now - lastMove < 80) return;

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

  ctx.fillStyle = "cyan";
  ctx.fillRect(
    p.rx * 48 - camX + 15,
    p.ry * 48 - camY + 15,
    18,
    18
  );
}

// ===================== DRAW =====================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const me = state.players[socket.id];

  if (me) {
    camX += (me.x * 48 - camX - canvas.width / 2) * 0.12;
    camY += (me.y * 48 - camY - canvas.height / 2) * 0.12;
  }

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // maze
  for (let y = 0; y < (state.maze || []).length; y++) {
    for (let x = 0; x < (state.maze[y] || []).length; x++) {
      if (state.maze[y][x] === 1) {
        ctx.fillStyle = "#2b2b2b";
        ctx.fillRect(x * 48 - camX, y * 48 - camY, 48, 48);
      }
    }
  }

  // keys
  for (const k of state.keys || []) {
    ctx.fillStyle = colors[k.subject] || "white";
    ctx.fillRect(k.x * 48 - camX + 18, k.y * 48 - camY + 18, 12, 12);
  }

  // fragments
  for (const f of state.fragments || []) {
    ctx.fillStyle = colors[f.subject] || "yellow";
    ctx.fillRect(f.x * 48 - camX + 16, f.y * 48 - camY + 16, 16, 16);
  }

  // players
  for (const id in state.players) {
    drawPlayer(state.players[id]);
  }

  // HUD
  if (me) {
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText(`Keys: ${me.keys}/10`, 20, 30);
    ctx.fillText(`Fragments: ${me.fragments}/10`, 20, 55);
  }

  requestAnimationFrame(draw);
}

// ===================== START =====================
setInterval(updateMovement, 80);
draw();