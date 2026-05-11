import { auth, db } from "./data.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { parseCSV } from "./csvParser.js";

window.goBack = function () {
  window.location.href = "home.html";
};

function normalizeWrongInfo(value, question) {
  const correctIndex = question.answers.findIndex((answer) => answer.correct);

  // Old saved data was only: answeredWrong[id] = true.
  // That can show the question, but cannot show the last selected wrong answer.
  if (value === true) {
    return {
      selectedIndex: null,
      correctIndex,
      updatedAt: 0,
      legacy: true,
    };
  }

  return {
    selectedIndex: Number.isInteger(value?.selectedIndex)
      ? value.selectedIndex
      : null,
    correctIndex: Number.isInteger(value?.correctIndex)
      ? value.correctIndex
      : correctIndex,
    updatedAt: Number(value?.updatedAt) || 0,
    legacy: false,
  };
}

async function loadAllQuestions() {
  const res = await fetch("data/questions.csv");
  const text = await res.text();
  return parseCSV(text);
}

function openWrongReview(question, wrongInfo) {
  localStorage.setItem(
    "wrongReviewQuestion",
    JSON.stringify({
      question,
      selectedIndex: wrongInfo.selectedIndex,
      correctIndex: wrongInfo.correctIndex,
      updatedAt: wrongInfo.updatedAt,
      legacyWrong: wrongInfo.legacy,
    })
  );

  window.location.href = "wrong-question-review.html";
}

function renderWrongQuestions(items) {
  const grid = document.getElementById("wrongGrid");
  const total = document.getElementById("wrongTotal");
  const empty = document.getElementById("wrongEmpty");

  grid.innerHTML = "";
  total.innerText = String(items.length);
  empty.hidden = items.length !== 0;

  items.forEach(({ question, wrongInfo }, index) => {
    const btn = document.createElement("button");
    btn.className = "wrong-card";

    btn.innerHTML = `
      <span class="wrong-card-badge">${question.id}</span>
      <span class="wrong-card-title">Question ${index + 1}</span>
      <span class="wrong-card-subtitle">
        ${wrongInfo.legacy ? "Correct answer only" : "Review last wrong answer"}
      </span>
    `;

    btn.onclick = () => openWrongReview(question, wrongInfo);
    grid.appendChild(btn);
  });
}

async function loadWrongQuestions(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const answeredWrong = snap.exists() ? snap.data().answeredWrong || {} : {};

  const questions = await loadAllQuestions();
  const questionById = new Map(questions.map((question) => [String(question.id), question]));

  const items = Object.entries(answeredWrong)
    .map(([id, wrongValue]) => {
      const question = questionById.get(String(id));
      if (!question) return null;

      return {
        question,
        wrongInfo: normalizeWrongInfo(wrongValue, question),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.question.id - b.question.id);

  renderWrongQuestions(items);
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    document.getElementById("wrongTotal").innerText = "0";
    document.getElementById("wrongEmpty").hidden = false;
    return;
  }

  loadWrongQuestions(user).catch((err) => {
    console.error("Wrong questions load error:", err);
    document.getElementById("wrongEmpty").hidden = false;
    document.getElementById("wrongEmpty").innerText = "Չհաջողվեց բեռնել սխալ հարցերը։";
  });
});
