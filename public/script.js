console.log("✅ script.js loaded");

const socket = io();

console.log("🔌 socket created");

// DOM check
const canvas = document.getElementById("game");
const ctx = canvas ? canvas.getContext("2d") : null;

if (!canvas) {
  console.error("❌ Canvas NOT FOUND (check index.html id='game')");
} else {
  console.log("🎮 Canvas found");
}

if (canvas) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// STATE
let state = {
  players: {},
  fragments: []
};

// JOIN GAME
function join() {
  const name = document.getElementById("name").value;
  const room = document.getElementById("room").value;

  console.log("🚀 join clicked", name, room);

  socket.emit("joinRoom", {
    name,
    roomId: room
  });

  document.getElementById("menu").style.display = "none";
}

// SOCKET CONNECT
socket.on("connect", () => {
  console.log("🟢 Connected to server:", socket.id);
});

socket.on("disconnect", () => {
  console.log("🔴 Disconnected from server");
});

// RECEIVE STATE
socket.on("state", (data) => {
  console.log("📦 state received:", data);

  state = data;
});

// SIMPLE QUESTION TEST
socket.on("question", (data) => {
  console.log("❓ question received:", data);

  alert(
    data.question.q +
    "\n\nOptions: " +
    data.question.options.join(", ")
  );

  socket.emit("answer", {
    fragmentId: data.fragmentId,
    correct: true
  });
});

// SIMPLE DRAW TEST (NO MAZE, JUST PROOF IT WORKS)
function draw() {
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";

  ctx.fillText("MAZE TEST MODE ACTIVE", 50, 50);
  ctx.fillText("Players: " + Object.keys(state.players).length, 50, 80);
  ctx.fillText("Fragments: " + state.fragments.length, 50, 110);

  requestAnimationFrame(draw);
}

draw();

// TEST KEY (forces fragment trigger)
document.addEventListener("keydown", (e) => {
  if (e.key === "f") {
    console.log("⚡ test fragment trigger");

    socket.emit("touchFragment", {
      fragmentId: 1
    });
  }
});