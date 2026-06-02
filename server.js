const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const SIZE = 35;

const rooms = {};

const ADMIN_NAME = "AAO (Albert Anyange Olang)";

const COLORS = [
"#ff0000","#00ff00","#0000ff","#ffff00","#ff00ff",
"#00ffff","#ff8800","#8800ff","#ffffff","#ff4444"
];

// ---------------- QUESTIONS (SIMPLIFIED SAMPLE EXPANDABLE) ----------------
const SUBJECTS = ["math","cs","english","bio","chem","physics","geo","econ","business","sociology"];

function generateQuestions() {
    const db = {};

    for (let s of SUBJECTS) {
        db[s] = [];
        for (let i = 1; i <= 50; i++) {
            db[s].push({
                q: `${s.toUpperCase()} Question ${i}: What is ${i} + ${i}?`,
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

        const dirs = [[2,0],[-2,0],[0,2],[0,-2]]
            .sort(() => Math.random() - 0.5);

        for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;

            if (
                nx > 0 && ny > 0 &&
                nx < size - 1 && ny < size - 1 &&
                maze[ny][nx] === 1
            ) {
                maze[y + dy/2][x + dx/2] = 0;
                carve(nx, ny);
            }
        }
    }

    carve(1, 1);
    return maze;
}

// ---------------- SAFE TILE ----------------
function openTile(maze) {
    let x, y;
    do {
        x = Math.floor(Math.random() * SIZE);
        y = Math.floor(Math.random() * SIZE);
    } while (maze[y][x] === 1);
    return { x, y };
}

// ---------------- ROOM ----------------
function getRoom(id) {
    if (!rooms[id]) {
        const maze = generateMaze(SIZE);
        const questions = generateQuestions();

        const items = [];

        for (let i = 0; i < 10; i++) {
            items.push({
                id: "f"+i,
                type: "fragment",
                subject: SUBJECTS[i],
                color: COLORS[i],
                ...openTile(maze)
            });

            items.push({
                id: "k"+i,
                type: "key",
                subject: SUBJECTS[i],
                color: COLORS[i],
                ...openTile(maze)
            });
        }

        rooms[id] = {
            maze,
            players: {},
            items,
            questions,
            startTime: Date.now(),
            exitUnlocked: false,
            leaderboard: []
        };
    }

    return rooms[id];
}

// ---------------- SOCKET ----------------
io.on("connection", socket => {

    socket.on("join", ({ name, room }) => {

        const r = getRoom(room);
        socket.room = room;
        socket.join(room);

        if (name.trim().toLowerCase() === ADMIN_NAME.toLowerCase()) {
            socket.isAdmin = true;
            socket.emit("admin", r);
            return;
        }

        r.players[socket.id] = {
            name,
            x: 1,
            y: 1,
            frozenUntil: 0,
            fragments: [],
            keys: []
        };

        socket.emit("init", {
            maze: r.maze,
            items: r.items,
            startTime: r.startTime,
            id: socket.id
        });

        io.to(room).emit("players", r.players);
    });

    // MOVE
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

    // QUIZ BEFORE COLLECT
    socket.on("quizAnswer", ({ itemId, answer }) => {
        const r = rooms[socket.room];
        if (!r) return;

        const p = r.players[socket.id];
        const item = r.items.find(i => i.id === itemId);
        if (!p || !item) return;

        const qList = r.questions[item.subject];
        const q = qList[Math.floor(Math.random() * qList.length)];

        if (answer === q.a) {
            if (item.type === "fragment") p.fragments.push(itemId);
            else p.keys.push(itemId);

            r.items = r.items.filter(i => i.id !== itemId);

            io.to(socket.room).emit("itemsUpdate", r.items);
            socket.emit("playerUpdate", p);

            // check win
            if (p.keys.length === 10 && p.fragments.length === 10) {
                r.exitUnlocked = true;
                io.to(socket.room).emit("exitUnlocked");
            }
        } else {
            // penalty
            p.x = 1;
            p.y = 1;
            p.frozenUntil = Date.now() + 2000;

            socket.emit("penalty", "Wrong answer!");
        }
    });

    // CHAT
    socket.on("chat", msg => {
        const r = rooms[socket.room];
        if (!r) return;

        io.to(socket.room).emit("chat", {
            name: r.players[socket.id]?.name || "Player",
            msg
        });
    });

    // SPEEDRUN END
    socket.on("win", () => {
        const r = rooms[socket.room];
        if (!r) return;

        const p = r.players[socket.id];
        const time = Date.now() - r.startTime;

        r.leaderboard.push({ name: p.name, time });
        r.leaderboard.sort((a,b)=>a.time-b.time);

        io.to(socket.room).emit("leaderboard", r.leaderboard);
    });

});

server.listen(3000);