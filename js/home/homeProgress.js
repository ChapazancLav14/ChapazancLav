import { parseCSV } from "../csvParser.js";

let questionsCache = [];

export async function preloadQuestions() {
  const res = await fetch("data/questions.csv");
  const text = await res.text();

  questionsCache = parseCSV(text);
}

export function updateCircle(answeredCorrectly) {
  const total = questionsCache.length;
  if (!total) return;

  const validIds = new Set(questionsCache.map((q) => q.id));

  const correctCount = Object.keys(answeredCorrectly).filter((id) =>
    validIds.has(Number(id)),
  ).length;

  const percent = Math.round((correctCount / total) * 100);

  const circle = document.getElementById("progress-circle");
  const text = document.getElementById("progress-text");

  if (!circle || !text) return;

  circle.style.background = `conic-gradient(
    var(--green-light) ${percent}%,
    #ddd ${percent}%
  )`;

  text.innerText = percent + "%";
}

export function showHomeApp() {
  document.getElementById("homeLoader")?.classList.add("hidden");
  document.getElementById("homeApp")?.classList.remove("hidden");
}
