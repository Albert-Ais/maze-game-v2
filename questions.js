const SUBJECTS = [
  "math",
  "english",
  "biology",
  "chemistry",
  "physics",
  "economics",
  "geography",
  "business",
  "computer_science",
  "sociology"
];

const questions = {};
const usedQuestions = {};

for (const s of SUBJECTS) {
  questions[s] = [];
}

function initRoom(roomId) {
  if (!usedQuestions[roomId]) {
    usedQuestions[roomId] = {};
    for (const s of SUBJECTS) {
      usedQuestions[roomId][s] = new Set();
    }
  }
}

function initQuestions() {
  for (const s of SUBJECTS) {
    questions[s] = generate(s);
  }
}

function generate(subject) {
  const arr = [];

  for (let i = 1; i <= 50; i++) {
    arr.push(create(subject, i));
  }

  return arr;
}

function create(subject, i) {
  let q, answer, options;

  switch (subject) {

    case "math": {
      const a = i + 2;
      const b = i + 3;
      q = `What is ${a} × ${b}?`;
      answer = a * b;
      options = shuffle([answer, answer + 1, answer - 1, answer + 2]);
      break;
    }

    case "english": {
      const words = ["run", "eat", "go", "write", "read"];
      const word = words[i % words.length];

      const answers = {
        run: "ran",
        eat: "ate",
        go: "went",
        write: "wrote",
        read: "read"
      };

      q = `What is the past tense of "${word}"?`;
      answer = answers[word];
      options = shuffle([answer, "goed", "runned", "eated"]);
      break;
    }

    case "biology":
      q = "What is the basic unit of life?";
      answer = "Cell";
      options = shuffle(["Cell", "Atom", "Tissue", "Organ"]);
      break;

    case "chemistry":
      q = "What is H2O?";
      answer = "Water";
      options = shuffle(["Water", "Oxygen", "Hydrogen", "Salt"]);
      break;

    case "physics":
      q = "What force pulls objects toward Earth?";
      answer = "Gravity";
      options = shuffle(["Gravity", "Magnetism", "Friction", "Tension"]);
      break;

    case "economics":
      q = "What is scarcity?";
      answer = "Limited resources";
      options = shuffle(["Limited resources", "Unlimited money", "Inflation", "Tax"]);
      break;

    case "geography":
      q = "What is the capital of Rwanda?";
      answer = "Kigali";
      options = shuffle(["Kigali", "Nairobi", "Kampala", "Dodoma"]);
      break;

    case "business":
      q = "What is profit?";
      answer = "Revenue minus cost";
      options = shuffle(["Revenue minus cost", "Cost minus revenue", "Sales", "Tax"]);
      break;

    case "computer_science":
      q = "What does CPU stand for?";
      answer = "Central Processing Unit";
      options = shuffle([
        "Central Processing Unit",
        "Computer Personal Unit",
        "Central Power Unit",
        "Control Processing Unit"
      ]);
      break;

    case "sociology":
      q = "What is society?";
      answer = "A group of people living together";
      options = shuffle([
        "A group of people living together",
        "A single person",
        "A machine",
        "A building"
      ]);
      break;
  }

  const correctIndex = options.findIndex(o => o === answer);

  return { q, options, answer: correctIndex };
}

function getRandomQuestion(subject, roomId = "global") {
  initRoom(roomId);

  const pool = questions[subject];
  const used = usedQuestions[roomId][subject];

  if (used.size >= pool.length) used.clear();

  let i;
  do {
    i = Math.floor(Math.random() * pool.length);
  } while (used.has(i));

  used.add(i);

  return pool[i];
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

module.exports = { initQuestions, getRandomQuestion };