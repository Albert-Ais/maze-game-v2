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

function initQuestions() {
  for (const s of SUBJECTS) {
    questions[s] = Array.from({ length: 10 }, (_, i) =>
      create(s, i)
    );
  }
}

function create(subject, i) {
  let q, answer, options;

  switch (subject) {

    case "math":
      q = `What is ${i + 2} × ${i + 3}?`;
      answer = (i + 2) * (i + 3);
      options = shuffle([answer, answer + 1, answer - 1, answer + 2]);
      break;

    case "english":
      const words = ["run","go","eat","write","read"];
      const w = words[i % words.length];
      const map = {run:"ran", go:"went", eat:"ate", write:"wrote", read:"read"};

      q = `Past tense of ${w}?`;
      answer = map[w];
      options = shuffle([answer,"wrong1","wrong2","wrong3"]);
      break;

    case "biology":
      q = "Basic unit of life?";
      answer = "Cell";
      options = shuffle(["Cell","Atom","Tissue","Organ"]);
      break;

    case "chemistry":
      q = "What is H2O?";
      answer = "Water";
      options = shuffle(["Water","Oxygen","Hydrogen","Salt"]);
      break;

    case "physics":
      q = "Gravity is?";
      answer = "Force";
      options = shuffle(["Force","Light","Sound","Heat"]);
      break;

    case "economics":
      q = "Scarcity means?";
      answer = "Limited resources";
      options = shuffle(["Limited resources","Infinite goods","Free money","No trade"]);
      break;

    case "geography":
      q = "Capital of Rwanda?";
      answer = "Kigali";
      options = shuffle(["Kigali","Nairobi","Kampala","Dodoma"]);
      break;

    case "business":
      q = "Profit is?";
      answer = "Revenue minus cost";
      options = shuffle(["Revenue minus cost","Cost minus revenue","Tax","Loss"]);
      break;

    case "computer_science":
      q = "CPU stands for?";
      answer = "Central Processing Unit";
      options = shuffle([
        "Central Processing Unit",
        "Computer Power Unit",
        "Central Program Unit",
        "Control Power Unit"
      ]);
      break;

    case "sociology":
      q = "Society is?";
      answer = "Group of people";
      options = shuffle([
        "Group of people",
        "One person",
        "Machine",
        "Building"
      ]);
      break;
  }

  return {
    q,
    options,
    answer: options.indexOf(answer)
  };
}

function getRandomQuestion(subject) {
  const pool = questions[subject];
  return pool[Math.floor(Math.random() * pool.length)];
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

module.exports = { initQuestions, getRandomQuestion };