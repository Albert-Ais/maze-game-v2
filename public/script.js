const socket = io();

let maze=[],items=[],players={},id;
let player={x:1,y:1,fragments:[],keys:[]};

const c=document.getElementById("game");
const ctx=c.getContext("2d");

c.width=window.innerWidth;
c.height=window.innerHeight;

const tile=20;

let camX=0,camY=0;
let startTime=0;

// ---------------- JOIN ----------------
function join(){
    document.getElementById("menu").style.display="none";

    socket.emit("join",{
        name:document.getElementById("name").value,
        room:document.getElementById("room").value
    });
}

// ---------------- SOCKET ----------------
socket.on("init",d=>{
    maze=d.maze;
    items=d.items;
    startTime=d.startTime;
});

socket.on("players",d=>players=d);
socket.on("itemsUpdate",d=>items=d);

socket.on("playerUpdate",p=>{
    player=p;
});

// ---------------- QUIZ POPUP ----------------
function quiz(item){
    const ans=prompt(`Solve: ${item.subject} question`);
    socket.emit("quizAnswer",{itemId:item.id,answer:ans});
}

// ---------------- MOVE ----------------
document.addEventListener("keydown",e=>{
    let nx=player.x,ny=player.y;

    if(e.key==="w")ny--;
    if(e.key==="s")ny++;
    if(e.key==="a")nx--;
    if(e.key==="d")nx++;

    if(maze?.[ny]?.[nx]===0){
        player.x=nx;
        player.y=ny;
        socket.emit("move",{x:nx,y:ny});
    }

    checkItems();
});

// ---------------- ITEMS ----------------
function checkItems(){
    items.forEach(i=>{
        if(player.x===i.x&&player.y===i.y){
            quiz(i);
        }
    });
}

// ---------------- CAMERA ----------------
function draw(){
    ctx.clearRect(0,0,c.width,c.height);

    let tx=player.x*tile-c.width/2;
    let ty=player.y*tile-c.height/2;

    camX+=(tx-camX)*0.1;
    camY+=(ty-camY)*0.1;

    ctx.setTransform(1,0,0,1,-camX,-camY);

    // maze
    for(let y=0;y<maze.length;y++){
        for(let x=0;x<maze[y].length;x++){
            ctx.fillStyle=maze[y][x]?"#222":"#111";
            ctx.fillRect(x*tile,y*tile,tile,tile);
        }
    }

    // items
    items.forEach(i=>{
        ctx.fillStyle=i.color;
        ctx.fillRect(i.x*tile+5,i.y*tile+5,10,10);
    });

    // players
    for(let p in players){
        ctx.fillStyle="red";
        ctx.fillRect(players[p].x*tile,players[p].y*tile,tile,tile);
    }

    requestAnimationFrame(draw);
}

draw();