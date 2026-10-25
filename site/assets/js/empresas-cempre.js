"use strict";
(() => {
  const root = document.querySelector("[data-cempre]");
  if (!root) return;
  const en = document.documentElement.lang === "en";
  const format = new Intl.NumberFormat(en ? "en-US" : "pt-BR");
  const percent = new Intl.NumberFormat(en ? "en-US" : "pt-BR", {maximumFractionDigits: 1, minimumFractionDigits: 1});
  const names = en ? {
    "Serviços": "Services", "Comércio": "Trade", "Indústria": "Industry",
    "Construção": "Construction", "Agropecuária": "Agriculture"
  } : {};
  const bars = root.querySelector("[data-cempre-bars]");
  const selected = root.querySelector("[data-cempre-selected]");

  const element = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  };

  const show = data => {
    for (const field of ["total"]) {
      root.querySelector('[data-cempre-number="' + field + '"]').textContent = format.format(data[field]);
    }
    const buttons = [];
    function choose(active) {
      for (const [index, button] of buttons.entries()) {
        button.setAttribute("aria-pressed", String(index === active));
      }
      const sector = data.sectors[active];
      const share = percent.format(sector.value / data.total * 100) + "%";
      const label = names[sector.name] || sector.name;
      selected.textContent = en
        ? label + ": " + format.format(sector.value) + " (" + share + " of the total)."
        : label + ": " + format.format(sector.value) + " (" + share + " do total).";
    }
    const fragment = document.createDocumentFragment();
    for (const [index, sector] of data.sectors.entries()) {
      const label = names[sector.name] || sector.name;
      const button = element("button", "empresas-bar", undefined);
      button.type = "button";
      const title = element("span", "empresas-bar-label", label);
      const track = element("span", "empresas-bar-track");
      track.setAttribute("aria-hidden", "true");
      const fill = element("span", "empresas-bar-fill");
      fill.style.width = (sector.value / data.total * 100) + "%";
      track.append(fill);
      const value = element("span", "empresas-bar-value", format.format(sector.value));
      button.append(title, track, value);
      button.setAttribute("aria-label", label + ": " + format.format(sector.value));
      button.addEventListener("click", () => choose(index));
      buttons.push(button);
      fragment.append(button);
    }
    bars.replaceChildren(fragment);
    choose(0);
  };

  const url = en ? "../data/empresas-cempre-2024.json" : "data/empresas-cempre-2024.json";
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(data => {
      const sectors = data.sectors;
      if (data.municipality_ibge !== "3552403" || data.reference_year !== 2024 ||
          !Number.isInteger(data.total) || data.total <= 0 ||
          !Number.isInteger(data.occupied_persons) || !Number.isInteger(data.salaried_persons) ||
          data.occupied_persons < data.salaried_persons ||
          !Array.isArray(sectors) || sectors.length !== 5 ||
          sectors.some(s => !(s.name in {"Serviços":1,"Comércio":1,"Indústria":1,"Construção":1,"Agropecuária":1}) ||
            !Number.isInteger(s.value) || s.value < 0) ||
          new Set(sectors.map(s => s.name)).size !== 5 ||
          sectors.reduce((sum, s) => sum + s.value, 0) !== data.total) {
        throw new Error("Invalid CEMPRE data");
      }
      show(data);
    })
    .catch(() => {
      root.querySelectorAll("[data-cempre-number]").forEach(node => { node.textContent = "—"; });
      selected.textContent = en ? "IBGE figures are temporarily unavailable." : "Não foi possível carregar os dados do IBGE.";
    });
})();
