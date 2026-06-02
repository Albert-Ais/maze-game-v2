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

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("joinRoom", ({ name, roomId }) => {
    socket.join(roomId);

    players[socket.id] = {
      id: socket.id,
      name,
      roomId,
      fragments: 0
    };

    io.to(roomId).emit("players", players);
  });

  socket.on("collectFragment", ({ color }) => {
    const player = players[socket.id];
    if (!player) return;

    const question = getRandomQuestion(color, player.roomId);

    io.to(socket.id).emit("question", {
      color,
      question
    });
  });

  socket.on("answer", ({ correct }) => {
    const player = players[socket.id];
    if (!player) return;

    if (correct) {
      player.fragments += 1;
    }

    io.to(player.roomId).emit("players", players);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("players", players);
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});