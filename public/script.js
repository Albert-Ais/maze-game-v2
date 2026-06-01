const socket = io();

let maze = [], items = [], players = {}, id;

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

        socket.emit("move", player);
        checkItems();
    }
});

// ---------------- ITEMS ----------------
function checkItems() {
    items.forEach(i => {
        if (player.x === i.x && player.y === i.y) {
            socket.emit("collect", i.id);
        }
    });
}

// ---------------- SMALL VISION ----------------
function visible(x, y) {
    return Math.abs(player.x - x) <= 3 &&
           Math.abs(player.y - y) <= 3;
}

// ---------------- DRAW ----------------
function draw() {

    ctx.clearRect(0, 0, c.width, c.height);

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (!maze.length) {
        requestAnimationFrame(draw);
        return;
    }

    // ---------------- MAZE ----------------
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {

            // IMPORTANT: always draw floor for stability
            ctx.fillStyle = "#111";
            ctx.fillRect(x * tile, y * tile, tile, tile);

            if (maze[y][x] === 1 && visible(x, y)) {
                ctx.fillStyle = "white";
                ctx.fillRect(x * tile, y * tile, tile, tile);
            }
        }
    }

    // ---------------- ITEMS ----------------
    items.forEach(i => {
        if (!i) return;
        if (!visible(i.x, i.y)) return;

        ctx.fillStyle = i.color || "cyan";

        ctx.fillRect(
            i.x * tile + 6,
            i.y * tile + 6,
            tile - 12,
            tile - 12
        );
    });

    // ---------------- PLAYERS ----------------
    for (let p in players) {
        if (!players[p]) continue;

        if (!visible(players[p].x, players[p].y)) continue;

        ctx.fillStyle = "red";
        ctx.fillRect(
            players[p].x * tile,
            players[p].y * tile,
            tile,
            tile
        );
    }

    requestAnimationFrame(draw);
}

draw();