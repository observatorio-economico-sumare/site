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
const glossaryMatch = glossaryCode.match(/const glossaryEntries = (\{[\s\S]*?\});\nconst appEnglish/);
assert.ok(glossaryMatch, "Glossário estruturado ausente");
const glossaryEntries = JSON.parse(glossaryMatch[1]);
assert.equal(Object.keys(glossaryEntries).length, 9);
for (const entry of Object.values(glossaryEntries)) {
  for (const locale of ["pt", "en"]) {
    for (const property of ["title", "short", "detail"]) {
      assert.ok(entry[locale]?.[property]?.length >= (property === "title" ? 2 : 20), locale + " " + property);
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

/* Regressão: títulos, páginas e interface não exibem travessões longos. */
for (const path of [
  "site/index.html", "site/en/index.html",
  "site/governanca.html", "site/en/governanca.html",
  "site/assets/js/app.js", "site/assets/js/indicators.js"
]) {
  const content = fs.readFileSync(path, "utf8");
  assert.ok(!/[\u2014\u2013\u2015]/u.test(content),
    path + ": contém travessão longo");
}
assert.match(glossaryCode, /appEnglish \? "Learn more" : "Saiba mais"/);
console.log("Botões Saiba mais / Learn more e pontuação: OK");

/* A apresentação pertence à aba Visão geral, não é repetida nas demais abas. */
for (const path of ["site/index.html", "site/en/index.html"]) {
  const html = fs.readFileSync(path, "utf8");
  const overviewStart = html.indexOf('<section class="tab" id="inicio" role="tabpanel">');
  const introStart = html.indexOf('<section class="intro intro--overview">');
  const anotherTab = html.indexOf('<section class="tab" hidden="" id="populacao"');
  assert.ok(overviewStart >= 0 && introStart > overviewStart && introStart < anotherTab,
    path + ": apresentação deve aparecer somente na Visão geral");
  assert.equal(html.split('class="intro intro--overview"').length, 2,
    path + ": apresentação duplicada");
  assert.doesNotMatch(html, /class="aside"/);
  assert.doesNotMatch(html, /Sobre esta versão|About this version/);
}

/* Resumo institucional objetivo e sem texto de bastidores na interface. */
for(const language of ["", "en/"]){
 const governance = fs.readFileSync("site/" + language + "governanca.html","utf8");
 assert.equal((governance.match(/class="governance-section"/g)||[]).length,8);
 assert.match(governance,/class="governance-grid"/);
 assert.doesNotMatch(governance,/governance-(?:toc|sidebar|layout|section-num|section-head)/);
 const ids=[...governance.matchAll(/<section class="governance-section" id="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,8,"IDs de seções devem ser únicos");
 assert.deepEqual(ids,[
   "sobre-o-oes","identidade-institucional","declaracao-de-independencia",
   "sobre-a-fundadora","politica-editorial","politica-de-auditoria",
   "politica-de-transparencia","direitos-autorais-e-licencas"
 ]);
 assert.ok(governance.length < 8000, "Governança excessivamente longa");
 const homepage = fs.readFileSync("site/" + language + "index.html","utf8");
 assert.doesNotMatch(homepage,/id="updateState"|in phase of prototyping|fase de protótipo/);
}
assert.doesNotMatch(fs.readFileSync("site/assets/js/indicators.js","utf8"),
 /indicadores com fonte e documentação disponíveis|indicators with documented sources/);

/* Governança: duas colunas desktop, uma mobile, sem decoração redundante. */
const governanceCss = fs.readFileSync("site/assets/css/styles.css","utf8");
assert.match(governanceCss,/\.governance-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
assert.match(governanceCss,/@media\(max-width:760px\)\{\s*\.governance-grid\{grid-template-columns:minmax\(0,1fr\)/);
assert.doesNotMatch(governanceCss,/\.governance-toc|\.governance-sidebar|\.governance-section-num/);

/* Navegação compacta e responsiva, em ambos os idiomas. */
for (const [path,names] of [
 ["site/index.html",["Visão geral","População","Trabalho e renda","Economia","Análises","Fontes","Institucional"]],
 ["site/en/index.html",["Overview","Population","Jobs & income","Economy","Research","Sources","About"]]
]){
 const html=fs.readFileSync(path,"utf8");
 const menu=(html.match(/<nav aria-label="(?:Navegação principal|Main navigation)">[\s\S]*?<\/nav>/)||[])[0];
 assert.ok(menu,path+": missing nav");
 const labels=[...menu.matchAll(/<button[^>]*data-tab="[^"]+"[^>]*>([^<]+)<\/button>/g)].map(x=>x[1]);
 assert.deepEqual(labels,names,path+": nav labels");
 assert.ok(menu.includes('class="nav-scroll-hint"'));
}
const compactCss=fs.readFileSync("site/assets/css/styles.css","utf8");
assert.match(compactCss,/\.nav-inner\{align-items:center;justify-content:space-between/);
assert.match(compactCss,/\.nav-inner button\{flex:0 0 auto;white-space:nowrap/);

/* Biblioteca: acesso em Estudos e referência à coleção de 26 trabalhos. */
const libraryHTML = fs.readFileSync("site/biblioteca.html","utf8");
const libraryEntries=[...libraryHTML.matchAll(/<article class="library-entry" id="([^"]+)">/g)];
assert.equal(libraryEntries.length,26,"Quantidade atual de estudos");
assert.equal(new Set(libraryEntries.map(x=>x[1])).size,26);
const libraryLinks=[...libraryHTML.matchAll(/<a class="library-source" href="([^"]+)"/g)].map(x=>x[1]);
assert.equal(libraryLinks.length,26);
assert.ok(libraryLinks.every(url=>url.startsWith("https://")));
for(const [page,href] of [["site/index.html","biblioteca.html"],["site/en/index.html","../biblioteca.html"]]){
 const html=fs.readFileSync(page,"utf8");
 assert.ok(html.includes('class="nav-library-link" href="'+href+'"'),page+": biblioteca ausente do menu");
 assert.equal((html.match(/class="nav-library-link"/g)||[]).length,1);
 assert.doesNotMatch(html,/class="tab" hidden="" id="glossario"/);
 assert.match(html,/<section class="glossary-section" id="glossario"/);
 assert.match(html,/<div class="glossary" id="glossary"/);
 assert.match(html,/<section class="tab" hidden="" id="metodologia"[\s\S]*?<section class="glossary-section" id="glossario"/);
}

assert.match(glossaryCode,/hashTab === "glossario" \? "metodologia"/);
