const socket = io();

let maze = [];
let items = [];
let players = {};
let id;

let player = { x:1,y:1,fragments:[],keys:[] };

const c = document.getElementById("game");
const ctx = c.getContext("2d");

c.width = window.innerWidth;
c.height = window.innerHeight;

const tile = 20;

let startTime = Date.now();

// ---------------- JOIN ----------------
function join() {
    const name = document.getElementById("name").value;
    const room = document.getElementById("room").value;

    socket.emit("join", { name, room });
}

// ---------------- SOCKET ----------------
socket.on("init", data => {
    maze = data.maze;
    items = data.items;
    id = data.id;
    startTime = Date.now();
});

socket.on("players", data => players = data);

// ---------------- CHAT ----------------
socket.on("chat", msg => {
    const box = document.getElementById("chatBox");
    box.innerHTML += `<div>${msg}</div>`;
    box.scrollTop = box.scrollHeight;
});

document.getElementById("chatInput").addEventListener("keydown", e => {
    if (e.key === "Enter") {
        socket.emit("chat", document.getElementById("chatInput").value);
        document.getElementById("chatInput").value = "";
    }
});

// ---------------- LEADERBOARD ----------------
socket.on("leaderboard", data => {
    const board = document.getElementById("board");
    board.innerHTML = "";

    data.forEach(p => {
        board.innerHTML += `<div>${p.name} - ${Math.floor(p.time/1000)}s</div>`;
    });
});

// ---------------- MOVE ----------------
document.addEventListener("keydown", e => {

    let nx = player.x;
    let ny = player.y;

    if (e.key === "w") ny--;
    if (e.key === "s") ny++;
    if (e.key === "a") nx--;
    if (e.key === "d") nx++;

    if (maze[ny]?.[nx] === 0) {
        player.x = nx;
        player.y = ny;

        socket.emit("move", player);

        checkItems();
        checkExit();
    }
});

// ---------------- ITEMS ----------------
function checkItems() {
    items.forEach(i => {
        if (player.x === i.x && player.y === i.y) {
            socket.emit("collect", i.id);
            items = items.filter(x => x.id !== i.id);
        }
    });
}

// ---------------- EXIT ----------------
function checkExit() {
    if (player.fragments.length === 10 && player.keys.length === 10) {
        socket.emit("win");

        document.getElementById("winScreen").style.display = "block";
    }
}

// ---------------- TIMER ----------------
setInterval(() => {
    document.getElementById("time").innerText =
        Math.floor((Date.now() - startTime)/1000);
}, 1000);

// ---------------- FOG ----------------
function visible(x,y){
    return Math.abs(player.x-x)<=4 && Math.abs(player.y-y)<=4;
}

// ---------------- RENDER ----------------
function draw(){

    ctx.clearRect(0,0,c.width,c.height);

    let camX = player.x*tile - c.width/2;
    let camY = player.y*tile - c.height/2;

    ctx.setTransform(1,0,0,1,0,0);
    ctx.translate(-camX,-camY);

    for(let y=0;y<maze.length;y++){
        for(let x=0;x<maze[y].length;x++){
            if(!visible(x,y)) continue;
            if(maze[y][x]) ctx.fillRect(x*tile,y*tile,tile,tile);
        }
    }

    items.forEach(i=>{
        if(!visible(i.x,i.y)) return;
        ctx.fillStyle = i.type==="fragment"?"cyan":"orange";
        ctx.fillRect(i.x*tile,i.y*tile,tile,tile);
    });

    for(let p in players){
        let pl = players[p];
        ctx.fillStyle = "red";
        ctx.fillRect(pl.x*tile,pl.y*tile,tile,tile);
    }

    requestAnimationFrame(draw);
}

draw();