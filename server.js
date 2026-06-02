const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const SIZE = 35;
const rooms = {};

const COLORS = [
"#ff0000","#00ff00","#0000ff","#ffff00","#ff00ff",
"#00ffff","#ff8800","#8800ff","#ffffff","#ff4444"
];

// ---------------- QUESTION BANK (50 EACH SUBJECT) ----------------
function makeQuestions() {
    const subjects = ["math","cs","english","bio","chem","physics","geo","econ","biz","soc"];
    const db = {};

    for (let s of subjects) {
        db[s] = [];
        for (let i = 1; i <= 50; i++) {
            db[s].push({
                q: `${s.toUpperCase()} Q${i}: Solve ${i} + ${i} = ?`,
                a: String(i + i)
            });
        }
    }
    return db;
}

// ---------------- MAZE ----------------
function generateMaze(size) {
    const maze = Array.from({ length: size }, () =>
        Array(size).fill(1)
    );

    function carve(x, y) {
        maze[y][x] = 0;
        const dirs = [[2,0],[-2,0],[0,2],[0,-2]].sort(() => Math.random()-0.5);

        for (let [dx,dy] of dirs) {
            let nx = x + dx;
            let ny = y + dy;

            if (
                nx > 0 && ny > 0 &&
                nx < size-1 && ny < size-1 &&
                maze[ny][nx] === 1
            ) {
                maze[y + dy/2][x + dx/2] = 0;
                carve(nx, ny);
            }
        }
    }

    carve(1,1);
    return maze;
}

// ---------------- SAFE TILE ----------------
function openTile(maze){
    let x,y;
    do {
        x = Math.floor(Math.random()*SIZE);
        y = Math.floor(Math.random()*SIZE);
    } while (maze[y][x] === 1);
    return {x,y};
}

// ---------------- ROOM ----------------
function getRoom(id){
    if (!rooms[id]) {

        const maze = generateMaze(SIZE);
        const items = [];
        const questions = makeQuestions();

        for (let i=0;i<10;i++){
            items.push({
                id:"f"+i,
                type:"fragment",
                color:COLORS[i],
                subject:Object.keys(questions)[i%10],
                ...openTile(maze)
            });

            items.push({
                id:"k"+i,
                type:"key",
                color:COLORS[i],
                subject:Object.keys(questions)[i%10],
                ...openTile(maze)
            });
        }

        rooms[id] = {
            maze,
            items,
            players:{},
            questions,
            leaderboard:[],
            startTime:Date.now()
        };
    }

    return rooms[id];
}

// ---------------- SOCKET ----------------
io.on("connection", socket => {

    socket.on("join", ({name,room}) => {

        const r = getRoom(room);
        socket.room = room;
        socket.join(room);

        r.players[socket.id] = {
            name,
            x:1,
            y:1,
            fragments:[],
            keys:[],
            frozenUntil:0
        };

        socket.emit("init", {
            maze:r.maze,
            items:r.items,
            id:socket.id
        });

        io.to(room).emit("players", r.players);
    });

    // ---------------- MOVE ----------------
    socket.on("move", pos => {
        const r = rooms[socket.room];
        if (!r) return;

        const p = r.players[socket.id];
        if (!p) return;

        if (Date.now() < p.frozenUntil) return;

        if (r.maze[pos.y]?.[pos.x] === 0) {
            p.x = pos.x;
            p.y = pos.y;
        }

        io.to(socket.room).emit("players", r.players);
    });

    // ---------------- QUIZ REQUEST ----------------
    socket.on("requestQuiz", ({itemId}) => {
        const r = rooms[socket.room];
        if (!r) return;

        const item = r.items.find(i=>i.id===itemId);
        if (!item) return;

        const pool = r.questions[item.subject];
        const q = pool[Math.floor(Math.random()*pool.length)];

        socket.emit("quizPopup", {
            itemId,
            question:q.q,
            answer:q.a
        });
    });

    // ---------------- QUIZ RESULT ----------------
    socket.on("submitQuiz", data => {
        const r = rooms[socket.room];
        if (!r) return;

        const p = r.players[socket.id];
        const item = r.items.find(i=>i.id===data.itemId);
        if (!p || !item) return;

        if (data.answer === data.correct) {

            if (item.type==="fragment") p.fragments.push(item.id);
            else p.keys.push(item.id);

            r.items = r.items.filter(i=>i.id!==item.id);

        } else {

            p.x = 1;
            p.y = 1;
            p.frozenUntil = Date.now() + 5000;
        }

        io.to(socket.room).emit("itemsUpdate", r.items);
        socket.emit("playerUpdate", p);
    });

    // ---------------- CHAT ----------------
    socket.on("chat", msg=>{
        const r = rooms[socket.room];
        if (!r) return;

        io.to(socket.room).emit("chat",{
            name:r.players[socket.id]?.name,
            msg
        });
    });

});

server.listen(3000);