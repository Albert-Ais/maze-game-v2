const socket = io();

let maze = [];
let items = [];
let players = {};
let player = { x: 1, y: 1 };

let state = "lobby";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

const tile = 20;

// ================= JOIN =================
function joinGame(){
    const name = document.getElementById("name").value;
    const room = document.getElementById("room").value;

    if(!name || !room){
        document.getElementById("status").innerText = "Enter name + room!";
        return;
    }

    socket.emit("join",{name,room});

    document.getElementById("menu").style.display = "none";
}

// ================= INIT =================
socket.on("init", d => {
    maze = d.maze;
    items = d.items;
});

// ================= STATE =================
socket.on("state", s => {
    state = s;
    document.getElementById("state").innerText = s;
});

// ================= PLAYERS =================
socket.on("players", d => {
    players = d || {};

    if(players[socket.id]){
        player.x = players[socket.id].x;
        player.y = players[socket.id].y;
    }
});

// ================= MOVE =================
document.addEventListener("keydown", (e) => {
    if(state !== "playing") return;

    let nx = player.x;
    let ny = player.y;

    if(e.key === "w") ny--;
    if(e.key === "s") ny++;
    if(e.key === "a") nx--;
    if(e.key === "d") nx++;

    socket.emit("move",{x:nx,y:ny});
});

// ================= QUIZ =================
socket.on("quiz", (data) => {
    const box = document.getElementById("quizBox");
    box.style.display = "block";

    document.getElementById("question").innerText = data.q;

    const opt = document.getElementById("options");
    opt.innerHTML = "";

    data.options.forEach((o,i)=>{
        let btn = document.createElement("button");
        btn.innerText = o;

        btn.onclick = () => {
            socket.emit("answer",{
                itemId:data.itemId,
                answer:i,
                correct:data.a
            });

            box.style.display = "none";
        };

        opt.appendChild(btn);
    });
});

// ================= ITEM CHECK =================
function checkItems(){
    items.forEach(i=>{
        if(i.x === player.x && i.y === player.y){
            socket.emit("quizRequest",{itemId:i.id});
        }
    });
}

setInterval(checkItems,200);

// ================= RENDER =================
function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // maze
    for(let y=0;y<maze.length;y++){
        for(let x=0;x<maze[y].length;x++){
            ctx.fillStyle = maze[y][x] ? "#111" : "#222";
            ctx.fillRect(x*tile,y*tile,tile,tile);
        }
    }

    // items
    items.forEach(i=>{
        ctx.fillStyle = i.color || "yellow";
        ctx.fillRect(i.x*tile+5,i.y*tile+5,tile-10,tile-10);
    });

    // players
    for(let id in players){
        let p = players[id];
        ctx.fillStyle = "red";
        ctx.fillRect(p.x*tile,p.y*tile,tile,tile);
    }

    // you
    ctx.fillStyle = "cyan";
    ctx.fillRect(player.x*tile,player.y*tile,tile,tile);

    requestAnimationFrame(draw);
}

draw();