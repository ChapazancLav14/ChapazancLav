export const state = {
  quiz: [],
  filteredQuiz: [],
  currentQuestion: 0,
  score: 0,
  answeredCount: 0,
  userAnswers: [],
  startTime: Date.now(),
  answeredCorrectly: {},
  answeredWrong: {},
};

export function resetQuizSession() {
  state.currentQuestion = 0;
  state.score = 0;
  state.answeredCount = 0;
  state.userAnswers = [];
  state.startTime = Date.now();
}
