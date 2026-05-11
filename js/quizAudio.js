const answerSounds = {
  correct: new Audio(new URL("../sounds/right_answer.mp3", import.meta.url)),
  wrong: new Audio(new URL("../sounds/wrong_answer.mp3", import.meta.url)),
};

export function playAnswerSound(isCorrect) {
  const sound = isCorrect ? answerSounds.correct : answerSounds.wrong;

  sound.currentTime = 0;
  sound.play().catch(() => {
    // Browser blocked audio or file missing; don't break the quiz.
  });
}
