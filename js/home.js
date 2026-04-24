//home.js
import { auth, db } from "./data.js";
import { onAuthStateChanged, signOut } 
from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { doc, setDoc, onSnapshot } 
from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

let questionsCache = [];
let currentViewDate = new Date();

// ===============================
// LOAD QUESTIONS
// ===============================
async function preloadQuestions() {
  const res = await fetch("data/questions.csv");
  const text = await res.text();

  questionsCache = parseCSV(text);
}

// ===============================
// STREAK
// ===============================
function calculateStreak(activeDays) {
  if (!activeDays.length) return 0;

  const sorted = [...activeDays].sort();

  // ✅ normalize today to midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;

  for (let i = sorted.length - 1; i >= 0; i--) {
    const d = new Date(sorted[i]);
    d.setHours(0, 0, 0, 0);

    const diff = Math.floor((today - d) / (1000 * 60 * 60 * 24));

    if (diff === streak) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ===============================
// USER DATA
// ===============================
function updateUserData(user) {
  const ref = doc(db, "users", user.uid);

  onSnapshot(ref, async (snap) => {
    let data = snap.exists() ? snap.data() : {};

    const now = new Date();
const todayStr =
  now.getFullYear() + "-" +
  String(now.getMonth() + 1).padStart(2, "0") + "-" +
  String(now.getDate()).padStart(2, "0");

    let lastDate = data.lastActiveDate || null;
    let activeDays = data.activeDays || [];

    let shouldUpdate = false;

    if (!activeDays.includes(todayStr)) {
      activeDays.push(todayStr);
      shouldUpdate = true;
    }

    if (lastDate !== todayStr) {
      lastDate = todayStr;
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      await setDoc(ref, {
        lastActiveDate: lastDate,
        activeDays: activeDays
      }, { merge: true });
      
    }

    const realStreak = calculateStreak(activeDays);

    renderMonthBoxes(activeDays);
    updateStreakText(realStreak);
    setupMonthNavigation(activeDays);
  });
}

// ===============================
// 🔥 FIXED NAVIGATION (SKIPS EMPTY MONTHS)
// ===============================
function setupMonthNavigation(activeDays) {
  const prevBtn = document.getElementById("prevMonth");
  const nextBtn = document.getElementById("nextMonth");

  const monthsWithData = activeDays.map(d => {
    const date = new Date(d);
    return date.getFullYear() + "-" + date.getMonth();
  });

  function hasAnyDataInDirection(direction) {
    let temp = new Date(currentViewDate);

    for (let i = 0; i < 12; i++) {
      temp.setMonth(temp.getMonth() + direction);

      const key =
        temp.getFullYear() + "-" + temp.getMonth();

      if (monthsWithData.includes(key)) {
        return true;
      }
    }

    return false;
  }

  // 🔥 NORMAL STEP (no skipping)
  prevBtn.onclick = () => {
    currentViewDate.setMonth(currentViewDate.getMonth() - 1);
    renderMonthBoxes(activeDays);
    updateButtons();
  };

  nextBtn.onclick = () => {
    currentViewDate.setMonth(currentViewDate.getMonth() + 1);
    renderMonthBoxes(activeDays);
    updateButtons();
  };

  function updateButtons() {
    prevBtn.disabled = !hasAnyDataInDirection(-1);
    nextBtn.disabled = !hasAnyDataInDirection(1);

    prevBtn.style.opacity = prevBtn.disabled ? "0.3" : "1";
    nextBtn.style.opacity = nextBtn.disabled ? "0.3" : "1";
  }

  updateButtons();
}

// ===============================
// CALENDAR
// ===============================
function renderMonthBoxes(activeDays) {
  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const container = document.getElementById("day-boxes");
  container.innerHTML = "";
  container.className = "calendar-grid";

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  weekDays.forEach(day => {
    const label = document.createElement("div");
    label.innerText = day;
    label.style.fontWeight = "bold";
    container.appendChild(label);
  });

  let startOffset = firstDay === 0 ? 6 : firstDay - 1;

  for (let i = 0; i < startOffset; i++) {
    container.appendChild(document.createElement("div"));
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const box = document.createElement("div");
    box.className = "day-box";
    box.innerText = i;

    const dateStr =
      year + "-" +
      String(month + 1).padStart(2, "0") + "-" +
      String(i).padStart(2, "0");

    if (activeDays.includes(dateStr)) {
      box.classList.add("active");
    }

    container.appendChild(box);
  }

  const monthName = currentViewDate.toLocaleString("en-US", { month: "long" });
  document.getElementById("month-label").innerText = monthName + " " + year;

  // ❌ COMPLETELY REMOVED DAY TRACK
}

// ===============================
function updateStreakText(streak) {
  document.getElementById("streak-inline").innerText =
    '🔥' + "Day " + streak;
}

// ===============================
function updateCircle(answeredCorrectly, answeredWrong = {}) {
  const total = questionsCache.length;
  if (!total) return;

  const validIds = new Set(questionsCache.map(q => q.id));

const correctCount = Object.keys(answeredCorrectly)
  .filter(id => validIds.has(Number(id)))
  .length;

const percent = Math.round((correctCount / total) * 100);

  const circle = document.getElementById("progress-circle");

  circle.style.background =
    `conic-gradient(#0f6d4d ${percent}%, #ddd ${percent}%)`;

  document.getElementById("progress-text").innerText =
    percent + "%";
}

// ===============================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  await preloadQuestions();

  const ref = doc(db, "users", user.uid);

  updateUserData(user);

onSnapshot(ref, (snap) => {
  let answeredCorrectly = {};
  let answeredWrong = {};

  if (snap.exists()) {
    answeredCorrectly = snap.data().answeredCorrectly || {};
    answeredWrong = snap.data().answeredWrong || {};
  }

  updateCircle(answeredCorrectly, answeredWrong);
});

}); // ✅ THIS WAS MISSING

// ===============================
window.resetProgress = async function () {
  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "users", user.uid);

  await setDoc(ref, {
    answeredCorrectly: {},
    answeredWrong: {}
  }, { merge: true });

  // ✅ FORCE CLEAN STATE
  location.reload();
};

// ===============================
window.logout = function () {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
};

function fixText(text) {
  if (!text) return text;

  return text
    .replace(/ш/g, "ա")
    .replace(/Ш/g, "ա")
    .replace(/р/g, "բ")
    .replace(/Р/g, "բ")
    .replace(/q/g, "գ")
    .replace(/Q/g, "գ")
    .replace(/η/g, "դ");
}

function parseCSV(text) {
  const lines = text.trim().split("\n");

  return lines.slice(1).map(line => {
    const [id, question, a, b, c, d, correct, image] = line.split(";");

    return {
      id: Number(id),
      ...(image ? { image: image.trim() } : {}),
      question: fixText(question.trim()),
      answers: [
        { text: fixText(a.trim()), correct: correct == 1 },
        { text: fixText(b.trim()), correct: correct == 2 },
        { text: fixText(c.trim()), correct: correct == 3 },
        { text: fixText(d.trim()), correct: correct == 4 }
      ]
    };
  });
}