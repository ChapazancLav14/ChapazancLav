import { formatMath } from "./mathFormatter.js";
import { isImagePath } from "./csvParser.js";

const data = JSON.parse(localStorage.getItem("wrongReviewQuestion"));

if (!data || !data.question) {
  document.body.innerHTML = "No wrong question found";
  throw new Error("No wrong question data");
}

window.goBack = function () {
  window.location.href = "wrong-questions.html";
};

const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const legacyNote = document.getElementById("legacyNote");

questionEl.innerHTML = formatMath(data.question.question);

const selectedIndex = Number.isInteger(data.selectedIndex) ? data.selectedIndex : null;
const correctIndex = Number.isInteger(data.correctIndex)
  ? data.correctIndex
  : data.question.answers.findIndex((answer) => answer.correct);

if (data.legacyWrong || selectedIndex === null) {
  legacyNote.hidden = false;
}

function renderAnswerContent(target, answerText) {
  const text = String(answerText ?? "").trim();

  if (isImagePath(text)) {
    const img = document.createElement("img");
    img.src = text;
    img.alt = "Answer option";
    img.className = "wrong-review-answer-image";
    target.appendChild(img);
    return;
  }

  target.innerHTML = formatMath(text);
}

data.question.answers.forEach((answer, index) => {
  const item = document.createElement("div");
  item.className = "wrong-review-answer";

  const badge = document.createElement("span");
  badge.className = "wrong-review-badge";
  badge.innerText = String(index + 1);

  const content = document.createElement("div");
  content.className = "wrong-review-answer-content";
  renderAnswerContent(content, answer.text);

  item.appendChild(badge);
  item.appendChild(content);

  if (index === correctIndex) {
    item.classList.add("wrong-review-correct");
  }

  if (selectedIndex !== null && index === selectedIndex && index !== correctIndex) {
    item.classList.add("wrong-review-wrong");
  }

  answersEl.appendChild(item);
});
