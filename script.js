const quizDiv = document.getElementById("quiz");
const resultDiv = document.getElementById("result");
const submitBtn = document.getElementById("submitBtn");
const restartBtn = document.getElementById("restartBtn");
const themeToggle = document.getElementById("themeToggle");

let questions = [];
let currentQuestions = [];
let weights = JSON.parse(localStorage.getItem("questionWeights")) || {};

// ---------- THEME ----------
function loadTheme() {
  const savedTheme = localStorage.getItem("theme") || "dark";
  if (savedTheme === "light") {
    document.body.classList.add("light");
  }
}

function toggleTheme() {
  document.body.classList.toggle("light");
  const newTheme = document.body.classList.contains("light") ? "light" : "dark";
  localStorage.setItem("theme", newTheme);
}

themeToggle.addEventListener("click", toggleTheme);
loadTheme();

// ---------- LOAD QUESTIONS ----------
async function loadQuestions() {
  const response = await fetch("test.json");
  questions = await response.json();

  questions.forEach(q => {
    if (!weights[q.id]) weights[q.id] = 1;
  });

  startQuiz();
}

// ---------- WEIGHTED RANDOM ----------
function getWeightedRandomQuestions(count) {
  let selected = [];
  let pool = [...questions];

  while (selected.length < count && pool.length > 0) {
    let totalWeight = pool.reduce((sum, q) => sum + weights[q.id], 0);
    let rand = Math.random() * totalWeight;
    let cumulative = 0;

    for (let i = 0; i < pool.length; i++) {
      cumulative += weights[pool[i].id];
      if (rand <= cumulative) {
        selected.push(pool[i]);
        pool.splice(i, 1);
        break;
      }
    }
  }

  return selected;
}

// ---------- START QUIZ ----------
function startQuiz() {
  resultDiv.textContent = "";
  quizDiv.innerHTML = "";
  currentQuestions = getWeightedRandomQuestions(70);

  currentQuestions.forEach((q, index) => {
    const div = document.createElement("div");
    div.classList.add("question");

    div.innerHTML = `
      <p><strong>${index + 1}. ${q.question}</strong></p>
      <div class="options">
        ${q.options.map(opt => `
          <label>
            <input type="checkbox" name="q${q.id}" value="${opt.id}">
            ${opt.text}
          </label>
        `).join("")}
      </div>
    `;

    quizDiv.appendChild(div);
  });
}

function submitQuiz() {
  let score = 0;

  currentQuestions.forEach(q => {
    const questionBlock = document.querySelector(`input[name="q${q.id}"]`).closest(".question");

    const selectedInputs = Array.from(
      document.querySelectorAll(`input[name="q${q.id}"]`)
    );

    const selected = selectedInputs
      .filter(input => input.checked)
      .map(input => input.value);

    const correctSorted = [...q.correct].sort();
    const selectedSorted = [...selected].sort();

    const isCorrect = JSON.stringify(correctSorted) === JSON.stringify(selectedSorted);

    // Disable inputs after submission
    selectedInputs.forEach(input => input.disabled = true);

    if (isCorrect) {
      score++;
      weights[q.id] = Math.max(1, weights[q.id] - 0.2);
      questionBlock.classList.add("correct-question");
    } else {
      weights[q.id] += 1;
      questionBlock.classList.add("wrong-question");
    }

    // Highlight answers
    selectedInputs.forEach(input => {
      const label = input.parentElement;

      if (q.correct.includes(input.value)) {
        // Correct answers
        label.classList.add("correct");

        // If user missed it
        if (!input.checked) {
          label.classList.add("missed");
        }
      } else if (input.checked && !q.correct.includes(input.value)) {
        // Wrong selected answers
        label.classList.add("wrong");
      }
    });
  });

  localStorage.setItem("questionWeights", JSON.stringify(weights));
  resultDiv.textContent = `Your score: ${score} / ${currentQuestions.length}`;
}


submitBtn.addEventListener("click", submitQuiz);
restartBtn.addEventListener("click", startQuiz);

loadQuestions();
