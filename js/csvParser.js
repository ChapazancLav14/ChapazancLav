export function fixText(text) {
  if (!text) return text;

  return text
    .replace(/ш/g, "ա")
    .replace(/р/g, "բ")
    .replace(/q/g, "գ")
    .replace(/η/g, "դ")
    .replace(/gsn/g, "ν")
    .replace(/\bv\b/g, "ν");
}

export function isImagePath(text) {
  return /\.(png|jpg|jpeg|webp|gif)$/i.test(
    text.trim().replace(/\r/g, "")
  );
}

export function cleanAnswer(text) {
  text = text.trim().replace(/\r/g, "");

  // Image paths must NOT be changed.
  if (isImagePath(text)) {
    return text;
  }

  text = fixText(text);

  // Remove ":" or Armenian "։" only from the END of answer choices.
  text = text.replace(/\s*[:։]\s*$/g, "");

  return text;
}

export function parseCSV(text) {
  const lines = text
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

  return lines
    .slice(1)
    .map((line) => {
      const [id, question, a, b, c, d, correct, image] = line.split(";");

      if (!id || !question || !a || !b || !c || !d || !correct) {
        console.warn("⚠️ Bad CSV line skipped:", line);
        return null;
      }

      return {
        id: Number(id),
        image: image?.trim().replace(/\r/g, "") || "",
        question: fixText(question.trim()),
        answers: [
          { text: cleanAnswer(a), correct: correct == 1 },
          { text: cleanAnswer(b), correct: correct == 2 },
          { text: cleanAnswer(c), correct: correct == 3 },
          { text: cleanAnswer(d), correct: correct == 4 },
        ],
      };
    })
    .filter(Boolean);
}
