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
  let q, options, answer;

  switch (subject) {
    case "math":
      q = `What is ${i + 2} × ${i + 3}?`;
      answer = (i + 2) * (i + 3);
      options = shuffle([answer, answer + 1, answer - 1, answer + 2]);
      break;

    case "english":
      q = "What is past tense of go?";
      answer = "went";
      options = shuffle(["went", "goed", "gone", "goes"]);
      break;

    case "biology":
      q = "Basic unit of life?";
      answer = "cell";
      options = shuffle(["cell", "atom", "tissue", "organ"]);
      break;

    default:
      q = "Placeholder question";
      answer = "A";
      options = shuffle(["A", "B", "C", "D"]);
  }

  return {
    q,
    options,
    answer: options.indexOf(answer)
  };
}

function getRandomQuestion(subject, roomId = "global") {
  const pool = questions[subject];
  if (!pool) return null;

  initRoom(roomId);

  const used = usedQuestions[roomId][subject];

  if (used.size >= pool.length) used.clear();

  let index;
  do {
    index = Math.floor(Math.random() * pool.length);
  } while (used.has(index));

  used.add(index);

  return pool[index];
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

module.exports = {
  initQuestions,
  getRandomQuestion
};