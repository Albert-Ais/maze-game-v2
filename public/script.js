const socket = io();

let maze=[],items=[],players={},id;
let player={x:1,y:1,fragments:[],keys:[]};

const c=document.getElementById("game");
const ctx=c.getContext("2d");

c.width=innerWidth;
c.height=innerHeight;

const tile=20;
const VIEW=1;

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
    id=d.id;
});

socket.on("players",d=>players=d||{});
socket.on("itemsUpdate",d=>items=d||[]);

socket.on("playerUpdate",p=>{
    player=p;
});

// ---------------- MOVEMENT ----------------
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
        checkItems();
    }
});

// ---------------- QUIZ ----------------
function askQuiz(item){
    socket.emit("requestQuiz",{itemId:item.id});
}

socket.on("quizPopup",data=>{
    let ans=prompt(data.question);

    socket.emit("submitQuiz",{
        itemId:data.itemId,
        answer:ans,
        correct:data.answer
    });
});

// ---------------- ITEMS ----------------
function checkItems(){
    items.forEach(i=>{
        if(player.x===i.x && player.y===i.y){
            askQuiz(i);
        }
    });
}

// ---------------- VISION ----------------
function visible(x,y){
    return Math.abs(player.x-x)<=VIEW &&
           Math.abs(player.y-y)<=VIEW;
}

// ---------------- DRAW ----------------
function draw(){
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,c.width,c.height);

    let camX=player.x*tile-c.width/2;
    let camY=player.y*tile-c.height/2;

    ctx.translate(-camX,-camY);

    for(let y=0;y<maze.length;y++){
        for(let x=0;x<maze[y].length;x++){

            ctx.fillStyle="#111";
            ctx.fillRect(x*tile,y*tile,tile,tile);

            if(maze[y][x]===1 && visible(x,y)){
                ctx.fillStyle="#fff";
                ctx.fillRect(x*tile,y*tile,tile,tile);
            }
        }
    }

    items.forEach(i=>{
        if(!visible(i.x,i.y))return;

        ctx.fillStyle=i.color;
        ctx.fillRect(i.x*tile+6,i.y*tile+6,tile-12,tile-12);
    });

    for(let p in players){
        let pl=players[p];
        if(!pl)continue;

        if(!visible(pl.x,pl.y))continue;

        ctx.fillStyle="red";
        ctx.fillRect(pl.x*tile,pl.y*tile,tile,tile);
    }

    requestAnimationFrame(draw);
}
draw();