// quantities.js

const quantities = [
  { name: "Ազատ անկման արագացումը", symbol: "g", value: "10", unit: "մ/վ²" },
  { name: "Գրավիտացիոն հաստատունը", symbol: "G", value: "6,7 · 10⁻¹¹", unit: "Ն·մ²/կգ²" },
  { name: "Ավոգադրոյի հաստատունը", symbol: "Nₐ", value: "6,02 · 10²³", unit: "մոլ⁻¹" },
  { name: "Բոլցմանի հաստատունը", symbol: "k", value: "1,38 · 10⁻²³", unit: "Ջ/Կ" },
  { name: "Գազային ունիվերսալ հաստատունը", symbol: "R", value: "8,3", unit: "Ջ/մոլ·Կ" },
  { name: "Լույսի արագությունը վակուումում", symbol: "c", value: "3 · 10⁸", unit: "մ/վ" },
  { name: "Էլեկտրոնի լիցքի մոդուլը", symbol: "e", value: "1,6 · 10⁻¹⁹", unit: "Կլ" },
  { name: "Էլեկտրոնի զանգվածը", symbol: "mₑ", value: "9 · 10⁻³¹", unit: "կգ" },
  { name: "Պրոտոնի զանգվածը", symbol: "mₚ", value: "1,68 · 10⁻²⁷", unit: "կգ" },
  { name: "Էլեկտրական հաստատունը", symbol: "ε₀", value: "8,85 · 10⁻¹²", unit: "Ֆ/մ" },
  { name: "Կուլոնի օրենքում գործակիցը", symbol: "k", value: "1 / 4πε₀ = 9 · 10⁹", unit: "Ն·մ²/Կլ²" },
  { name: "Պլանկի հաստատունը", symbol: "h", value: "6,6 · 10⁻³⁴", unit: "Ջ·վ" }
];

const table = document.getElementById("quantitiesTable");

quantities.forEach((q, index) => {
  table.innerHTML += `
    <tr>
      <td>
        <div class="quantity-row">
          <strong>${index + 1}</strong>
          <span class="quantity-text">${q.name}</span>
        </div>
      </td>
      <td>${q.symbol}</td>
      <td>${q.value}</td>
      <td>${q.unit}</td>
    </tr>
  `;
});