import { state } from "../quizState.js";
import { playAnswerSound } from "../quizAudio.js";
import { getDailyStatus, saveDailyQuestionStatus } from "../dailyStats.js";
import { saveCorrectAnswer, saveWrongAnswer, saveLiveProgress } from "../userProgress.js";

export async function checkAnswer(btn, index) {
  const all = document.querySelectorAll(".answer");
  all.forEach((b) => (b.disabled = true));

  const feedback = document.getElementById("feedback");
  const title = document.getElementById("feedback-title");
  const text = document.getElementById("feedback-text");

  const currentQ = state.filteredQuiz[state.currentQuestion];
  const correctIndex = currentQ.answers.findIndex((a) => a.correct);

  all.forEach((b, i) => {
    if (i === correctIndex) {
      b.classList.add("correct");
    } else if (i === index) {
      b.classList.add("wrong");
    }
  });

  const isCorrect = index === correctIndex;
  playAnswerSound(isCorrect);

  if (!state.userAnswers[state.currentQuestion]) {
    state.userAnswers[state.currentQuestion] = {
      question: currentQ,
      attempts: [],
    };
  }

  state.userAnswers[state.currentQuestion].attempts.push({
    selectedIndex: index,
    correctIndex,
    isCorrect,
  });

  const dailyStatus = getDailyStatus(state.userAnswers[state.currentQuestion]);
  await saveDailyQuestionStatus(currentQ.id, dailyStatus);

  if (isCorrect) {
    if (!state.answeredWrong[currentQ.id]) {
      saveCorrectAnswer(currentQ.id);
    }
  } else {
    await saveWrongAnswer(currentQ.id, {
      selectedIndex: index,
      correctIndex,
    });
  }

  if (isCorrect) {
    title.innerText = "✅ Correct";
    text.innerText = "";

    feedback.classList.add("correct-bg");
    feedback.classList.remove("wrong-bg");
  } else {
    title.innerText = "❌ Wrong";
    text.innerText = "";

    feedback.classList.add("wrong-bg");
    feedback.classList.remove("correct-bg");
  }

  btn.style.transform = "scale(0.97)";
  setTimeout(() => {
    btn.style.transform = "scale(1)";
  }, 120);

  state.answeredCount = state.userAnswers.filter((a) => a).length;
  feedback.classList.add("show");
  document.body.classList.add("feedback-open");

  saveLiveProgress();
}
