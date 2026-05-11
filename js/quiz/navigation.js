import { state } from "../quizState.js";
import { loadQuestion, updateQuestionNavButtons } from "./renderQuestion.js";
import { endQuiz } from "./endQuiz.js";

export function setupJumpInput() {
  const input = document.getElementById("jumpInput");
  const error = document.getElementById("jumpError");

  if (!input) return;

  input.min = 1;
  input.max = state.filteredQuiz.length;

  input.addEventListener("input", () => {
    error.innerText = "";
    input.classList.remove("input-error");

    if (input.value === "") return;

    const value = Number(input.value);

    if (value < 1) input.value = 1;
    if (value > state.filteredQuiz.length) input.value = state.filteredQuiz.length;
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      window.jumpToQuestion();
    }
  });

  document.addEventListener("click", (e) => {
    if (e.target !== input) {
      error.innerText = "";
      input.classList.remove("input-error");
    }
  });
}

export function installQuizNavigationHandlers() {
  window.nextQuestion = nextQuestion;
  window.previousQuestion = previousQuestion;
  window.skipQuestion = skipQuestion;
  window.jumpToQuestion = jumpToQuestion;
  window.goBack = goBack;
}

function nextQuestion() {
  const feedback = document.getElementById("feedback");

  feedback.classList.remove("show");
  document.body.classList.remove("feedback-open");
  feedback.style.transform = "translateY(100%)";

  state.currentQuestion++;

  updateProgress();

  if (state.currentQuestion < state.filteredQuiz.length) {
    setTimeout(() => {
      feedback.style.transform = "";
      loadQuestion();
    }, 200);
  } else {
    endQuiz();
  }
}

export function hideFeedbackPanel() {
  const feedback = document.getElementById("feedback");
  if (!feedback) return;

  feedback.classList.remove("show");
  feedback.classList.remove("correct-bg", "wrong-bg");
  feedback.style.transform = "";
  document.body.classList.remove("feedback-open");
}

function previousQuestion() {
  if (state.currentQuestion <= 0) return;

  hideFeedbackPanel();
  state.currentQuestion--;
  loadQuestion();
  updateProgress();
  updateQuestionNavButtons();
}

function skipQuestion() {
  hideFeedbackPanel();

  state.currentQuestion++;
  updateProgress();

  if (state.currentQuestion < state.filteredQuiz.length) {
    loadQuestion();
    updateQuestionNavButtons();
  } else {
    endQuiz();
  }
}

export function updateProgress() {
  const total = state.filteredQuiz.length;
  const current = Math.min(state.currentQuestion + 1, total);
  const percent = total ? (current / total) * 100 : 0;

  document.getElementById("progress-bar").style.width = percent + "%";
  document.getElementById("progress-text").innerText = current + "/" + total;
}

function goBack() {
  window.history.back();
}

function jumpToQuestion() {
  const input = document.getElementById("jumpInput");
  const error = document.getElementById("jumpError");

  error.innerText = "";
  input.classList.remove("input-error");

  if (!input.value) {
    error.innerText = "Please enter a question number";
    input.classList.add("input-error");
    return;
  }

  const value = Number(input.value);

  if (value < 1 || value > state.filteredQuiz.length) {
    error.innerText = `Enter 1 - ${state.filteredQuiz.length}`;
    input.classList.add("input-error");
    return;
  }

  hideFeedbackPanel();
  state.currentQuestion = value - 1;
  loadQuestion();
  updateProgress();
  updateQuestionNavButtons();
}
