import { state, resetQuizSession } from "./quizState.js";
import { parseCSV } from "./csvParser.js";
import { loadQuestion } from "./quiz/renderQuestion.js";
import {
  installQuizNavigationHandlers,
  setupJumpInput,
  updateProgress,
} from "./quiz/navigation.js";

installQuizNavigationHandlers();

export async function loadQuestions() {
  document.getElementById("feedback").classList.remove("show");
  document.body.classList.remove("feedback-open");

  const res = await fetch("data/questions.csv");
  const text = await res.text();

  state.quiz = parseCSV(text);

  const start = Number(localStorage.getItem("quizStart"));
  const end = Number(localStorage.getItem("quizEnd"));

  console.log("🔥 RANGE:", start, end);

  if (!isNaN(start) && !isNaN(end)) {
    state.filteredQuiz = state.quiz.filter((q) => q.id >= start && q.id <= end);
  } else {
    document.body.innerHTML = "❌ Missing quiz range";
    return;
  }

  if (state.filteredQuiz.length === 0) {
    document.body.innerHTML = `
        <button class="back-btn" onclick="goBack()">←</button>

        <div class="question-box">
          <h2>❌ No questions found yet</h2>
        </div>
      `;
    return;
  }

  setupJumpInput();
  resetQuizSession();
  loadQuestion();
  setTimeout(updateProgress, 0);
}
