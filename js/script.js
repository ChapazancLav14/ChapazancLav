  //script.js
  import { auth, db } from "./data.js";
  import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
  import {
    doc,
    getDoc,
    setDoc,
  } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

  console.log("🚀 script loaded");

  // ===============================
  // QUIZ DATA
  // ===============================
  let quiz = [];
  let filteredQuiz = [];
  let currentQuestion = 0;
  let score = 0;
  let answeredCount = 0;

  // RESULT DATA
  let userAnswers = [];
  let startTime = Date.now();

  // USER DATA
  let answeredCorrectly = {};
  let answeredWrong = {};

  // ===============================
  // 🔥 LOAD
  // ===============================
  loadQuestions();

  // ===============================
  // 🔐 AUTH
  // ===============================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await loadUserProgress();

    updateDayTrack();

    // ✅ ADD THIS
    loadPageBestPercent();
  }
});

  // ===============================
  // 🔥 DAY TRACK (BOX VERSION)
  // ===============================
async function updateDayTrack() {
  const today = new Date();

  // ✅ LOCAL DATE (no timezone bugs)
  const todayStr =
    today.getFullYear() + "-" +
    String(today.getMonth() + 1).padStart(2, "0") + "-" +
    String(today.getDate()).padStart(2, "0");

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "users", user.uid);

  let activeDays = [];

  try {
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : {};

    activeDays = data.activeDays || [];

    // ✅ ADD TODAY IF NOT EXISTS
    if (!activeDays.includes(todayStr)) {
      activeDays.push(todayStr);

      await setDoc(ref, {
        activeDays: activeDays,
        lastActiveDate: todayStr
      }, { merge: true });
    }

  } catch (err) {
    console.error("🔥 DayTrack Firestore error:", err);
    return;
  }

  // ===============================
  // 🔥 CALCULATE STREAK (FROM FIRESTORE)
  // ===============================
  const streak = calculateStreak(activeDays);

  const streakEl = document.getElementById("streak");
  if (streakEl) {
    streakEl.innerText = "🔥 Day " + streak;
  }

  // ===============================
  // 🔥 UI (calendar)
  // ===============================
  const monthLabel = document.getElementById("month-label");
  const container = document.getElementById("day-boxes");

  if (!monthLabel || !container) return;

  monthLabel.innerText = monthNames[currentMonth];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  container.innerHTML = "";

  for (let i = 1; i <= daysInMonth; i++) {
    const box = document.createElement("div");
    box.className = "day-box";
    box.innerText = i;

    const dateStr =
      currentYear + "-" +
      String(currentMonth + 1).padStart(2, "0") + "-" +
      String(i).padStart(2, "0");

    if (activeDays.includes(dateStr)) {
      box.classList.add("active");
    }

    container.appendChild(box);
  }
}

  // ===============================
  // LOAD USER PROGRESS
  // ===============================
  async function loadUserProgress() {
    const user = auth.currentUser;
    if (!user) return;

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      answeredCorrectly = snap.data().answeredCorrectly || {};
      answeredWrong = snap.data().answeredWrong || {};
    }
  }

  // ===============================
  // SAVE CORRECT ANSWER
  // ===============================
  async function saveCorrectAnswer(qId) {
    const user = auth.currentUser;
    if (!user) return;

    if (!answeredCorrectly[qId]) {
      answeredCorrectly[qId] = true;

      const ref = doc(db, "users", user.uid);

  await setDoc(
    ref,
    {
      answeredCorrectly: answeredCorrectly,
    },
    { merge: true },
  );
    }
  }

  // ===============================
  // 📚 LOAD QUESTIONS
  // ===============================
  async function loadQuestions() {
    const res = await fetch("data/questions.csv");
    const text = await res.text();

    quiz = parseCSV(text);

    const start = Number(localStorage.getItem("quizStart"));
    const end = Number(localStorage.getItem("quizEnd"));

    console.log("🔥 RANGE:", start, end);

    if (!isNaN(start) && !isNaN(end)) {
      filteredQuiz = quiz.filter((q) => q.id >= start && q.id <= end);
    } else {
      document.body.innerHTML = "❌ Missing quiz range";
      return;
    }

    if (filteredQuiz.length === 0) {
      document.body.innerHTML = `
        <button class="back-btn" onclick="goBack()">←</button>

        <div class="question-box">
          <h2>❌ No questions found yet</h2>
        </div>
      `;
      return;
    }

    const input = document.getElementById("jumpInput");
    const error = document.getElementById("jumpError");

    if (input) {
      input.min = 1;
      input.max = filteredQuiz.length;

      // ✅ clear error when typing
      input.addEventListener("input", () => {
        error.innerText = "";
        input.classList.remove("input-error");

        if (input.value === "") return;

        let value = Number(input.value);

        if (value < 1) input.value = 1;
        if (value > filteredQuiz.length) input.value = filteredQuiz.length;
      });

      // ✅ press Enter = Go
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          window.jumpToQuestion();
        }
      });

      // ✅ clear error when clicking outside
      document.addEventListener("click", (e) => {
        if (e.target !== input) {
          error.innerText = "";
          input.classList.remove("input-error");
        }
      });
    }

    // 🔥 reset quiz state
    currentQuestion = 0;
    score = 0;
    answeredCount = 0;
    userAnswers = [];
    startTime = Date.now();

    // 🔥 initial load
    loadQuestion();
    updateProgress();
  }

  // ===============================
  // 🔥 LOAD QUESTION
  // ===============================
  function loadQuestion() {
    const input = document.getElementById("jumpInput");
    if (input) {
      input.value = "";
      input.placeholder = `1 - ${filteredQuiz.length}`;
    }
    const q = filteredQuiz[currentQuestion];

    if (!q) {
      endQuiz();
      return;
    }

    document.getElementById("question").innerText = q.question;

    const imageContainer = document.getElementById("image-container");
    imageContainer.innerHTML = "";

    if (q.image) {
      const img = document.createElement("img");
      img.src = q.image;
      img.className = "question-image";
      imageContainer.appendChild(img);
    }

    const answersDiv = document.getElementById("answers");
    answersDiv.innerHTML = "";

    if (q.answers.length === 4) {
      answersDiv.style.gridAutoFlow = "column";
      answersDiv.style.gridTemplateRows = "repeat(2, auto)";
    } else {
      answersDiv.style.gridAutoFlow = "row";
    }

    q.answers.forEach((ans, index) => {
      const btn = document.createElement("button");
      btn.className = "answer";
      btn.innerText = index + 1 + ". " + ans.text;

      btn.onclick = () => checkAnswer(btn, index);

      answersDiv.appendChild(btn);
    });
  }

  // ===============================
  // CHECK ANSWER
  // ===============================
  async function checkAnswer(btn, index) {
    const all = document.querySelectorAll(".answer");
    all.forEach((b) => (b.disabled = true));

    const feedback = document.getElementById("feedback");
    const title = document.getElementById("feedback-title");
    const text = document.getElementById("feedback-text");

    const currentQ = filteredQuiz[currentQuestion];
    const correctIndex = currentQ.answers.findIndex((a) => a.correct);

   all.forEach((b, i) => {
  if (i === correctIndex) {
    b.classList.add("correct");
  } else if (i === index) {
    b.classList.add("wrong"); // 🔥 THIS WAS MISSING
  }
});

    const isCorrect = index === correctIndex;

    if (!userAnswers[currentQuestion]) {
      userAnswers[currentQuestion] = {
        question: currentQ,
        attempts: [],
      };
    }

    userAnswers[currentQuestion].attempts.push({
      selectedIndex: index,
      correctIndex,
      isCorrect,
    });

  if (isCorrect) {
    // ✅ ONLY save if NEVER wrong before
    if (!answeredWrong[currentQ.id]) {
      saveCorrectAnswer(currentQ.id);
    }
  } else {
    // ❌ mark as wrong forever
    answeredWrong[currentQ.id] = true;

    // 🔥 update DB immediately
    const user = auth.currentUser;
    if (user) {
      const ref = doc(db, "users", user.uid);

      await setDoc(ref, {
    answeredCorrectly: answeredCorrectly,
    answeredWrong: answeredWrong // ✅ ADD THIS
  }, { merge: true });
    }
  }
if (isCorrect) {
  title.innerText = "✅ Correct";
  text.innerText = "";

  feedback.classList.add("correct-bg");
  feedback.classList.remove("wrong-bg");
} else {
  title.innerText = "❌ Wrong";
  text.innerText = "";

  feedback.classList.add("wrong-bg");
  feedback.classList.remove("correct-bg");
}

    answeredCount = userAnswers.filter((a) => a).length;
    feedback.classList.add("show");

    saveLiveProgress();
  }

  // ===============================
  window.nextQuestion = function () {
    document.getElementById("feedback").classList.remove("show");

    currentQuestion++;

    // 🔥 UPDATE HERE (right after moving)
    updateProgress();

    if (currentQuestion < filteredQuiz.length) {
      setTimeout(loadQuestion, 300);
    } else {
      endQuiz();
    }
  };
  saveLiveProgress();

  // ===============================
  async function endQuiz() {
    try{
    const endTime = Date.now();
    const totalTime = Math.floor((endTime - startTime) / 1000);

    const currentPage = localStorage.getItem("currentPage");
    const currentOption = localStorage.getItem("currentOption");

    const user = auth.currentUser;

const percent = calculateResultPercent();


    // ===============================
    // 🔥 SAVE PAGE PROGRESS (circles)
    // ===============================
    if (user && currentPage && currentOption) {
      const ref = doc(db, "users", user.uid, "stats", currentPage);

      try {
        const snap = await getDoc(ref);
        let prev = snap.exists() ? snap.data()["option" + currentOption] || 0 : 0;

        if (percent > prev) {
          await setDoc(
            ref,
            {
              ["option" + currentOption]: percent,
            },
            { merge: true },
          );
        }
      } catch (err) {
        console.error("🔥 Error saving stats:", err);
      }
    }

    // ===============================
    // SAVE RESULT
    // ===============================
    if (currentPage) {
      localStorage.setItem("lastPage", currentPage);
    }

  let sessionCorrect = 0;

  userAnswers.forEach((q) => {
    if (!q || !q.attempts) return;

    // ✅ ONLY count if FIRST attempt is correct
    if (q.attempts[0]?.isCorrect) {
      sessionCorrect++;
    }
  });

  const sessionPercent = filteredQuiz.length === 0
    ? 0
    : Math.round((sessionCorrect / filteredQuiz.length) * 100);

  localStorage.setItem(
    "quizResults",
    JSON.stringify({
      score,
      total: filteredQuiz.length,
      answers: userAnswers,
      time: totalTime,
      answered: answeredCount,
      percent: sessionPercent // ✅ ADD THIS LINE
    }),
  );

    }
    catch (err) {
      console.error("🔥 endQuiz error:", err);
    }
    window.location.href = "result.html";

  }

