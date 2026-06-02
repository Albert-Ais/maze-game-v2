const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const TILE = 30;

let state = { players: {}, fragments: [], maze: [], exit: {} };

let camX = 0;
let camY = 0;

const colors = {
  math:"red",
  english:"blue",
  biology:"green",
  chemistry:"purple",
  physics:"orange",
  economics:"pink",
  geography:"cyan",
  business:"yellow",
  computer_science:"white",
  sociology:"lime"
};

function join() {
  socket.emit("joinRoom", {
    name: document.getElementById("name").value,
    roomId: document.getElementById("room").value
  });

  document.getElementById("menu").style.display = "none";
}

socket.on("state", (data) => state = data);

socket.on("win", (data) => {
  alert(data.name + " escaped!");
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

  for (const f of state.fragments) {
    if (f.x === nx && f.y === ny) {
      socket.emit("touchFragment", { fragmentId: f.id });
    }
  }
});

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#000";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  const me = state.players[socket.id];

  if (me) {
    camX += (me.x*TILE - camX - canvas.width/2)*0.1;
    camY += (me.y*TILE - camY - canvas.height/2)*0.1;
  }

  // maze
  if (state.maze) {
    for (let y=0;y<state.maze.length;y++) {
      for (let x=0;x<state.maze[y].length;x++) {
        if (state.maze[y][x] === 1) {
          ctx.fillStyle="#444";
          ctx.fillRect(x*TILE-camX,y*TILE-camY,TILE,TILE);
        }
      }
    }
  }

  // fragments
  for (const f of state.fragments) {
    ctx.fillStyle = colors[f.subject] || "yellow";
    ctx.fillRect(f.x*TILE-camX,f.y*TILE-camY,TILE/2,TILE/2);
  }

  // exit
  if (state.exit) {
    ctx.fillStyle = state.exit.unlocked ? "lime" : "red";
    ctx.fillRect(state.exit.x*TILE-camX,state.exit.y*TILE-camY,TILE,TILE);
  }

  // players
  for (const id in state.players) {
    const p = state.players[id];
    ctx.fillStyle="cyan";
    ctx.fillRect(p.x*TILE-camX,p.y*TILE-camY,TILE,TILE);
  }

  requestAnimationFrame(draw);
}

draw();