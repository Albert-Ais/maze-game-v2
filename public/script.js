console.log("🧪 SCRIPT LOADED - PROOF TEST");

const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// STATE (disabled game logic)
let state = {};

// ===================== SOCKET CHECK =====================
socket.on("connect", () => {
  console.log("🟢 SOCKET CONNECTED:", socket.id);
});

socket.on("disconnect", () => {
  console.log("🔴 SOCKET DISCONNECTED");
});

// If server sends anything
socket.on("state", (data) => {
  console.log("📦 STATE RECEIVED:", data);
  state = data;
});

// ===================== DRAW PROOF =====================
function draw() {
  // CLEAR SCREEN
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // BIG TEST TEXT
  ctx.fillStyle = "lime";
  ctx.font = "30px Arial";
  ctx.fillText("PROOF TEST ACTIVE", 50, 80);

  ctx.fillStyle = "white";
  ctx.fillText("If you see this → canvas WORKS", 50, 140);

  ctx.fillText("Socket: " + (socket.id || "not connected"), 50, 200);

  // show raw state size
  const keys = Object.keys(state);
  ctx.fillText("State keys: " + keys.length, 50, 260);

  requestAnimationFrame(draw);
}

draw();

// ===================== KEY TEST =====================
document.addEventListener("keydown", (e) => {
  console.log("KEY:", e.key);
});