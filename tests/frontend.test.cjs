"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const code = fs.readFileSync("site/assets/js/indicators.js", "utf8");
const fakeNode = () => ({
  textContent: "",
  addEventListener() {},
  replaceChildren() {},
  append() {},
  classList: { add() {} },
  dataset: {},
  querySelector() { return null; }
});
const nodes = new Map();
const sandbox = {
  document: {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, fakeNode());
      return nodes.get(id);
    },
    querySelectorAll() { return []; },
    createElement() { return fakeNode(); }
  },
  fetch: async () => ({ ok: true, json: async () => ({ indicators: [] }) }),
  Intl, URL,
  console: { error() {} }
};
vm.createContext(sandbox);
vm.runInContext(code + "\nthis.formatForTest = formatIndicatorValue; this.dateForTest = formatRecordDate; this.indexForTest = indexIndicatorCards; this.renderForTest = renderItem;", sandbox);
const value = sandbox.formatForTest;
const normalize = text => text.replace(/\u00a0/g, " ").replace(/\u202f/g, " ");

assert.equal(normalize(value({ value: 68060.93, unit: "R$" })), "R$ 68.060,93");
assert.equal(value({ value: 279545, unit: "pessoas" }), "279.545");
assert.equal(value({ value: 279545, unit: "pessoas" }, true), "279.545 pessoas");
assert.equal(value({ value: 77.9, unit: "%" }), "77,9%");
assert.equal(sandbox.dateForTest("2026-10-23"), "23/10/2026");
assert.equal(sandbox.dateForTest("não informado"), "não informado");

console.log("Formatação dos indicadores e datas: OK");

let scans = 0;
const renderCard = id => {
  const number = {textContent: "", applied: [], classList: {
    add(name) { number.applied.push(name); }
  }};
  const origin = {children: [], replaceChildren() { this.children = []; },
    append(...children) { this.children.push(...children); }};
  return {dataset: {indicator: id}, number, origin,
    querySelector(selector) {
      return selector === ".number" ? number : selector === ".origin" ? origin : null;
    }
  };
};
const cards = [renderCard("populacao-censo-2022"), renderCard("populacao-censo-2022"),
  renderCard("populacao-estimada")];
sandbox.document.querySelectorAll = selector => {
  if (selector === "[data-indicator]") { scans++; return cards; }
  return [];
};
const indexed = sandbox.indexForTest();
assert.equal(scans, 1, "O DOM deve ser percorrido uma única vez");
assert.equal(indexed.get("populacao-censo-2022").length, 2);
sandbox.renderForTest({
  id: "populacao-censo-2022", value: 279545, unit: "pessoas",
  source: {institution: "IBGE"}, reference_period: "2022",
  updated_at: "2026-10-23"
}, indexed);
assert.equal(scans, 1, "Renderização não deve percorrer os cartões novamente");
assert.deepEqual(cards.slice(0, 2).map(card => card.number.textContent),
  ["279.545", "279.545"]);
assert.equal(cards[2].number.textContent, "", "Indicadores diferentes permanecem intactos");
assert.equal(cards[0].origin.children.length, 2);
assert.equal(cards[0].origin.children[1].textContent, "Fonte e metodologia");


/* Regressão PT/EN: cada verbete tem resumo, explicação adicional e fonte HTTPS. */
const glossaryCode = fs.readFileSync("site/assets/js/app.js", "utf8");
const glossaryMatch = glossaryCode.match(/const glossaryEntries = (\\{[\\s\\S]*?\\});\\nconst appEnglish/);
assert.ok(glossaryMatch, "Glossário estruturado ausente");
const glossaryEntries = JSON.parse(glossaryMatch[1]);
assert.equal(Object.keys(glossaryEntries).length, 9);
for (const entry of Object.values(glossaryEntries)) {
  for (const locale of ["pt", "en"]) {
    for (const property of ["title", "short", "detail"]) {
      assert.ok(entry[locale]?.[property]?.length > 10, locale + " " + property);
    }
    assert.ok(entry.source[locale]?.length > 10);
  }
  assert.equal(new URL(entry.source.url).protocol, "https:");
}
for (const path of ["site/index.html", "site/en/index.html"]) {
  const html = fs.readFileSync(path, "utf8");
  assert.match(html, /id="termDetails"/);
  assert.match(html, /id="termSource"/);
  assert.match(html, /id="termDialog" aria-labelledby="termTitle"/);
}
console.log("Glossário PT/EN: definições, detalhes, fontes e acessibilidade OK");
