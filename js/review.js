//review.js
const data = JSON.parse(localStorage.getItem("reviewQuestion"));

if (!data) {
  document.body.innerHTML = "No question found";
  throw new Error("No data");
}

// 🔙 BACK BUTTON
// 🔙 BACK BUTTON (GO BACK TO RESULT)
window.goBack = function () {
  window.location.href = "result.html";
};

// QUESTION
document.getElementById("question").innerText = data.question.question;

// ANSWERS
const container = document.getElementById("answers");

data.question.answers.forEach((ans, i) => {
  const div = document.createElement("div");
  div.className = "review-answer";
  div.innerText = ans.text;

  // ✅ correct
  if (i === data.correctIndex) {
    div.classList.add("review-correct");
  }

  // ❌ wrong selected
  if (i === data.selectedIndex && !data.isCorrect) {
    div.classList.add("review-wrong");
  }

  container.appendChild(div);
});