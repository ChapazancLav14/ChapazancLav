import { state } from "./quizState.js";

export function getQuestionStatus(qData) {
  if (!qData || !qData.attempts) return "unanswered";

  const hasCorrect = qData.attempts.some((a) => a.isCorrect);
  const hasWrong = qData.attempts.some((a) => !a.isCorrect);

  if (hasCorrect && hasWrong) return "partial";
  if (hasCorrect) return "correct";
  return "wrong";
}

export function calculateResultPercent() {
  let correct = 0;

  state.userAnswers.forEach((q) => {
    if (!q || !q.attempts) return;

    // Only first attempt counts, same as result page.
    if (q.attempts[0]?.isCorrect) {
      correct++;
    }
  });

  return state.filteredQuiz.length === 0
    ? 0
    : Math.round((correct / state.filteredQuiz.length) * 100);
}
