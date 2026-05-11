import { auth, db } from "./data.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { state } from "./quizState.js";
import { calculateResultPercent } from "./quizScoring.js";

export async function loadUserProgress() {
  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    state.answeredCorrectly = snap.data().answeredCorrectly || {};
    state.answeredWrong = snap.data().answeredWrong || {};
  }
}

export async function saveCorrectAnswer(qId) {
  const user = auth.currentUser;
  if (!user) return;

  if (!state.answeredCorrectly[qId]) {
    state.answeredCorrectly[qId] = true;

    const ref = doc(db, "users", user.uid);

    await setDoc(
      ref,
      {
        answeredCorrectly: state.answeredCorrectly,
      },
      { merge: true }
    );
  }
}

export async function saveWrongAnswer(qId, wrongInfo = {}) {
  const user = auth.currentUser;
  if (!user) return;

  // Keep the existing all-time wrong-questions logic, but store
  // the last wrong answer selected so review can highlight it later.
  state.answeredWrong[qId] = {
    selectedIndex: Number.isInteger(wrongInfo.selectedIndex)
      ? wrongInfo.selectedIndex
      : null,
    correctIndex: Number.isInteger(wrongInfo.correctIndex)
      ? wrongInfo.correctIndex
      : null,
    updatedAt: Date.now(),
  };

  const ref = doc(db, "users", user.uid);

  await setDoc(
    ref,
    {
      answeredCorrectly: state.answeredCorrectly,
      answeredWrong: state.answeredWrong,
    },
    { merge: true }
  );
}

export async function saveLiveProgress() {
  const user = auth.currentUser;
  if (!user) return;

  const currentPage = localStorage.getItem("currentPage");
  const currentOption = localStorage.getItem("currentOption");

  if (!currentPage || !currentOption) return;

  const percent = calculateResultPercent();
  const ref = doc(db, "users", user.uid, "stats", currentPage);

  try {
    const snap = await getDoc(ref);
    const prev = snap.exists() ? snap.data()["option" + currentOption] || 0 : 0;

    if (percent > prev) {
      await setDoc(
        ref,
        {
          ["option" + currentOption]: percent,
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.error("🔥 Live save error:", err);
  }
}

export async function loadPageBestPercent() {
  const user = auth.currentUser;
  if (!user) return;

  const currentPage = localStorage.getItem("currentPage");
  const currentOption = localStorage.getItem("currentOption");

  if (!currentPage || !currentOption) return;

  const ref = doc(db, "users", user.uid, "stats", currentPage);

  try {
    const snap = await getDoc(ref);
    let best = 0;

    if (snap.exists()) {
      best = snap.data()["option" + currentOption] || 0;
    }

    const el = document.getElementById("page-best");
    if (el) {
      el.innerText = best + "%";
    }
  } catch (err) {
    console.error("🔥 Load page % error:", err);
  }
}
