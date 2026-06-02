const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { initQuestions, getRandomQuestion } = require("./questions");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

initQuestions();

const players = {};

// 🔥 MAZE FRAGMENTS (world objects)
let fragments = [
  { id: 1, x: 4, y: 4, color: "math" },
  { id: 2, x: 8, y: 5, color: "english" },
  { id: 3, x: 12, y: 7, color: "biology" },
  { id: 4, x: 6, y: 10, color: "chemistry" },
  { id: 5, x: 10, y: 12, color: "physics" }
];

io.on("connection", (socket) => {

  socket.on("joinRoom", ({ name, roomId }) => {
    socket.join(roomId);

    players[socket.id] = {
      id: socket.id,
      name,
      roomId,
      x: 1,
      y: 1,
      fragments: 0
    };

    io.to(roomId).emit("state", { players, fragments });
  });

  socket.on("move", ({ x, y }) => {
    const p = players[socket.id];
    if (!p) return;

    p.x = x;
    p.y = y;

    io.to(p.roomId).emit("state", { players, fragments });
  });

  // 🔥 TOUCH FRAGMENT → SEND QUESTION
  socket.on("touchFragment", ({ fragmentId }) => {
    const p = players[socket.id];
    if (!p) return;

    const frag = fragments.find(f => f.id === fragmentId);
    if (!frag) return;

    const question = getRandomQuestion(frag.color, p.roomId);

    socket.emit("question", {
      fragmentId,
      question
    });
  });

  // 🔥 ANSWER RESULT
  socket.on("answer", ({ fragmentId, correct }) => {
    const p = players[socket.id];
    if (!p) return;

    if (correct) {
      p.fragments += 1;
      fragments = fragments.filter(f => f.id !== fragmentId);
    }

    io.to(p.roomId).emit("state", { players, fragments });
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("state", { players, fragments });
  });
});

server.listen(3000, () => {
  console.log("Maze running on http://localhost:3000");
});