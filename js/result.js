import { auth, db } from "./data.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

// ===============================
// 📦 LOAD RESULT DATA
// ===============================
const resultData = JSON.parse(localStorage.getItem("quizResults"));

if (!resultData) {
  document.body.innerHTML = "No results found";
  throw new Error("No quiz data");
}

// ===============================
// 🔙 BACK BUTTON
// ===============================
window.goBack = function () {
  const lastPage = localStorage.getItem("lastPage");

  if (lastPage) {
    window.location.href = "pages/" + lastPage + ".html";
  } else {
    window.location.href = "home.html";
  }
};

// ===============================
// 📊 CALCULATE %
// ===============================
let percent = 0;

if (resultData.total > 0) {
  percent = Math.round((resultData.score / resultData.total) * 100);
}

if (isNaN(percent) || percent < 0) percent = 0;
if (percent > 100) percent = 100;

// ===============================
// 🔥 SAVE TO FIREBASE
// ===============================
async function saveResult(user) {
  if (!user) return;

  const option = localStorage.getItem("currentOption");
  const currentPage = localStorage.getItem("currentPage");

  if (!option || !currentPage) return;

  const ref = doc(db, "users", user.uid, "stats", currentPage);
  const key = "option" + option;

  try {
    const snap = await getDoc(ref);
    let existingData = snap.exists() ? snap.data() : {};

    const shouldSave =
      existingData[key] === undefined || percent > existingData[key];

    if (shouldSave) {
      await setDoc(
        ref,
        { [key]: percent },
        { merge: true }
      );
    }
  } catch (err) {
    console.error("❌ SAVE ERROR:", err);
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) saveResult(user);
});

// ===============================
// 🎯 UI UPDATE
// ===============================
const circle = document.getElementById("circle");
circle.style.setProperty("--percent", percent + "%");

document.getElementById("percent").innerText = percent + "%";
document.getElementById("time").innerText = resultData.time + " sec";
let correctCount = 0;
let wrongCount = 0;
let partialCount = 0;

resultData.answers.forEach((q) => {
  if (!q || !q.attempts) return;

  const hasCorrect = q.attempts.some(a => a.isCorrect);
  const hasWrong = q.attempts.some(a => !a.isCorrect);

  if (hasCorrect && hasWrong) {
    partialCount++; // 🟠 ԹԵՐԻ
  } else if (hasCorrect) {
    correctCount++; // ✅ ONLY pure correct
  } else {
    wrongCount++; // ❌ ONLY pure wrong
  }
});

// ✅ SET UI
document.getElementById("correct").innerText = correctCount;
document.getElementById("wrong").innerText = wrongCount;
document.getElementById("partial").innerText = partialCount;

const skipped = (resultData.total || 0) - (resultData.answered || 0);
document.getElementById("skipped").innerText = skipped;

// ===============================
// ✅ STATUS LOGIC (FIXED)
// ===============================
function getQuestionStatus(qData) {
  if (!qData || !qData.attempts || qData.attempts.length === 0) {
    return "unanswered";
  }

  const hasCorrect = qData.attempts.some(a => a.isCorrect);
  const hasWrong = qData.attempts.some(a => !a.isCorrect);

  if (hasCorrect && hasWrong) return "partial"; // 🟠 ԹԵՐԻ
  if (hasCorrect) return "correct";             // ✅
  return "wrong";                               // ❌
}

// ===============================
// 🔢 GRID
// ===============================
const grid = document.getElementById("grid");


resultData.answers.forEach((a, i) => {
  if (!a) return;

  const btn = document.createElement("button");
  btn.innerText = i + 1;

  const status = getQuestionStatus(a);

  if (status === "correct") {
    btn.className = "correct-box";
  } else if (status === "wrong") {
    btn.className = "wrong-box";
  } else if (status === "partial") {
    btn.className = "partial-box";
  }

  btn.onclick = () => {
    localStorage.setItem("reviewQuestion", JSON.stringify(a));
    localStorage.setItem("fromReview", "true");
    window.location.href = "./review.html";
  };

  grid.appendChild(btn);
});

// ✅ FIX: correct partial count

// ===============================
// 🧹 CLEAR DATA SAFELY
// ===============================
window.addEventListener("beforeunload", () => {
  const fromReview = localStorage.getItem("fromReview");

  if (fromReview === "true") {
    localStorage.removeItem("fromReview");
    return;
  }

  localStorage.removeItem("quizResults");
});