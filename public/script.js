const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let state = { players: {}, fragments: [] };

function join() {
  socket.emit("joinRoom", {
    name: document.getElementById("name").value,
    roomId: document.getElementById("room").value
  });

  document.getElementById("menu").style.display = "none";
}

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
        fragmentId: data.fragmentId,
        correct: i === data.question.answer
      });

      box.classList.add("hidden");
    };

    opts.appendChild(btn);
  });
});

// movement + touch detection
document.addEventListener("keydown", (e) => {
  const me = state.players[socket.id];
  if (!me) return;

  if (e.key === "w") me.x = me.x, me.y--;
  if (e.key === "s") me.y++;
  if (e.key === "a") me.x--;
  if (e.key === "d") me.x++;

  socket.emit("move", { x: me.x, y: me.y });

  for (const f of state.fragments) {
    if (f.x === me.x && f.y === me.y) {
      socket.emit("touchFragment", { fragmentId: f.id });
    }
  }
});

// DRAW LOOP (NO GRAY SCREEN)
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // grid maze
  ctx.strokeStyle = "#222";
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 30, 0);
    ctx.lineTo(i * 30, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * 30);
    ctx.lineTo(canvas.width, i * 30);
    ctx.stroke();
  }

  // fragments
  for (const f of state.fragments) {
    ctx.fillStyle = "yellow";
    ctx.fillRect(f.x * 30, f.y * 30, 20, 20);
  }

  // players
  for (const id in state.players) {
    const p = state.players[id];

    ctx.fillStyle = "cyan";
    ctx.fillRect(p.x * 30, p.y * 30, 20, 20);

    ctx.fillStyle = "white";
    ctx.fillText(p.name, p.x * 30, p.y * 30 - 5);
  }

  requestAnimationFrame(draw);
}

draw();