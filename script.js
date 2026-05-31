const socket = io();

let maze = [];
let items = [];
let players = {};
let id;

let isAdmin = false;

let player = {
    x: 1,
    y: 1,
    fragments: [],
    keys: []
};

const c = document.getElementById("game");
const ctx = c.getContext("2d");

c.width = window.innerWidth;
c.height = window.innerHeight;

const tile = 20;

// ---------------- JOIN ----------------
function join() {
    const name = document.getElementById("name").value.trim();
    const room = document.getElementById("room").value.trim();

    if (!name || !room) return alert("Enter name + room");

    socket.emit("join", { name, room });
}

// ---------------- INIT ----------------
socket.on("init", data => {
    maze = data.maze;
    items = data.items;
    id = data.id;
});

// ---------------- ADMIN ----------------
socket.on("admin", data => {
    isAdmin = true;

    maze = data.maze;
    items = data.items;
    players = data.players;
});

// ---------------- PLAYERS ----------------
socket.on("players", data => {
    players = data;
});

// ---------------- ITEM UPDATE ----------------
socket.on("itemsUpdate", newItems => {
    items = newItems;
});

// ---------------- PLAYER UPDATE ----------------
socket.on("playerUpdate", p => {
    player = p;

    document.getElementById("f").innerText = p.fragments.length;
    document.getElementById("k").innerText = p.keys.length;
});

// ---------------- MOVEMENT ----------------
document.addEventListener("keydown", e => {

    if (isAdmin) return;

    let nx = player.x;
    let ny = player.y;

    if (e.key === "w" || e.key === "ArrowUp") ny--;
    if (e.key === "s" || e.key === "ArrowDown") ny++;
    if (e.key === "a" || e.key === "ArrowLeft") nx--;
    if (e.key === "d" || e.key === "ArrowRight") nx++;

    if (maze[ny]?.[nx] === 0) {
        player.x = nx;
        player.y = ny;

        socket.emit("move", player);

        checkItems();
    }
});

// ---------------- COLLECT ----------------
function checkItems() {
    items.forEach(i => {
        if (player.x === i.x && player.y === i.y) {
            socket.emit("collect", i.id);
        }
    });
}

// ---------------- FOG ----------------
function visible(x, y) {
    if (isAdmin) return true;

    return Math.abs(player.x - x) <= 4 &&
           Math.abs(player.y - y) <= 4;
}

// ---------------- RENDER ----------------
function draw() {

    ctx.clearRect(0, 0, c.width, c.height);

    let camX, camY;

    if (isAdmin) {
        camX = (maze.length * tile) / 2 - c.width / 2;
        camY = (maze.length * tile) / 2 - c.height / 2;
    } else {
        camX = player.x * tile - c.width / 2;
        camY = player.y * tile - c.height / 2;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(-camX, -camY);

    // MAZE
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {

            if (!visible(x, y)) continue;

            if (maze[y][x] === 1) {
                ctx.fillStyle = "white";
                ctx.fillRect(x * tile, y * tile, tile, tile);
            }
        }
    }

    // ITEMS
    items.forEach(i => {

        if (!visible(i.x, i.y)) return;

        ctx.fillStyle = i.type === "fragment" ? "cyan" : "orange";
        ctx.fillRect(i.x * tile, i.y * tile, tile, tile);
    });

    // PLAYERS
    for (let pid in players) {
        const p = players[pid];

        ctx.fillStyle = pid === id ? "red" : "blue";
        ctx.fillRect(p.x * tile, p.y * tile, tile, tile);
    }

    requestAnimationFrame(draw);
}

draw();