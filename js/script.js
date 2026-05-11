// Main quiz entry file.
// Feature logic is split into smaller modules so future changes do not break unrelated quiz code.
import { auth } from "./data.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { loadQuestions } from "./quizFlow.js";
import { loadUserProgress, loadPageBestPercent } from "./userProgress.js";
import { updateDayTrack } from "./dayTrack.js";
import "./calculator.js";

console.log("🚀 quiz entry loaded");

loadQuestions();

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  await loadUserProgress();
  updateDayTrack();
  loadPageBestPercent();
});
