const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const TILE = 30;

let state = { players: {}, fragments: [], maze: [], exit: {} };

// JOIN
function join() {
  socket.emit("joinRoom", {
    name: document.getElementById("name").value,
    roomId: document.getElementById("room").value
  });

  document.getElementById("menu").style.display = "none";
}

// STATE UPDATE
socket.on("state", (data) => {
  state = data;
});

// QUESTION
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
        fragmentId: data.fragmentId,
        correct: i === data.question.answer
      });

      box.classList.add("hidden");
    };

    opts.appendChild(btn);
  });
});

// MOVEMENT + COLLISION CHECK
document.addEventListener("keydown", (e) => {
  const me = state.players[socket.id];
  if (!me) return;

  let nx = me.x;
  let ny = me.y;

  if (e.key === "w") ny--;
  if (e.key === "s") ny++;
  if (e.key === "a") nx--;
  if (e.key === "d") nx++;

  socket.emit("move", { x: nx, y: ny });

  // fragment touch
  for (const f of state.fragments) {
    if (f.x === nx && f.y === ny) {
      socket.emit("touchFragment", { fragmentId: f.id });
    }
  }
});

// ===================== DRAW MAZE =====================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // SAFETY CHECK (prevents blank crash)
  if (!state.maze) {
    requestAnimationFrame(draw);
    return;
  }

  // DRAW MAZE WALLS
  for (let y = 0; y < state.maze.length; y++) {
    for (let x = 0; x < state.maze[y].length; x++) {
      if (state.maze[y][x] === 1) {
        ctx.fillStyle = "#333";
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    }
  }

  // FRAGMENTS
  for (const f of state.fragments) {
    ctx.fillStyle = "yellow";
    ctx.fillRect(f.x * TILE, f.y * TILE, TILE / 2, TILE / 2);
  }

  // EXIT
  if (state.exit) {
    ctx.fillStyle = state.exit.unlocked ? "lime" : "red";
    ctx.fillRect(state.exit.x * TILE, state.exit.y * TILE, TILE, TILE);
  }

  // PLAYERS
  for (const id in state.players) {
    const p = state.players[id];

    ctx.fillStyle = "cyan";
    ctx.fillRect(p.x * TILE, p.y * TILE, TILE, TILE);

    ctx.fillStyle = "white";
    ctx.fillText(p.name, p.x * TILE, p.y * TILE - 5);
  }

  requestAnimationFrame(draw);
}

draw();