const socket = io();

let maze = [];
let items = [];
let players = {};
let id;

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

/* =========================
   SMOOTH CAMERA
========================= */
let camX = 0;
let camY = 0;

/* =========================
   JOIN
========================= */
function join() {
    socket.emit("join", {
        name: document.getElementById("name").value,
        room: document.getElementById("room").value
    });
}

/* =========================
   SOCKET EVENTS
========================= */
socket.on("init", d => {
    maze = d.maze || [];
    items = d.items || [];
    id = d.id;
});

socket.on("players", d => {
    players = d || {};
});

socket.on("itemsUpdate", d => {
    items = d || [];
});

socket.on("playerUpdate", p => {
    if (!p) return;

    player = p;

    const f = document.getElementById("f");
    const k = document.getElementById("k");

    if (f) f.innerText = p.fragments.length;
    if (k) k.innerText = p.keys.length;
});

/* =========================
   CHAT
========================= */
socket.on("chat", d => {
    const box = document.getElementById("chatBox");
    if (!box) return;

    box.innerHTML += `<div><b>${d.name}:</b> ${d.msg}</div>`;
    box.scrollTop = box.scrollHeight;
});

/* =========================
   LEADERBOARD
========================= */
socket.on("leaderboard", data => {
    const b = document.getElementById("board");
    if (!b) return;

    b.innerHTML = "";
    data.forEach(p => {
        b.innerHTML += `<div>${p.name} - ${(p.time / 1000).toFixed(2)}s</div>`;
    });
});

/* =========================
   MOVEMENT
========================= */
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

        socket.emit("move", {
            x: nx,
            y: ny
        });

        checkItems();
    }
});

/* =========================
   ITEMS
========================= */
function checkItems() {
    items.forEach(i => {
        if (!i) return;

        if (player.x === i.x && player.y === i.y) {
            socket.emit("collect", i.id);
        }
    });
}

/* =========================
   SMALL VISION
========================= */
function visible(x, y) {
    const dx = player.x - x;
    const dy = player.y - y;
    return Math.sqrt(dx * dx + dy * dy) <= 2.2;
}

/* =========================
   DRAW LOOP
========================= */
function draw() {

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);

    if (!maze.length) {
        requestAnimationFrame(draw);
        return;
    }

    /* =========================
       SMOOTH CENTERED CAMERA
    ========================= */
    const targetX = player.x * tile - c.width / 2;
    const targetY = player.y * tile - c.height / 2;

    camX += (targetX - camX) * 0.12;
    camY += (targetY - camY) * 0.12;

    ctx.translate(-camX, -camY);

    /* ---------------- MAZE ---------------- */
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {

            ctx.fillStyle = "#111";
            ctx.fillRect(x * tile, y * tile, tile, tile);

            if (maze[y][x] === 1 && visible(x, y)) {
                ctx.fillStyle = "#fff";
                ctx.fillRect(x * tile, y * tile, tile, tile);
            }
        }
    }

    /* ---------------- ITEMS ---------------- */
    for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it) continue;
        if (!visible(it.x, it.y)) continue;

        ctx.fillStyle = it.color || "cyan";

        const size = tile * 0.55;
        const pad = (tile - size) / 2;

        ctx.fillRect(
            it.x * tile + pad,
            it.y * tile + pad,
            size,
            size
        );
    }

    /* ---------------- PLAYERS ---------------- */
    for (let p in players) {
        const pl = players[p];
        if (!pl) continue;

        if (!visible(pl.x, pl.y)) continue;

        ctx.fillStyle = "red";

        ctx.fillRect(
            pl.x * tile + 2,
            pl.y * tile + 2,
            tile - 4,
            tile - 4
        );
    }

    requestAnimationFrame(draw);
}

draw();