import { auth, db } from "../data.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

export function setupHomeActions() {
  window.resetProgress = resetProgress;
  window.logout = logout;
}

async function resetProgress() {
  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "users", user.uid);

  await setDoc(
    ref,
    {
      answeredCorrectly: {},
      answeredWrong: {},
    },
    { merge: true },
  );

  location.reload();
}

function logout() {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
}