async function saveLiveProgress() {
  const user = auth.currentUser;
  if (!user) return;

  const currentPage = localStorage.getItem("currentPage");
  const currentOption = localStorage.getItem("currentOption");

  if (!currentPage || !currentOption) return;

  // ✅ SAME AS RESULT PAGE
  const percent = calculateResultPercent();

  const ref = doc(db, "users", user.uid, "stats", currentPage);

  try {
    const snap = await getDoc(ref);
    let prev = snap.exists()
      ? snap.data()["option" + currentOption] || 0
      : 0;

    // ✅ ONLY SAVE IF BETTER
    if (percent > prev) {
      await setDoc(
        ref,
        {
          ["option" + currentOption]: percent,
        },
        { merge: true }
      );
    }

  } catch (err) {
    console.error("🔥 Live save error:", err);
  }
}

  // ===============================
  function updateProgress() {
    const total = filteredQuiz.length;

    // 🔥 show current question (starts from 1)
    const current = Math.min(currentQuestion + 1, total);

    const percent = total ? (current / total) * 100 : 0;

    document.getElementById("progress-bar").style.width = percent + "%";
    document.getElementById("progress-text").innerText = current + "/" + total;
  }

  // ===============================
  window.goBack = function () {
    window.history.back();
  };

  function fixText(text) {
    if (!text) return text;

    return text
      .replace(/ш/g, "ա")
      .replace(/р/g, "բ")
      .replace(/q/g, "գ")
      .replace(/η/g, "դ");
  }

  function parseCSV(text) {
    const lines = text.trim().split("\n");

    return lines.slice(1).map((line) => {
      const [id, question, a, b, c, d, correct, image] = line.split(";");

      return {
        id: Number(id),
        ...(image ? { image: image.trim() } : {}),
        question: fixText(question.trim()),
        answers: [
          { text: fixText(a.trim()), correct: correct == 1 },
          { text: fixText(b.trim()), correct: correct == 2 },
          { text: fixText(c.trim()), correct: correct == 3 },
          { text: fixText(d.trim()), correct: correct == 4 },
        ],
      };
    });
  }

  window.jumpToQuestion = function () {
    const input = document.getElementById("jumpInput");
    const error = document.getElementById("jumpError");

    error.innerText = "";
    input.classList.remove("input-error");

    if (!input.value) {
      error.innerText = "Please enter a question number";
      input.classList.add("input-error");
      return;
    }

    let value = Number(input.value);

    if (value < 1 || value > filteredQuiz.length) {
      error.innerText = `Enter 1 - ${filteredQuiz.length}`;
      input.classList.add("input-error");
      return;
    }

    // ✅ SET QUESTION
    currentQuestion = value - 1;

    // ✅ LOAD IT
    loadQuestion();

    // 🔥 THIS IS WHAT YOU WERE MISSING
    updateProgress();
  };

  function getQuestionStatus(qData) {
    if (!qData || !qData.attempts) return "unanswered";

    const hasCorrect = qData.attempts.some((a) => a.isCorrect);
    const hasWrong = qData.attempts.some((a) => !a.isCorrect);

    if (hasCorrect && hasWrong) return "partial"; // 🔥 Թերի
    if (hasCorrect) return "correct";
    return "wrong";
  }

  async function loadPageBestPercent() {
  const user = auth.currentUser;
  if (!user) return;

  const currentPage = localStorage.getItem("currentPage");
  const currentOption = localStorage.getItem("currentOption");

  if (!currentPage || !currentOption) return;

  const ref = doc(db, "users", user.uid, "stats", currentPage);

  try {
    const snap = await getDoc(ref);

    let best = 0;

    if (snap.exists()) {
      best = snap.data()["option" + currentOption] || 0;
    }

    // 🔥 DISPLAY IT
    const el = document.getElementById("page-best");
    if (el) {
      el.innerText = best + "%";
    }

  } catch (err) {
    console.error("🔥 Load page % error:", err);
  }
}

function calculateResultPercent() {
  let correct = 0;

  userAnswers.forEach((q) => {
    if (!q || !q.attempts) return;

    // ✅ ONLY first attempt counts (same as your result page)
    if (q.attempts[0]?.isCorrect) {
      correct++;
    }
  });

  return filteredQuiz.length === 0
    ? 0
    : Math.round((correct / filteredQuiz.length) * 100);
}