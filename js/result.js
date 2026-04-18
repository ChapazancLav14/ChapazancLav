//result.js
import { auth, db } from "./data.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

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
    window.location.href = "../pages/" + lastPage + ".html";
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
// 🔥 GET META
// ===============================
const option = localStorage.getItem("currentOption");
const currentPage = localStorage.getItem("currentPage");

console.log("📊 RESULT:", percent);
console.log("🎯 OPTION:", option);
console.log("📄 PAGE:", currentPage);

// ===============================
// 🔥 SAVE TO FIREBASE
// ===============================
async function saveResult(user) {
  if (!user) {
    console.log("❌ USER NOT LOGGED IN");
    return;
  }

  if (!option || !currentPage) {
    console.log("❌ Missing option or page");
    return;
  }

  const ref = doc(db, "users", user.uid, "stats", currentPage);
  const key = "option" + option;

  try {
    const snap = await getDoc(ref);
    let existingData = snap.exists() ? snap.data() : {};

    console.log("📦 BEFORE:", existingData);

    const shouldSave =
      existingData[key] === undefined ||
      percent > existingData[key];

    if (shouldSave) {
      await setDoc(ref, {
        [key]: percent
      }, { merge: true });

      console.log("🔥 SAVED:", key, percent);
    } else {
      console.log("ℹ️ Existing score higher, skipped");
    }

  } catch (err) {
    console.error("❌ SAVE ERROR:", err);
  }
}

// ===============================
// 🔐 WAIT FOR AUTH
// ===============================
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("✅ Auth ready");
    saveResult(user);
  } else {
    console.log("⏳ Waiting for auth...");
  }
});

// ===============================
// 🎯 UI UPDATE
// ===============================
const circle = document.getElementById("circle");
circle.style.setProperty("--percent", percent + "%");

document.getElementById("percent").innerText = percent + "%";
document.getElementById("time").innerText = resultData.time + " sec";
document.getElementById("correct").innerText = resultData.score;
document.getElementById("wrong").innerText = resultData.total - resultData.score;

// ===============================
// 📋 ANSWER GRID
// ===============================
const grid = document.getElementById("grid");

resultData.answers.forEach((a, i) => {
  const btn = document.createElement("button");

  btn.innerText = i + 1;
  btn.className = a.isCorrect ? "correct-box" : "wrong-box";

  btn.onclick = () => {
    // ✅ SAVE REVIEW DATA
    localStorage.setItem("reviewQuestion", JSON.stringify(a));

    // ❗ IMPORTANT: DO NOT DELETE quizResults when going to review
    localStorage.setItem("fromReview", "true");

    window.location.href = "./review.html";
  };

  grid.appendChild(btn);
});

// ===============================
// 🧹 CLEAR DATA SAFELY
// ===============================
window.addEventListener("beforeunload", () => {
  const fromReview = localStorage.getItem("fromReview");

  // ❌ DO NOT DELETE if going to review page
  if (fromReview === "true") {
    localStorage.removeItem("fromReview");
    return;
  }

  // ✅ DELETE when leaving result page normally
  localStorage.removeItem("quizResults");
});