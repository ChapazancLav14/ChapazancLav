// ===============================
// 📦 LOAD DATA
// ===============================
const data = JSON.parse(localStorage.getItem("reviewQuestion"));

if (!data) {
  document.body.innerHTML = "No question found";
  throw new Error("No data");
}

// ===============================
// 🔙 BACK BUTTON
// ===============================
window.goBack = function () {
  window.location.href = "result.html";
};

// ===============================
// ❓ QUESTION
// ===============================
document.getElementById("question").innerText =
  data.question.question;

const container = document.getElementById("answers");

// ===============================
// 🧠 STATUS (FINAL LOGIC)
// ===============================
function getQuestionStatus(qData) {
  if (!qData || !qData.attempts || qData.attempts.length === 0) {
    return "unanswered";
  }

  const hasCorrect = qData.attempts.some(a => a.isCorrect);
  const hasWrong = qData.attempts.some(a => !a.isCorrect);

  if (hasCorrect && hasWrong) return "partial"; // 🟠 ԹԵՐԻ
  if (hasCorrect) return "correct";             // ✅
  return "wrong";                               // ❌
}

const status = getQuestionStatus(data);

// ===============================
// 🧠 GROUP ATTEMPTS BY ANSWER
// ===============================
const grouped = {};

data.attempts.forEach((attempt, index) => {
  const key = attempt.selectedIndex;

  if (!grouped[key]) {
    grouped[key] = {
      tries: []
    };
  }

  grouped[key].tries.push(index + 1);
});

// ===============================
// 🎯 BUILD BLOCKS
// ===============================
const correctIndex = data.attempts[0].correctIndex;

// 👉 If NOT partial → still show 1 block
const keysToRender =
  status === "partial"
    ? Object.keys(grouped)
    : [data.attempts[data.attempts.length - 1].selectedIndex];

keysToRender.forEach((key) => {
  const selectedIndex = Number(key);
  const tries = grouped[key]?.tries || [1];

  const block = document.createElement("div");
  block.className = "review-block";

  // 🏷 title
  const title = document.createElement("div");
  title.className = "attempt-title";
  title.innerText = "Փորձ " + tries.join(",");
  block.appendChild(title);

  // 🔢 SHOW ALL 4 ANSWERS
  data.question.answers.forEach((ans, i) => {
    const div = document.createElement("div");
    div.className = "review-answer";
    div.innerText = ans.text;

    // ✅ correct answer
    if (i === correctIndex) {
      div.classList.add("review-correct");
    }

    // ❌ selected wrong
    if (i === selectedIndex && i !== correctIndex) {
      div.classList.add("review-wrong");
    }

    block.appendChild(div);
  });

  container.appendChild(block);
});