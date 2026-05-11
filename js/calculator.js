window.toggleCalculator = function () {
  document
    .getElementById("calculatorBlock")
    .classList.toggle("hidden-calculator");
};

window.appendCalc = function (value) {
  const display = document.getElementById("calcDisplay");

  if (display.value === "Error") {
    display.value = "";
  }

  const current = display.value;
  const operators = ["+", "-", "*", "/", "^", "!"];
  const normalOperators = ["+", "-", "*", "/", "^"];

  if (value === "+/-") {
    if (current.startsWith("-")) {
      display.value = current.slice(1);
    } else if (current !== "") {
      display.value = "-" + current;
    }
    return;
  }

  const lastChar = current.slice(-1);

  if (operators.includes(value)) {
    if (operators.includes(lastChar)) {
      display.value = current.slice(0, -1) + value;
      return;
    }
  }

  if (value === "!" && current === "") return;
  if (value === "!" && !/[0-9)]$/.test(current)) return;

  if (current === "" && normalOperators.includes(value) && value !== "-") {
    return;
  }

  if (value === ")") {
    const open = (current.match(/\(/g) || []).length;
    const close = (current.match(/\)/g) || []).length;

    if (open <= close) return;
  }

  display.value += value;
};

window.clearCalc = function () {
  document.getElementById("calcDisplay").value = "";
};

window.deleteCalc = function () {
  const display = document.getElementById("calcDisplay");

  if (display.value === "Error") {
    display.value = "";
    return;
  }

  display.value = display.value.slice(0, -1);
};

function factorial(n) {
  n = Number(n);

  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n > 170) return NaN;

  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }

  return result;
}

function replaceFactorials(expression) {
  return expression.replace(/(\d+)!/g, (_, num) => factorial(Number(num)));
}

window.calculateCalc = function () {
  const display = document.getElementById("calcDisplay");

  if (display.value === "" || display.value === "Error") return;

  try {
    let expression = display.value
      .replace(/÷/g, "/")
      .replace(/×/g, "*")
      .replace(/\^/g, "**");

    expression = replaceFactorials(expression);

    const result = Function('"use strict"; return (' + expression + ")")();

    if (!Number.isFinite(result)) {
      display.value = "Error";
      return;
    }

    display.value = result;
  } catch {
    display.value = "Error";
  }
};
