const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===================== STATE =====================
let state = { players:{}, maze:[], keys:[], fragments:[], exit:{} };

// ===================== INPUT =====================
const keysPressed = {};

// ===================== CAMERA =====================
let camX = 0;
let camY = 0;

// ===================== COLORS =====================
const colors = {
  math:"red", english:"dodgerblue", biology:"limegreen",
  chemistry:"violet", physics:"orange", economics:"hotpink",
  geography:"cyan", business:"gold",
  computer_science:"white", sociology:"lime"
};

// ===================== JOIN FIX =====================
window.join = function () {
  const name = document.getElementById("name")?.value;
  const room = document.getElementById("room")?.value;

  if (!name || !room) return alert("Enter name + room");

  socket.emit("joinRoom", { name, roomId: room });

  document.getElementById("menu").style.display = "none";
};

// ===================== SOCKET =====================
socket.on("state", (d) => state = d);

// ===================== AAA QUIZ UI =====================
socket.on("question", (data) => {
  const box = document.getElementById("questionBox");
  const overlay = document.getElementById("quizOverlay");
  const q = document.getElementById("q");
  const opts = document.getElementById("opts");

  box.classList.add("show");
  overlay.classList.add("show");

  q.innerText = data.question.q;
  opts.innerHTML = "";

  data.question.options.forEach((o, i) => {
    const b = document.createElement("button");
    b.innerText = o;

    b.onclick = () => {
      socket.emit("answer", {
        type: data.type,
        id: data.id,
        correct: i === data.question.answer
      });

      box.classList.remove("show");
      overlay.classList.remove("show");
    };

    opts.appendChild(b);
  });
});

// ===================== INPUT =====================
document.addEventListener("keydown",(e)=>keysPressed[e.key.toLowerCase()]=true);
document.addEventListener("keyup",(e)=>keysPressed[e.key.toLowerCase()]=false);

// ===================== MOVE =====================
let last = 0;

function move(){
  const me = state.players[socket.id];
  if(!me) return;

  const now = performance.now();
  if(now-last<80) return;

  let x=me.x,y=me.y;

  if(keysPressed["w"])y--;
  else if(keysPressed["s"])y++;
  else if(keysPressed["a"])x--;
  else if(keysPressed["d"])x++;

  if(x!==me.x||y!==me.y){
    socket.emit("move",{x,y});
    last=now;
  }
}

// ===================== DRAW PLAYER =====================
function drawP(p){
  if(!p.rx)p.rx=p.x;
  if(!p.ry)p.ry=p.y;

  p.rx+=(p.x-p.rx)*0.2;
  p.ry+=(p.y-p.ry)*0.2;

  ctx.fillStyle="cyan";
  ctx.fillRect(p.rx*48-camX+15,p.ry*48-camY+15,18,18);
}

// ===================== DRAW =====================
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const me=state.players[socket.id];

  if(me){
    camX+=(me.x*48-camX-canvas.width/2)*0.12;
    camY+=(me.y*48-camY-canvas.height/2)*0.12;
  }

  ctx.fillStyle="#050505";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // maze
  for(let y=0;y<(state.maze||[]).length;y++){
    for(let x=0;x<(state.maze[y]||[]).length;x++){
      if(state.maze[y][x]===1){
        ctx.fillStyle="#2b2b2b";
        ctx.fillRect(x*48-camX,y*48-camY,48,48);
      }
    }
  }

  // items
  for(const k of state.keys||[]){
    ctx.fillStyle=colors[k.subject];
    ctx.fillRect(k.x*48-camX+18,k.y*48-camY+18,12,12);
  }

  for(const f of state.fragments||[]){
    ctx.fillStyle=colors[f.subject];
    ctx.fillRect(f.x*48-camX+16,f.y*48-camY+16,16,16);
  }

  // players
  for(const id in state.players){
    drawP(state.players[id]);
  }

  // HUD
  if(me){
    ctx.fillStyle="white";
    ctx.fillText(`Keys:${me.keys}/10`,20,30);
    ctx.fillText(`Fragments:${me.fragments}/10`,20,55);
  }

  requestAnimationFrame(draw);
}

setInterval(move,80);
draw();