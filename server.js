const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const SIZE = 35;

// ---------------- GLOBAL STATE ----------------
const rooms = {};
const leaderboards = {};

// ---------------- GAME STATE MACHINE ----------------
const STATE = {
    LOBBY: "lobby",
    PLAYING: "playing",
    FINISHED: "finished"
};

// ---------------- ROOM CREATION ----------------
function createRoom(id){
    if (rooms[id]) return rooms[id];

    const maze = Array.from({length:SIZE},()=>Array(SIZE).fill(1));

    const items = [];

    const questions = {};
    const subjects = ["math","cs","eng","bio","chem","phy","geo","eco","biz","soc"];

    subjects.forEach(s=>{
        questions[s]=Array.from({length:50},(_,i)=>({
            q:`${s.toUpperCase()} Q${i+1}`,
            options:["A","B","C","D"],
            a:0
        }));
    });

    rooms[id] = {
        maze,
        items,
        players:{},
        questions,
        state: STATE.LOBBY,
        startTime:0
    };

    leaderboards[id] = [];

    return rooms[id];
}

// ---------------- AUTHORIZED MOVE SYSTEM ----------------
function canMove(p, x, y){
    const dx = Math.abs(p.x - x);
    const dy = Math.abs(p.y - y);
    return dx + dy === 1;
}

// ---------------- FINISH SYSTEM ----------------
function finishPlayer(roomId, socketId){
    const r = rooms[roomId];
    const p = r.players[socketId];

    if (!p || p.finished) return;

    p.finished = true;

    const time = Date.now() - r.startTime;

    leaderboards[roomId].push({
        name: p.name,
        time
    });

    leaderboards[roomId].sort((a,b)=>a.time-b.time);

    io.to(roomId).emit("leaderboard", leaderboards[roomId]);

    // if all finished → end match
    const allFinished = Object.values(r.players).every(pl => pl.finished);

    if (allFinished) {
        r.state = STATE.FINISHED;
        io.to(roomId).emit("gameOver");
    }
}

// ---------------- SOCKET ----------------
io.on("connection",(socket)=>{

socket.on("join",({name,room})=>{
    const r = createRoom(room);

    socket.room = room;
    socket.join(room);

    r.players[socket.id] = {
        name,
        x:1,
        y:1,
        fragments:0,
        keys:0,
        finished:false
    };

    socket.emit("state", r.state);
    socket.emit("init",{maze:r.maze,items:r.items});
    io.to(room).emit("players",r.players);
});

// ---------------- START GAME (AUTO) ----------------
function startGame(roomId){
    const r = rooms[roomId];
    if (!r) return;

    r.state = STATE.PLAYING;
    r.startTime = Date.now();

    io.to(roomId).emit("state", STATE.PLAYING);
}

// auto start when 2+ players
setInterval(()=>{
    for (let id in rooms){
        const r = rooms[id];
        if (r.state === STATE.LOBBY && Object.keys(r.players).length >= 2){
            startGame(id);
        }
    }
},2000);

// ---------------- MOVE (ULTRA CLEAN) ----------------
socket.on("move",({x,y})=>{
    const r = rooms[socket.room];
    if (!r || r.state !== STATE.PLAYING) return;

    const p = r.players[socket.id];
    if (!p) return;

    if (!canMove(p,x,y)) return;

    if (r.maze[y]?.[x] === 0){
        p.x = x;
        p.y = y;
    }

    io.to(socket.room).emit("players", r.players);
});

// ---------------- QUIZ ----------------
socket.on("quizRequest",({itemId})=>{
    const r = rooms[socket.room];
    if (!r) return;

    const item = r.items.find(i=>i.id===itemId);
    if (!item) return;

    const q = r.questions[item.subject][0];

    socket.emit("quiz",{
        itemId,
        q:q.q,
        options:q.options,
        a:q.a
    });
});

// ---------------- ANSWER ----------------
socket.on("answer",({itemId,answer,correct})=>{
    const r = rooms[socket.room];
    const p = r.players[socket.id];
    if (!r || !p) return;

    const item = r.items.find(i=>i.id===itemId);
    if (!item) return;

    if (answer === correct){
        if (item.type==="fragment") p.fragments++;
        else p.keys++;

        r.items = r.items.filter(i=>i.id!==itemId);

        if (p.fragments>=10 && p.keys>=10){
            finishPlayer(socket.room,socket.id);
        }
    } else {
        p.x = 1;
        p.y = 1;
    }
});

// ---------------- CHAT ----------------
socket.on("chat",(msg)=>{
    const r = rooms[socket.room];
    if (!r) return;

    io.to(socket.room).emit("chat",{
        name:r.players[socket.id]?.name,
        msg
    });
});

// ---------------- DISCONNECT CLEANUP ----------------
socket.on("disconnect",()=>{
    const r = rooms[socket.room];
    if (!r) return;

    delete r.players[socket.id];

    io.to(socket.room).emit("players",r.players);
});

});

server.listen(3000);