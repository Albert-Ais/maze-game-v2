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

// ---------------- MAZE ----------------
function generateMaze(size) {
    const maze = Array.from({ length: size }, () =>
        Array(size).fill(1)
    );

    function carve(x, y) {
        maze[y][x] = 0;

        const dirs = [
            [2, 0], [-2, 0],
            [0, 2], [0, -2]
        ].sort(() => Math.random() - 0.5);

        for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;

            if (
                nx > 0 && ny > 0 &&
                nx < size - 1 && ny < size - 1 &&
                maze[ny][nx] === 1
            ) {
                maze[y + dy / 2][x + dx / 2] = 0;
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
            items.push({ id: i, type: "fragment", ...openTile(maze) });
            items.push({ id: i + 10, type: "key", ...openTile(maze) });
        }

        rooms[id] = {
            maze,
            players: {},
            items
        };
    }
    return rooms[id];
}

// ---------------- SOCKET ----------------
io.on("connection", (socket) => {

    // JOIN
    socket.on("join", ({ name, room }) => {

        const r = getRoom(room);

        socket.room = room;
        socket.join(room);

        // ---------------- ADMIN ----------------
        if (name === ADMIN_NAME) {

            socket.isAdmin = true;

            socket.emit("admin", {
                maze: r.maze,
                items: r.items,
                players: r.players
            });

            return;
        }

        // ---------------- PLAYER ----------------
        socket.player = {
            name,
            x: 1,
            y: 1,
            fragments: [],
            keys: []
        };

        r.players[socket.id] = socket.player;

        socket.emit("init", {
            maze: r.maze,
            items: r.items,
            id: socket.id
        });

        io.to(room).emit("players", r.players);
    });

    // MOVE
    socket.on("move", (pos) => {
        const r = rooms[socket.room];
        if (!r) return;

        const p = r.players[socket.id];
        if (!p) return;

        p.x = pos.x;
        p.y = pos.y;

        io.to(socket.room).emit("players", r.players);
    });

    // COLLECT (GLOBAL REMOVE FIXED)
    socket.on("collect", (itemId) => {

        const r = rooms[socket.room];
        if (!r) return;

        const p = r.players[socket.id];
        if (!p) return;

        const index = r.items.findIndex(i => i.id === itemId);
        if (index === -1) return;

        const item = r.items[index];

        if (item.type === "fragment") {
            if (!p.fragments.includes(itemId)) {
                p.fragments.push(itemId);
            }
        } else {
            if (!p.keys.includes(itemId)) {
                p.keys.push(itemId);
            }
        }

        // REMOVE FOR EVERYONE
        r.items.splice(index, 1);

        io.to(socket.room).emit("itemsUpdate", r.items);
        socket.emit("playerUpdate", p);
    });

});

server.listen(process.env.PORT || 3000);