import { auth, db } from "./data.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

function getTodayString() {
  const d = new Date();

  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

export function getDailyStatus(qData) {
  if (!qData || !qData.attempts || qData.attempts.length === 0) {
    return "wrong";
  }

  const hasCorrect = qData.attempts.some((a) => a.isCorrect);
  const hasWrong = qData.attempts.some((a) => !a.isCorrect);

  if (hasCorrect && hasWrong) return "partial";
  if (hasCorrect) return "correct";
  return "wrong";
}

function mergeDailyStatus(oldStatus, newStatus) {
  if (!oldStatus) return newStatus;

  if (oldStatus === "partial") return "partial";

  if (
    (oldStatus === "wrong" && newStatus === "correct") ||
    (oldStatus === "correct" && newStatus === "wrong") ||
    newStatus === "partial"
  ) {
    return "partial";
  }

  return oldStatus;
}

export async function saveDailyQuestionStatus(questionId, newStatus) {
  const user = auth.currentUser;
  if (!user) return;

  const today = getTodayString();
  const ref = doc(db, "users", user.uid, "dailyStats", today);

  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};

  const questionIds = data.questionIds || {};
  const oldStatus = questionIds[questionId];

  const finalStatus = mergeDailyStatus(oldStatus, newStatus);

  questionIds[questionId] = finalStatus;

  const values = Object.values(questionIds);

  await setDoc(
    ref,
    {
      total: values.length,
      correct: values.filter((v) => v === "correct").length,
      wrong: values.filter((v) => v === "wrong").length,
      partial: values.filter((v) => v === "partial").length,
      questionIds,
    },
    { merge: true }
  );
}
