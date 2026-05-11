import { auth, db } from "./data.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

function calculateStreak(activeDays) {
  if (!Array.isArray(activeDays) || activeDays.length === 0) return 0;

  const activeSet = new Set(activeDays);
  const cursor = new Date();
  let streak = 0;

  while (true) {
    const dateStr =
      cursor.getFullYear() +
      "-" +
      String(cursor.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(cursor.getDate()).padStart(2, "0");

    if (!activeSet.has(dateStr)) break;

    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export async function updateDayTrack() {
  const today = new Date();

  const todayStr =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0");

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "users", user.uid);

  let activeDays = [];

  try {
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : {};

    activeDays = data.activeDays || [];

    if (!activeDays.includes(todayStr)) {
      activeDays.push(todayStr);

      await setDoc(
        ref,
        {
          activeDays: activeDays,
          lastActiveDate: todayStr,
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.error("🔥 DayTrack Firestore error:", err);
    return;
  }

  const streak = calculateStreak(activeDays);

  const streakEl = document.getElementById("streak");
  if (streakEl) {
    streakEl.innerText = "🔥 Day " + streak;
  }

  const monthLabel = document.getElementById("month-label");
  const container = document.getElementById("day-boxes");

  if (!monthLabel || !container) return;

  monthLabel.innerText = monthNames[currentMonth];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  container.innerHTML = "";

  for (let i = 1; i <= daysInMonth; i++) {
    const box = document.createElement("div");
    box.className = "day-box";
    box.innerText = i;

    const dateStr =
      currentYear +
      "-" +
      String(currentMonth + 1).padStart(2, "0") +
      "-" +
      String(i).padStart(2, "0");

    if (activeDays.includes(dateStr)) {
      box.classList.add("active");
    }

    container.appendChild(box);
  }
}
