//home.js
import { auth, db } from "./data.js";

import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

let questionsCache = [];
let currentViewDate = new Date();
let latestActiveDays = [];

// ===============================
// LOAD QUESTIONS
// ===============================
async function preloadQuestions() {
  const res = await fetch("data/questions.csv");
  const text = await res.text();

  questionsCache = parseCSV(text);
}

// ===============================
// DATE HELPERS
// ===============================
function getLocalDateString(date = new Date()) {
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}

function getMonthKey(date) {
  return date.getFullYear() + "-" + date.getMonth();
}

// ===============================
// STREAK
// ===============================
function calculateStreak(activeDays) {
  if (!activeDays.length) return 0;

  const sorted = [...activeDays].sort();

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

    const todayStr = getLocalDateString();

    let activeDays = data.activeDays || [];
    let lastDate = data.lastActiveDate || null;

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
      await setDoc(
        ref,
        {
          activeDays,
          lastActiveDate: lastDate,
        },
        { merge: true },
      );
    }

    latestActiveDays = activeDays;

    const realStreak = calculateStreak(activeDays);

    renderMonthBoxes(activeDays);
    updateStreakText(realStreak);
    setupMonthNavigation(activeDays);
  });
}

// ===============================
// MONTH NAVIGATION
// ===============================
function setupMonthNavigation(activeDays) {
  const prevBtn = document.getElementById("prevMonth");
  const nextBtn = document.getElementById("nextMonth");

  if (!prevBtn || !nextBtn) return;

  const monthsWithData = [
    ...new Set(
      activeDays.map((d) => {
        const date = new Date(d);
        return getMonthKey(date);
      }),
    ),
  ];

  function findMonthWithData(direction) {
    let temp = new Date(currentViewDate);

    for (let i = 0; i < 120; i++) {
      temp.setMonth(temp.getMonth() + direction);

      if (monthsWithData.includes(getMonthKey(temp))) {
        return new Date(temp);
      }
    }

    return null;
  }

  function updateButtons() {
    prevBtn.disabled = !findMonthWithData(-1);
    nextBtn.disabled = !findMonthWithData(1);
  }

  prevBtn.onclick = () => {
    currentViewDate.setMonth(currentViewDate.getMonth() - 1);

    renderMonthBoxes(latestActiveDays);
    updateButtons();
  };

  nextBtn.onclick = () => {
    currentViewDate.setMonth(currentViewDate.getMonth() + 1);

    renderMonthBoxes(latestActiveDays);
    updateButtons();
  };

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
  const monthLabel = document.getElementById("month-label");

  if (!container || !monthLabel) return;

  container.innerHTML = "";

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  weekDays.forEach((day) => {
    const label = document.createElement("div");
    label.innerText = day;
    container.appendChild(label);
  });

  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  for (let i = 0; i < startOffset; i++) {
    container.appendChild(document.createElement("div"));
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const box = document.createElement("div");
    box.className = "day-box";
    box.innerText = i;

    const dateStr =
      year +
      "-" +
      String(month + 1).padStart(2, "0") +
      "-" +
      String(i).padStart(2, "0");

    if (activeDays.includes(dateStr)) {
      box.classList.add("active");

      box.onclick = () => {
        openDayModal(dateStr);
      };
    }

    container.appendChild(box);
  }

  const monthName = currentViewDate.toLocaleString("en-US", {
    month: "long",
  });

  monthLabel.innerText = monthName + " " + year;
}

// ===============================
// DAILY STATS MODAL
// ===============================
window.openDayModal = async function (dateStr) {
  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "users", user.uid, "dailyStats", dateStr);
  const snap = await getDoc(ref);

  const data = snap.exists() ? snap.data() : {};

  document.getElementById("dayModalTitle").innerText = dateStr;
  document.getElementById("dayTotal").innerText = data.total || 0;
  document.getElementById("dayCorrect").innerText = data.correct || 0;
  document.getElementById("dayWrong").innerText = data.wrong || 0;
  document.getElementById("dayPartial").innerText = data.partial || 0;

  document.getElementById("dayModal").classList.remove("hidden");
};

window.closeDayModal = function () {
  document.getElementById("dayModal").classList.add("hidden");
};

document.getElementById("dayModal")?.addEventListener("click", (e) => {
  if (e.target.id === "dayModal") {
    closeDayModal();
  }
});

// ===============================
// STREAK UI
// ===============================
function updateStreakText(streak) {
  const el = document.getElementById("streak-inline");

  if (el) {
    el.innerText = "🔥 Day " + streak;
  }
}

// ===============================
// OVERALL PROGRESS CIRCLE
// ===============================
function updateCircle(answeredCorrectly) {
  const total = questionsCache.length;
  if (!total) return;

  const validIds = new Set(questionsCache.map((q) => q.id));

  const correctCount = Object.keys(answeredCorrectly).filter((id) =>
    validIds.has(Number(id)),
  ).length;

  const percent = Math.round((correctCount / total) * 100);

  const circle = document.getElementById("progress-circle");
  const text = document.getElementById("progress-text");

  if (!circle || !text) return;

  circle.style.background = `conic-gradient(
    var(--green-light) ${percent}%,
    #ddd ${percent}%
  )`;

  text.innerText = percent + "%";
}

// ===============================
// AUTH
// ===============================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // load everything FIRST
  await preloadQuestions();

  const ref = doc(db, "users", user.uid);

  updateUserData(user);

  onSnapshot(ref, (snap) => {
    let answeredCorrectly = {};

    if (snap.exists()) {
      answeredCorrectly = snap.data().answeredCorrectly || {};
    }

    updateCircle(answeredCorrectly);

    // ✅ SHOW UI ONLY AFTER DATA ARRIVES
    showHomeApp();
  });
});

// ===============================
// RESET PROGRESS
// ===============================
window.resetProgress = async function () {
  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "users", user.uid);

  await setDoc(
    ref,
    {
      answeredCorrectly: {},
      answeredWrong: {},
    },
    { merge: true },
  );

  location.reload();
};

// ===============================
// LOGOUT
// ===============================
window.logout = function () {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
};

// ===============================
// CSV HELPERS
// ===============================
function fixText(text) {
  if (!text) return text;

  return text
    .replace(/ш/g, "ա")
    .replace(/Ш/g, "ա")
    .replace(/р/g, "բ")
    .replace(/Р/g, "բ")
    .replace(/q/g, "գ")
    .replace(/Q/g, "գ")
    .replace(/η/g, "դ")
    .replace(/\bv\b/g, "ν");
}

function parseCSV(text) {
  const lines = text.trim().split("\n");

  return lines.slice(1).map((line) => {
    const [id, question, a, b, c, d, correct, image] = line.split(";");

    return {
      id: Number(id),
      question: fixText(question?.trim()),
      image: image?.trim() || "",
      answers: [
        { text: fixText(a?.trim()), correct: correct == 1 },
        { text: fixText(b?.trim()), correct: correct == 2 },
        { text: fixText(c?.trim()), correct: correct == 3 },
        { text: fixText(d?.trim()), correct: correct == 4 },
      ],
    };
  });
}

function showHomeApp() {
  document.getElementById("homeLoader")?.classList.add("hidden");
  document.getElementById("homeApp")?.classList.remove("hidden");
}
