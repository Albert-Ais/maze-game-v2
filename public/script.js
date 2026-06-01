const socket = io();

let maze = [];
let items = [];
let players = {};
let id;
let isAdmin = false;

const tile = 20;

// ---------------- COLORS (10 PAIRS) ----------------
const colors = [
    "#ff0000","#00ff00","#0000ff","#ffff00","#ff00ff",
    "#00ffff","#ff8800","#8800ff","#ffffff","#ff4444"
];

// ---------------- PLAYER ----------------
let player = {
    x: 1,
    y: 1,
    fragments: [],
    keys: []
};

// ---------------- CANVAS ----------------
const c = document.getElementById("game");
const ctx = c.getContext("2d");

c.width = window.innerWidth;
c.height = window.innerHeight;

// ---------------- JOIN ----------------
function join() {
    const name = document.getElementById("name").value.trim();
    const room = document.getElementById("room").value.trim();

    if (!name || !room) return alert("Enter name + room");

    socket.emit("join", { name, room });
}

// ---------------- SOCKET ----------------
socket.on("init", data => {
    maze = data.maze;
    items = data.items;
    id = data.id;
});

socket.on("admin", data => {
    isAdmin = true;
    maze = data.maze;
    items = data.items;
    players = data.players;
});

socket.on("players", data => players = data);

socket.on("itemsUpdate", data => items = data);

// ---------------- MOVEMENT (FIXED GRID) ----------------
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

// ---------------- ITEM COLLECT ----------------
function checkItems() {
    items.forEach(i => {
        if (player.x === i.x && player.y === i.y) {
            socket.emit("collect", i.id);
        }
    });
}

// ---------------- FULL MAP (NO FOG BUG) ----------------
function visible() {
    return true;
}

// ---------------- CAMERA (CORRECT) ----------------
function getCamera() {
    return {
        camX: (player.x + 0.5) * tile - c.width / 2,
        camY: (player.y + 0.5) * tile - c.height / 2
    };
}

// ---------------- DRAW LOOP ----------------
function draw() {

    ctx.clearRect(0, 0, c.width, c.height);

    const { camX, camY } = getCamera();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(-camX, -camY);

    // ---------------- MAZE ----------------
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {

            if (maze[y][x] === 1) {
                ctx.fillStyle = "white";
                ctx.fillRect(x * tile, y * tile, tile, tile);
            }
        }
    }

    // ---------------- ITEMS (SMALL + COLORED PAIRS) ----------------
    items.forEach(i => {

        const index = parseInt(i.id.slice(1)); // f0 / k0 → 0-9
        const color = colors[index];

        ctx.fillStyle = color;

        // smaller items
        ctx.fillRect(
            i.x * tile + tile * 0.25,
            i.y * tile + tile * 0.25,
            tile * 0.5,
            tile * 0.5
        );
    });

    // ---------------- PLAYERS ----------------
    for (let pid in players) {
        const p = players[pid];

        ctx.fillStyle = pid === id ? "red" : "blue";
        ctx.fillRect(p.x * tile, p.y * tile, tile, tile);
    }

    requestAnimationFrame(draw);
}

draw();