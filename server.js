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
        const items = [];

        for (let i = 0; i < 10; i++) {
            items.push({
                id: "f"+i,
                type: "fragment",
                color: COLORS[i],
                ...openTile(maze)
            });

            items.push({
                id: "k"+i,
                type: "key",
                color: COLORS[i],
                ...openTile(maze)
            });
        }

        rooms[id] = {
            maze,
            players: {},
            items,
            leaderboard: [],
            startTime: Date.now()
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
            fragments: [],
            keys: []
        };

        socket.emit("init", {
            maze: r.maze,
            items: r.items,
            id: socket.id
        });

        io.to(room).emit("players", r.players);
    });

    // MOVE (safe collision)
    socket.on("move", pos => {
        const r = rooms[socket.room];
        if (!r) return;

        const p = r.players[socket.id];
        if (!p) return;

        if (r.maze[pos.y]?.[pos.x] === 0) {
            p.x = pos.x;
            p.y = pos.y;
        }

        io.to(socket.room).emit("players", r.players);
    });

    // COLLECT
    socket.on("collect", id => {
        const r = rooms[socket.room];
        if (!r) return;

        const p = r.players[socket.id];
        const index = r.items.findIndex(i => i.id === id);

        if (!p || index === -1) return;

        const item = r.items[index];

        if (item.type === "fragment") p.fragments.push(id);
        else p.keys.push(id);

        r.items.splice(index, 1);

        io.to(socket.room).emit("itemsUpdate", r.items);
        socket.emit("playerUpdate", p);
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

    // WIN
    socket.on("win", () => {
        const r = rooms[socket.room];
        if (!r) return;

        const p = r.players[socket.id];
        if (!p) return;

        const time = Date.now() - r.startTime;

        r.leaderboard.push({ name: p.name, time });
        r.leaderboard.sort((a,b)=>a.time-b.time);

        io.to(socket.room).emit("leaderboard", r.leaderboard);
    });

});

server.listen(process.env.PORT || 3000);