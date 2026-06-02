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
const used = {};

for (const s of SUBJECTS) questions[s] = [];

function initRoom(roomId) {
  if (!used[roomId]) {
    used[roomId] = {};
    for (const s of SUBJECTS) used[roomId][s] = new Set();
  }
}

function initQuestions() {
  for (const s of SUBJECTS) {
    questions[s] = Array.from({ length: 50 }, (_, i) => create(s, i));
  }
}

function create(subject, i) {
  let q, answer, options;

  if (subject === "math") {
    const a = i + 2;
    const b = i + 3;
    q = `What is ${a} × ${b}?`;
    answer = a * b;
    options = shuffle([answer, answer + 1, answer - 1, answer + 2]);
  } else {
    q = `${subject} question ${i + 1}`;
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
  initRoom(roomId);

  const pool = questions[subject];
  const usedSet = used[roomId][subject];

  if (usedSet.size >= pool.length) usedSet.clear();

  let i;
  do {
    i = Math.floor(Math.random() * pool.length);
  } while (usedSet.has(i));

  usedSet.add(i);

  return pool[i];
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

module.exports = { initQuestions, getRandomQuestion };