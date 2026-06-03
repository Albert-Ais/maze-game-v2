const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

let state = { players:{}, maze:[], keys:[], fragments:[], exit:{} };

const keysPressed = {};
let camX = 0, camY = 0;

// ================= INPUT =================
addEventListener("keydown",e=>keysPressed[e.key.toLowerCase()]=true);
addEventListener("keyup",e=>keysPressed[e.key.toLowerCase()]=false);

// ================= JOIN =================
window.join = () => {
  socket.emit("joinRoom", {
    name: name.value,
    roomId: room.value
  });

  startScreen.style.display = "none";
};

// ================= SOCKET =================
socket.on("state", d => state = d);

// ================= QUIZ =================
socket.on("question", d => {
  questionBox.classList.add("show");
  quizOverlay.classList.add("show");

  q.innerText = d.question.q;
  opts.innerHTML = "";

  d.question.options.forEach((o,i)=>{
    const b=document.createElement("button");
    b.innerText=o;

    b.onclick=()=>{
      socket.emit("answer",{
        type:d.type,
        id:d.id,
        correct:i===d.question.answer
      });

      questionBox.classList.remove("show");
      quizOverlay.classList.remove("show");
    };

    opts.appendChild(b);
  });
});

// ================= MOVEMENT =================
let lastMove = 0;

function update(){
  const me = state.players[socket.id];
  if(!me) return;

  if(performance.now()-lastMove<60) return;

  let x=me.x,y=me.y;

  if(keysPressed.w)y--;
  else if(keysPressed.s)y++;
  else if(keysPressed.a)x--;
  else if(keysPressed.d)x++;

  if(x!==me.x||y!==me.y){
    socket.emit("move",{x,y});
    lastMove = performance.now();
  }
}

// ================= DRAW =================
function draw(){

  ctx.fillStyle="#050505";
  ctx.fillRect(0,0,innerWidth,innerHeight);

  const me = state.players[socket.id];

  if(me){
    camX += (me.x*48-camX-innerWidth/2)*0.12;
    camY += (me.y*48-camY-innerHeight/2)*0.12;
  }

  // MAZE
  for(let y=0;y<state.maze.length;y++){
    for(let x=0;x<state.maze[y].length;x++){
      if(state.maze[y][x]){
        ctx.fillStyle="#2a2a2a";
        ctx.fillRect(x*48-camX,y*48-camY,48,48);
      }
    }
  }

  // ITEMS
  for(const k of state.keys){
    ctx.fillStyle="gold";
    ctx.fillRect(k.x*48-camX+18,k.y*48-camY+18,12,12);
  }

  for(const f of state.fragments){
    ctx.fillStyle="cyan";
    ctx.fillRect(f.x*48-camX+16,f.y*48-camY+16,16,16);
  }

  // PLAYERS
  for(const id in state.players){
    const p=state.players[id];
    ctx.fillStyle="lime";
    ctx.fillRect(p.x*48-camX+14,p.y*48-camY+14,20,20);
  }

  // HUD
  if(me){
    ctx.fillStyle="white";
    ctx.font="16px Arial";
    ctx.fillText(`Keys: ${me.keys}/10`,20,30);
    ctx.fillText(`Fragments: ${me.fragments}/10`,20,55);
  }

  update();
  requestAnimationFrame(draw);
}

draw();
setInterval(update,80);