import { state } from "../quizState.js";
import { formatMath } from "../mathFormatter.js";
import { checkAnswer } from "./answerHandler.js";
import { endQuiz } from "./endQuiz.js";

export function loadQuestion() {
  const input = document.getElementById("jumpInput");

  if (input) {
    input.value = "";
    input.placeholder = `1 - ${state.filteredQuiz.length}`;
  }

  const q = state.filteredQuiz[state.currentQuestion];

  if (!q) {
    endQuiz();
    return;
  }

  updateCsvQuestionId(q);
  updateImageLayoutClass(q);
  renderQuestionText(q);
  renderQuestionImage(q);
  renderAnswers(q);
  updateQuestionNavButtons();
}

function updateCsvQuestionId(q) {
  const csvQuestionIdBox = document.getElementById("csv-question-id");
  if (csvQuestionIdBox) {
    csvQuestionIdBox.textContent = q.id ?? "";
  }
}

function updateImageLayoutClass(q) {
  const currentOption = localStorage.getItem("currentOption");
  const start = Number(localStorage.getItem("quizStart"));
  const end = Number(localStorage.getItem("quizEnd"));

  document.body.classList.remove("option1-image-layout");

  if (
    (currentOption === "1" || (start === 1 && end === 125)) &&
    q.image &&
    q.image.trim() !== ""
  ) {
    document.body.classList.add("option1-image-layout");
  }
}

function renderQuestionText(q) {
  document.getElementById("question").innerHTML = formatMath(q.question);

  document.getElementById("question-number").innerText =
    `Question ${state.currentQuestion + 1} / ${state.filteredQuiz.length}`;
}

function renderQuestionImage(q) {
  const imageContainer = document.getElementById("image-container");
  imageContainer.innerHTML = "";

  if (q.image && q.image.trim() !== "") {
    const img = document.createElement("img");
    img.className = "question-image";

    img.onload = () => {
      img.classList.toggle("image-tall", img.naturalHeight > img.naturalWidth * 1.15);
      img.classList.toggle("image-wide", img.naturalWidth >= img.naturalHeight * 1.15);
      imageContainer.appendChild(img);
    };

    img.onerror = () => {
      imageContainer.innerHTML = "";
      imageContainer.style.display = "none";
    };

    imageContainer.style.display = "block";
    img.src = q.image.trim();
  } else {
    imageContainer.style.display = "none";
  }
}

function renderAnswers(q) {
  const answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";

  if (q.answers.length === 4) {
    answersDiv.style.gridAutoFlow = "column";
    answersDiv.style.gridTemplateRows = "repeat(2, auto)";
  } else {
    answersDiv.style.gridAutoFlow = "row";
  }

  q.answers.forEach((ans, index) => {
    const btn = document.createElement("button");
    btn.className = "answer";
    btn.dataset.index = String(index + 1);

    const answerText = String(ans.text ?? "").trim().replace(/\r/g, "");

    if (/\.(png|jpg|jpeg|webp)$/i.test(answerText)) {
      btn.classList.add("has-image-answer");
      btn.innerHTML = `
        <span class="answer-badge">${index + 1}</span>
        <span class="answer-content"><img src="${answerText}" class="answer-image"></span>
      `;
    } else {
      btn.innerHTML = `
        <span class="answer-badge">${index + 1}</span>
        <span class="answer-content">${formatMath(answerText)}</span>
      `;

      if (answerText.length <= 10) {
        btn.classList.add("short-answer");
      }
    }

    btn.onclick = () => checkAnswer(btn, index);
    answersDiv.appendChild(btn);
  });
}

export function updateQuestionNavButtons() {
  const prevBtn = document.getElementById("prevQuestionBtn");
  const skipBtn = document.getElementById("skipQuestionBtn");

  if (prevBtn) {
    prevBtn.disabled = state.currentQuestion <= 0;
  }

  if (skipBtn) {
    skipBtn.disabled = state.filteredQuiz.length === 0;
  }
}
