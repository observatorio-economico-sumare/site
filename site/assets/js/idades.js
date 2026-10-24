"use strict";
(() => {
  const root = document.querySelector("[data-age-chart]");
  if (!root) return;
  const en = document.documentElement.lang === "en";
  const number = new Intl.NumberFormat(en ? "en-US" : "pt-BR");
  const percentage = new Intl.NumberFormat(en ? "en-US" : "pt-BR", {
    minimumFractionDigits: 1, maximumFractionDigits: 1
  });
  const list = root.querySelector("[data-age-list]");
  const selected = root.querySelector("[data-age-selection]");
  const url = en ? "../data/faixas-etarias-2022.json" : "data/faixas-etarias-2022.json";
  const expected = ["0-14", "15-24", "25-34", "35-44", "45-54", "55-64", "65+"];

  async function render() {
    try {
      const response = await fetch(url, {cache: "no-store"});
      if (!response.ok) throw new Error("request");
      const data = await response.json();
      if (data.municipality_code !== "3552403" || data.reference_year !== 2022 ||
          data.total !== 279545 || !Array.isArray(data.bands) ||
          data.bands.length !== expected.length ||
          data.bands.some((row, i) => row.label !== expected[i] ||
            !Number.isInteger(row.value) || row.value < 0) ||
          data.bands.reduce((sum, row) => sum + row.value, 0) !== data.total) {
        throw new Error("invalid data");
      }

      const largest = Math.max(...data.bands.map(row => row.value));
      const buttons = data.bands.map(row => {
        const label = row.label === "65+" ?
          (en ? "65 and over" : "65 anos ou mais") : row.label + (en ? " years" : " anos");
        const share = percentage.format(row.value / data.total * 100) + "%";
        const count = number.format(row.value);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "age-row";
        button.setAttribute("aria-pressed", "false");
        button.setAttribute("aria-label",
          label + ": " + count + (en ? " residents, " : " moradores, ") + share);

        const name = document.createElement("span");
        name.className = "age-label";
        name.textContent = label;
        const track = document.createElement("span");
        track.className = "age-track";
        track.setAttribute("aria-hidden", "true");
        const fill = document.createElement("span");
        fill.className = "age-fill";
        fill.style.width = (row.value / largest * 100).toFixed(3) + "%";
        track.append(fill);
        const value = document.createElement("span");
        value.className = "age-value";
        value.textContent = count + " · " + share;
        button.append(name, track, value);
        button.addEventListener("click", () => {
          buttons.forEach(node => node.setAttribute("aria-pressed", "false"));
          button.setAttribute("aria-pressed", "true");
          selected.textContent = label + ": " + count +
            (en ? " residents (" : " moradores (") + share + ").";
        });
        return button;
      });
      list.replaceChildren(...buttons);
    } catch (_) {
      list.textContent = en ? "Age figures are temporarily unavailable." :
        "Não foi possível carregar os dados por idade.";
    }
  }
  render();
})();
