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

    const f = document.getElementById("f");
    const k = document.getElementById("k");

    if (f) f.innerText = p.fragments.length;
    if (k) k.innerText = p.keys.length;
});

// ---------------- CHAT ----------------
socket.on("chat", d => {
    const box = document.getElementById("chatBox");
    if (!box) return;

    box.innerHTML += `<div><b>${d.name}:</b> ${d.msg}</div>`;
    box.scrollTop = box.scrollHeight;
});

// ---------------- LEADERBOARD ----------------
socket.on("leaderboard", data => {
    const b = document.getElementById("board");
    if (!b) return;

    b.innerHTML = "";
    data.forEach(p => {
        b.innerHTML += `<div>${p.name} - ${(p.time / 1000).toFixed(2)}s</div>`;
    });
});

// ---------------- MOVEMENT ----------------
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
            x: player.x,
            y: player.y
        });

        checkItems();
    }
});

// ---------------- ITEMS ----------------
function checkItems() {
    items.forEach(i => {
        if (!i) return;

        const dx = player.x - i.x;
        const dy = player.y - i.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= 1) {
            socket.emit("collect", i.id);
        }
    });
}

// ---------------- DRAW FULL MAP ----------------
function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (!maze.length) {
        requestAnimationFrame(draw);
        return;
    }

    // ---------------- MAZE (FULLY VISIBLE) ----------------
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {

            ctx.fillStyle = "#111";
            ctx.fillRect(x * tile, y * tile, tile, tile);

            if (maze[y][x] === 1) {
                ctx.fillStyle = "#fff";
                ctx.fillRect(x * tile, y * tile, tile, tile);
            }
        }
    }

    // ---------------- ITEMS ----------------
    items.forEach(i => {
        if (!i) return;

        ctx.fillStyle = i.color || "cyan";

        const size = tile * 0.6;
        const pad = (tile - size) / 2;

        ctx.fillRect(
            i.x * tile + pad,
            i.y * tile + pad,
            size,
            size
        );
    });

    // ---------------- PLAYERS ----------------
    for (let p in players) {
        if (!players[p]) continue;

        ctx.fillStyle = "red";

        ctx.fillRect(
            players[p].x * tile + 2,
            players[p].y * tile + 2,
            tile - 4,
            tile - 4
        );
    }

    requestAnimationFrame(draw);
}

draw();