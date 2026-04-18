//script.js
import { auth, db } from "./data.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { doc, getDoc, setDoc } 
from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

console.log("🚀 script loaded");

// ===============================
// QUIZ DATA
// ===============================
let quiz = [];
let filteredQuiz = [];
let currentQuestion = 0;
let score = 0;
let answeredCount = 0;

// RESULT DATA
let userAnswers = [];
let startTime = Date.now();

// USER DATA
let answeredCorrectly = {};

// ===============================
// 🔥 LOAD
// ===============================
loadQuestions();

// ===============================
// 🔐 AUTH
// ===============================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await loadUserProgress();

    // 🔥 DAY TRACK
    updateDayTrack();
  }
});

// ===============================
// 🔥 DAY TRACK (BOX VERSION)
// ===============================
function updateDayTrack() {
  const today = new Date();

  const todayStr = today.toISOString().slice(0, 10);
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  let stored = JSON.parse(localStorage.getItem("dayTrack")) || {
    lastDate: null,
    streak: 0,
    month: currentMonth,
    year: currentYear
  };

  // RESET MONTH
  if (stored.month !== currentMonth || stored.year !== currentYear) {
    stored.streak = 0;
    stored.month = currentMonth;
    stored.year = currentYear;
  }

  // NEW DAY
  if (stored.lastDate !== todayStr) {
    stored.streak += 1;
    stored.lastDate = todayStr;

    localStorage.setItem("dayTrack", JSON.stringify(stored));
  }

  // 🔥 SET MONTH NAME
  document.getElementById("month-label").innerText =
    monthNames[currentMonth];

  // 🔥 BOXES
  const daysInMonth = new Date(
    currentYear,
    currentMonth + 1,
    0
  ).getDate();

  const container = document.getElementById("day-boxes");
  container.innerHTML = "";

  for (let i = 0; i < daysInMonth; i++) {
    const box = document.createElement("div");
    box.className = "day-box";

    if (i < stored.streak) {
      box.classList.add("active");
    }

    container.appendChild(box);
  }
}

// ===============================
// LOAD USER PROGRESS
// ===============================
async function loadUserProgress() {
  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    answeredCorrectly = snap.data().answeredCorrectly || {};
  }
}

// ===============================
// SAVE CORRECT ANSWER
// ===============================
async function saveCorrectAnswer(qId) {
  const user = auth.currentUser;
  if (!user) return;

  if (!answeredCorrectly[qId]) {
    answeredCorrectly[qId] = true;

    const ref = doc(db, "users", user.uid);

    await setDoc(ref, {
      answeredCorrectly
    }, { merge: true });
  }
}

// ===============================
// 📚 LOAD QUESTIONS
// ===============================
async function loadQuestions() {
  const res = await fetch("data/questions.json");
  const data = await res.json();

  quiz = data;

  const start = Number(localStorage.getItem("quizStart"));
  const end = Number(localStorage.getItem("quizEnd"));

  console.log("🔥 RANGE:", start, end);

  if (!isNaN(start) && !isNaN(end)) {
    filteredQuiz = quiz.filter(q => q.id >= start && q.id <= end);
  } else {
    document.body.innerHTML = "❌ Missing quiz range";
    return;
  }

  if (filteredQuiz.length === 0) {
    document.body.innerHTML = "❌ No questions found";
    return;
  }

  currentQuestion = 0;
  score = 0;
  answeredCount = 0;
  userAnswers = [];
  startTime = Date.now();

  loadQuestion();
  updateProgress();
}

// ===============================
// 🔥 LOAD QUESTION
// ===============================
function loadQuestion() {
  const q = filteredQuiz[currentQuestion];

  if (!q) {
    endQuiz();
    return;
  }

  document.getElementById("question").innerText = q.question;

  const imageContainer = document.getElementById("image-container");
  imageContainer.innerHTML = "";

  if (q.image) {
    const img = document.createElement("img");
    img.src = q.image;
    img.className = "question-image";
    imageContainer.appendChild(img);
  }

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
    btn.innerText = (index + 1) + ". " + ans.text;

    btn.onclick = () => checkAnswer(btn, index);

    answersDiv.appendChild(btn);
  });
}

// ===============================
// CHECK ANSWER
// ===============================
function checkAnswer(btn, index) {
  const all = document.querySelectorAll(".answer");
  all.forEach(b => b.disabled = true);

  const feedback = document.getElementById("feedback");
  const title = document.getElementById("feedback-title");
  const text = document.getElementById("feedback-text");

  const currentQ = filteredQuiz[currentQuestion];
  const correctIndex = currentQ.answers.findIndex(a => a.correct);

  all.forEach((b, i) => {
    if (i === correctIndex) b.classList.add("correct");
  });

  const isCorrect = index === correctIndex;

  userAnswers.push({
    question: currentQ,
    selectedIndex: index,
    correctIndex,
    isCorrect
  });

  if (isCorrect) {
    score++;
    saveCorrectAnswer(currentQ.id);

    title.innerText = "Ճիշտ է";
    text.innerText = "Դուք ճիշտ պատասխանեցիք";
    feedback.className = "feedback correct-bg show";
  } else {
    btn.classList.add("wrong");

    title.innerText = "Սխալ է";
    text.innerText = "Ճիշտ պատասխանը նշված է կանաչով";
    feedback.className = "feedback wrong-bg show";
  }

  answeredCount++;
  updateProgress();
}

// ===============================
window.nextQuestion = function () {
  document.getElementById("feedback").classList.remove("show");

  currentQuestion++;

  if (currentQuestion < filteredQuiz.length) {
    setTimeout(loadQuestion, 300);
  } else {
    endQuiz();
  }
};

// ===============================
function endQuiz() {
  const endTime = Date.now();
  const totalTime = Math.floor((endTime - startTime) / 1000);

  const currentPage = localStorage.getItem("currentPage");
  if (currentPage) {
    localStorage.setItem("lastPage", currentPage);
  }

  localStorage.setItem("quizResults", JSON.stringify({
    score,
    total: filteredQuiz.length,
    answers: userAnswers,
    time: totalTime
  }));

  window.location.href = "result.html";
}

// ===============================
function updateProgress() {
  const total = filteredQuiz.length;
  const percent = total ? (answeredCount / total) * 100 : 0;

  document.getElementById("progress-bar").style.width = percent + "%";
  document.getElementById("progress-text").innerText =
    answeredCount + "/" + total;
}

// ===============================
window.goBack = function () {
  window.history.back();
};