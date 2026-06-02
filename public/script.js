const socket = io();

let player = {
  name: "",
  room: ""
};

function join() {
  player.name = document.getElementById("name").value;
  player.room = document.getElementById("room").value;

  socket.emit("joinRoom", {
    name: player.name,
    roomId: player.room
  });

  document.getElementById("menu").style.display = "none";
}

socket.on("question", (data) => {
  const box = document.getElementById("questionBox");
  const qText = document.getElementById("qText");
  const options = document.getElementById("options");

  box.classList.remove("hidden");

  qText.innerText = data.question.q;

  options.innerHTML = "";

  data.question.options.forEach((opt, i) => {
    const btn = document.createElement("button");

    btn.innerText = opt;

    btn.onclick = () => {
      socket.emit("answer", {
        correct: i === data.question.answer
      });

      box.classList.add("hidden");
    };

    options.appendChild(btn);
  });
});

// test fragment collect (press F key)
document.addEventListener("keydown", (e) => {
  if (e.key === "f") {
    socket.emit("collectFragment", {
      color: "math"
    });
  }
});