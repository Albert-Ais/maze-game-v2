const socket = io();

let state = "lobby";
let maze=[],items=[],players={};
let player={x:1,y:1};

const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");

canvas.width=innerWidth;
canvas.height=innerHeight;

const tile=20;

// ---------------- STATE SYSTEM ----------------
socket.on("state",(s)=>{
    state=s;
    document.getElementById("state").innerText=s;
});

// ---------------- INIT ----------------
socket.on("init",d=>{
    maze=d.maze;
    items=d.items;
});

socket.on("players",d=>{
    players=d;
    if(players[socket.id]){
        player=players[socket.id];
    }
});

// ---------------- MOVEMENT (CLIENT INPUT ONLY) ----------------
document.addEventListener("keydown",(e)=>{
    if(state!=="playing") return;

    let x=player.x,y=player.y;

    if(e.key==="w") y--;
    if(e.key==="s") y++;
    if(e.key==="a") x--;
    if(e.key==="d") x++;

    socket.emit("move",{x,y});
});

// ---------------- QUIZ UI ----------------
socket.on("quiz",(data)=>{
    const box=document.getElementById("quizBox");
    box.style.display="block";

    document.getElementById("question").innerText=data.q;

    const opt=document.getElementById("options");
    opt.innerHTML="";

    data.options.forEach((o,i)=>{
        let b=document.createElement("button");
        b.innerText=o;

        b.onclick=()=>{
            socket.emit("answer",{
                itemId:data.itemId,
                answer:i,
                correct:data.a
            });

            box.style.display="none";
        };

        opt.appendChild(b);
    });
});

// ---------------- CHAT ----------------
function sendChat(){
    socket.emit("chat",document.getElementById("chatInput").value);
}

// ---------------- RENDER LOOP ----------------
function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    for(let y=0;y<maze.length;y++){
        for(let x=0;x<maze[y].length;x++){
            ctx.fillStyle=maze[y][x]?"#111":"#222";
            ctx.fillRect(x*tile,y*tile,tile,tile);
        }
    }

    items.forEach(i=>{
        ctx.fillStyle=i.color||"yellow";
        ctx.fillRect(i.x*tile,i.y*tile,tile,tile);
    });

    for(let id in players){
        let p=players[id];
        ctx.fillStyle="red";
        ctx.fillRect(p.x*tile,p.y*tile,tile,tile);
    }

    ctx.fillStyle="cyan";
    ctx.fillRect(player.x*tile,player.y*tile,tile,tile);

    requestAnimationFrame(draw);
}
draw();