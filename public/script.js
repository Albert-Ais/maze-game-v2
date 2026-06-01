const socket = io();

let maze=[],items=[],players={},id;
let isAdmin=false;
let exitOpen=false;

let player={
    x:1,y:1,vx:1,vy:1,fragments:[],keys:[]
};

const c=document.getElementById("game");
const ctx=c.getContext("2d");
c.width=innerWidth;
c.height=innerHeight;

const tile=20;

// ---------------- JOIN ----------------
function join(){
    socket.emit("join",{
        name:document.getElementById("name").value,
        room:document.getElementById("room").value
    });
}

// ---------------- SOCKET ----------------
socket.on("init",d=>{
    maze=d.maze;
    items=d.items;
    id=d.id;
});

socket.on("admin",d=>{
    isAdmin=true;
    maze=d.maze;
    items=d.items;
    players=d.players;
});

socket.on("players",d=>players=d);

socket.on("itemsUpdate",d=>items=d);

socket.on("exitOpen",()=>exitOpen=true);

// ---------------- COLORS ----------------
const colors=[
"#ff0000","#00ff00","#0000ff","#ffff00","#ff00ff",
"#00ffff","#ff8800","#8800ff","#ffffff","#ff4444"
];

// ---------------- SMOOTH MOVEMENT ----------------
let keys={};

document.addEventListener("keydown",e=>keys[e.key]=true);
document.addEventListener("keyup",e=>keys[e.key]=false);

function updateMovement(){
    if(isAdmin) return;

    let dx=0,dy=0;

    if(keys["w"]||keys["ArrowUp"]) dy=-0.2;
    if(keys["s"]||keys["ArrowDown"]) dy=0.2;
    if(keys["a"]||keys["ArrowLeft"]) dx=-0.2;
    if(keys["d"]||keys["ArrowRight"]) dx=0.2;

    player.vx+=dx;
    player.vy+=dy;

    player.vx*=0.8;
    player.vy*=0.8;

    player.x+=player.vx;
    player.y+=player.vy;

    socket.emit("move",player);
}

// ---------------- COLLECT ----------------
function checkItems(){
    items.forEach(i=>{
        if(Math.floor(player.x)==i.x && Math.floor(player.y)==i.y){
            socket.emit("collect",i.id);
        }
    });
}

// ---------------- CAMERA ----------------
function visible(){return true;}

// ---------------- EXIT DOOR ----------------
function drawExit(){
    if(!exitOpen) return;

    ctx.fillStyle="gold";
    ctx.fillRect(5*tile,5*tile,tile,tile);
}

// ---------------- DRAW ----------------
function draw(){

    updateMovement();

    ctx.clearRect(0,0,c.width,c.height);

    let camX=(player.x+0.5)*tile-c.width/2;
    let camY=(player.y+0.5)*tile-c.height/2;

    ctx.setTransform(1,0,0,1,0,0);
    ctx.translate(-camX,-camY);

    // MAZE
    for(let y=0;y<maze.length;y++){
        for(let x=0;x<maze[y].length;x++){
            if(maze[y][x]){
                ctx.fillStyle="white";
                ctx.fillRect(x*tile,y*tile,tile,tile);
            }
        }
    }

    // ITEMS (10 COLORS)
    items.forEach(i=>{
        const idx=parseInt(i.id.slice(1));
        ctx.fillStyle=colors[idx];

        ctx.fillRect(
            i.x*tile+5,
            i.y*tile+5,
            tile-10,
            tile-10
        );
    });

    // PLAYERS
    for(let p in players){
        ctx.fillStyle="red";
        ctx.fillRect(players[p].x*tile,players[p].y*tile,tile,tile);
    }

    drawExit();
    checkItems();

    requestAnimationFrame(draw);
}

draw();