const socket = io();

let maze = [];
let items = [];
let players = {};
let id;

let player = { x: 1, y: 1, fragments: [], keys: [] };

const c = document.getElementById("game");
const ctx = c.getContext("2d");

c.width = window.innerWidth;
c.height = window.innerHeight;

const tile = 20;

// camera
let camX = 0, camY = 0;

// ---------------- JOIN ----------------
function join() {
    socket.emit("join", {
        name: document.getElementById("name").value,
        room: document.getElementById("room").value
    });
}

// ---------------- SOCKET ----------------
socket.on("init", d => {
    maze = d.maze || [];
    items = d.items || [];
    id = d.id;
});

socket.on("players", d => players = d || {});

socket.on("itemsUpdate", d => items = d || []);

socket.on("playerUpdate", p => {
    if (!p) return;
    player = p;
});

// ---------------- MOVE ----------------
document.addEventListener("keydown", e => {
    let nx = player.x;
    let ny = player.y;

    if (e.key === "w") ny--;
    if (e.key === "s") ny++;
    if (e.key === "a") nx--;
    if (e.key === "d") nx++;

    if (maze?.[ny]?.[nx] === 0) {
        player.x = nx;
        player.y = ny;

        socket.emit("move", { x: nx, y: ny });
    }
});

// ---------------- VISION ----------------
function visible(x, y) {
    const dx = player.x - x;
    const dy = player.y - y;
    return Math.sqrt(dx*dx + dy*dy) <= 2.5;
}

// ---------------- DRAW ----------------
function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.setTransform(1,0,0,1,0,0);

    const targetX = player.x * tile - c.width / 2;
    const targetY = player.y * tile - c.height / 2;

    camX += (targetX - camX) * 0.15;
    camY += (targetY - camY) * 0.15;

    ctx.translate(-camX, -camY);

    // maze
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {

            ctx.fillStyle = "#111";
            ctx.fillRect(x*tile,y*tile,tile,tile);

            if (maze[y][x] === 1 && visible(x,y)) {
                ctx.fillStyle = "#fff";
                ctx.fillRect(x*tile,y*tile,tile,tile);
            }
        }
    }

    // items
    items.forEach(i => {
        if (!visible(i.x,i.y)) return;

        ctx.fillStyle = i.color;
        ctx.fillRect(
            i.x*tile+6,
            i.y*tile+6,
            tile-12,
            tile-12
        );
    });

    // players
    for (let p in players) {
        const pl = players[p];
        if (!pl) continue;

        ctx.fillStyle = "red";
        ctx.fillRect(pl.x*tile,pl.y*tile,tile,tile);
    }

    requestAnimationFrame(draw);
}

draw();