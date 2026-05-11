// Home entry file.
// Home logic is split into smaller modules so future changes do not break unrelated code.
import { auth, db } from "./data.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { preloadQuestions, showHomeApp, updateCircle } from "./home/homeProgress.js";
import { setupDayModalClose, updateUserData } from "./home/homeCards.js";
import { setupHomeActions } from "./home/homeActions.js";

setupHomeActions();
setupDayModalClose();

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const emailEl = document.getElementById("userEmail");
  if (emailEl) {
    emailEl.textContent = user.email;
  }

  await preloadQuestions();

  const ref = doc(db, "users", user.uid);

  updateUserData(user);

  onSnapshot(ref, (snap) => {
    let answeredCorrectly = {};

    if (snap.exists()) {
      answeredCorrectly = snap.data().answeredCorrectly || {};
    }

    updateCircle(answeredCorrectly);
    showHomeApp();
  });
});
