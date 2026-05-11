function formatSuperscript(text) {
  const map = {
    0: "⁰",
    1: "¹",
    2: "²",
    3: "³",
    4: "⁴",
    5: "⁵",
    6: "⁶",
    7: "⁷",
    8: "⁸",
    9: "⁹",
  };

  return text.replace(/\^(\d+)/g, (_, num) =>
    num
      .split("")
      .map((d) => map[d] || d)
      .join("")
  );
}

function formatGreek(text) {
  return text
    .replace(/alpha/g, "α")
    .replace(/beta/g, "β")
    .replace(/gamma/g, "γ")
    .replace(/theta/g, "θ")
    .replace(/lambda/g, "λ");
}

function formatSqrt(text) {
  if (!text) return text;

  return text
    .replace(/s(?:q|գ)rt\(([^)]+)\)/gu, "√($1)")
    .replace(/s(?:q|գ)rt/gu, "√");
}

function formatFractions(text) {
  if (!text) return text;

  function stripOuterParens(value) {
    value = value.trim();

    if (value.startsWith("(") && value.endsWith(")")) {
      const inside = value.slice(1, -1);

      // Only remove simple outside parentheses.
      if (!inside.includes("(") && !inside.includes(")")) {
        return inside.trim();
      }
    }

    return value;
  }

  function splitDenominatorSuffix(den) {
    den = stripOuterParens(den);

    let suffix = "";
    let changed = true;

    while (changed) {
      changed = false;

      // Armenian suffix: -ը / -ն
      const armenianSuffix = den.match(/^(.*?)(-(?:ը|ն))$/u);
      if (armenianSuffix) {
        den = stripOuterParens(armenianSuffix[1].trim());
        suffix = armenianSuffix[2] + suffix;
        changed = true;
        continue;
      }

      // Closing bracket from expressions like sqrt(gh/2)
      const closingSuffix = den.match(/^(.*?)([)\]])$/u);
      if (closingSuffix && !/[([]/.test(closingSuffix[1])) {
        den = stripOuterParens(closingSuffix[1].trim());
        suffix = closingSuffix[2] + suffix;
        changed = true;
      }
    }

    return { den, suffix };
  }

  return text.replace(
    /(\([^()\/]+\)|[^\s:;,\/]+)\/(\([^()\/]+\)|[^\s:;,\/]+)/g,
    (match, num, den) => {
      num = stripOuterParens(num.trim());

      const result = splitDenominatorSuffix(den.trim());
      den = result.den;
      const suffix = result.suffix;

      const fracHtml = `
        <span class="frac">
          <span class="top">${num}</span>
          <span class="bottom">${den}</span>
        </span>
      `;

      if (suffix) {
        return `<span class="frac-group">${fracHtml}<span class="frac-suffix">${suffix}</span></span>`;
      }

      return fracHtml;
    }
  );
}

function normalizeSubDigits(value = "") {
  const map = {
    "0": "₀",
    "1": "₁",
    "2": "₂",
    "3": "₃",
    "4": "₄",
    "5": "₅",
    "6": "₆",
    "7": "₇",
    "8": "₈",
    "9": "₉",
  };

  return value.replace(/[0-9]/g, (digit) => map[digit] || digit);
}

function vectorHtml(symbol, sub = "") {
  const cleanSymbol = symbol.trim();
  const cleanSub = normalizeSubDigits(sub.trim());
  return `<span class="vector-wrap"><span class="vector">${cleanSymbol}</span>${cleanSub ? `<span class="vec-sub">${cleanSub}</span>` : ""}</span>`;
}

function variableSubHtml(symbol, sub = "") {
  return `<span class="var-with-sub"><span class="var-main">${symbol}</span><span class="var-sub">${sub}</span></span>`;
}

function formatVectors(text) {
  if (!text) return text;

  // vec(v)միջ₂ / vec(v)միջ2 / vec(v)միջ
  text = text.replace(
    /vec\(([^)]+)\)\s*_?\s*միջ([₀₁₂₃₄₅₆₇₈₉0-9]*)(?=$|[^Ա-Ֆա-ֆ])/g,
    (_, symbol, index) => vectorHtml(symbol, `միջ${index || ""}`)
  );

  // raw vմիջ₂ / vմիջ2 / v միջ / v_միջ
  text = text.replace(
    /(^|[^A-Za-zԱ-Ֆա-ֆ0-9_])([a-zA-Z])\s*_?\s*միջ([₀₁₂₃₄₅₆₇₈₉0-9]*)(?=$|[^Ա-Ֆա-ֆ])/g,
    (_, prefix, symbol, index) => `${prefix}${vectorHtml(symbol, `միջ${index || ""}`)}`
  );

  // vec(v)₁ / vec(v)₂
  text = text.replace(
    /vec\(([^)]+)\)([₀₁₂₃₄₅₆₇₈₉]+)/g,
    (_, symbol, sub) => vectorHtml(symbol, sub)
  );

  // vA / vB / vT as v with subscript, but avoid changing products like vBΔl.
  text = text.replace(
    /(^|[^A-Za-zԱ-Ֆա-ֆ0-9_])v([A-Z])(?=$|[^A-Za-zԱ-Ֆա-ֆ0-9_])/g,
    (_, prefix, sub) => `${prefix}${variableSubHtml("v", sub)}`
  );

  // normal vec(v)
  text = text.replace(/vec\(([^)]+)\)/g, (_, symbol) => vectorHtml(symbol));

  return text;
}

export function formatMath(text) {
  text = formatSuperscript(text);
  text = formatGreek(text);
  text = formatSqrt(text);
  text = formatFractions(text);

  // Important: vectors must stay last so generated HTML is not parsed again.
  text = formatVectors(text);

  return text;
}
