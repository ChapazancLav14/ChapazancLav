import { auth, db } from "../data.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { state } from "../quizState.js";
import { calculateResultPercent } from "../quizScoring.js";

export async function endQuiz() {
  try {
    const endTime = Date.now();
    const totalTime = Math.floor((endTime - state.startTime) / 1000);

    const currentPage = localStorage.getItem("currentPage");
    const currentOption = localStorage.getItem("currentOption");
    const user = auth.currentUser;
    const percent = calculateResultPercent();

    if (user && currentPage && currentOption) {
      const ref = doc(db, "users", user.uid, "stats", currentPage);

      try {
        const snap = await getDoc(ref);
        const prev = snap.exists()
          ? snap.data()["option" + currentOption] || 0
          : 0;

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
        console.error("🔥 Error saving stats:", err);
      }
    }

    if (currentPage) {
      localStorage.setItem("lastPage", currentPage);
    }

    let sessionCorrect = 0;

    state.userAnswers.forEach((q) => {
      if (!q || !q.attempts) return;

      if (q.attempts[0]?.isCorrect) {
        sessionCorrect++;
      }
    });

    const sessionPercent =
      state.filteredQuiz.length === 0
        ? 0
        : Math.round((sessionCorrect / state.filteredQuiz.length) * 100);

    localStorage.setItem(
      "quizResults",
      JSON.stringify({
        score: state.score,
        total: state.filteredQuiz.length,
        answers: state.userAnswers,
        time: totalTime,
        answered: state.answeredCount,
        percent: sessionPercent,
      })
    );
  } catch (err) {
    console.error("🔥 endQuiz error:", err);
  }

  window.location.href = "result.html";
}
