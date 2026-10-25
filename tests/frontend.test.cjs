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
assert.equal(normalize(value({ id: "pib-municipal-2023", value: 19026093000, unit: "R$" })), "R$ 19,03 bi");
assert.equal(normalize(value({ id: "pib-municipal-2023", value: 19026093000, unit: "R$" }, true)), "R$ 19.026.093.000,00");
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
assert.equal(Object.keys(glossaryEntries).length, 10);
assert.ok(glossaryEntries["Rendimento mediano"]);
assert.ok(glossaryEntries["PIB por habitante"]);
assert.ok(!glossaryEntries["Servidor público"]);
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
  const overviewStart = html.indexOf('<section class="tab" id="inicio" role="region">');
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
 ["site/index.html",["Visão geral","População","Trabalho e renda","Economia","Empresas","Análises","Entenda os dados","Institucional"]],
 ["site/en/index.html",["Overview","Population","Jobs & income","Economy","Businesses","Research","Understanding the data","About"]]
]){
 const html=fs.readFileSync(path,"utf8");
 const menu=(html.match(/<nav aria-label="(?:Navegação principal|Main navigation)">[\s\S]*?<\/nav>/)||[])[0];
 assert.ok(menu,path+": missing nav");
 const labels=[...menu.matchAll(/<button[^>]*data-tab="[^"]+"[^>]*>([^<]+)<\/button>/g)].map(x=>x[1]);
 assert.deepEqual(labels,names,path+": nav labels");
 const order=[...menu.matchAll(/data-tab="([^"]+)"|class="nav-library-link"/g)].map(m=>m[1]||"biblioteca");
 assert.deepEqual(order,["inicio","populacao","trabalho","economia","empresas","biblioteca","analises","metodologia","sobre"]);
 assert.match(menu,/aria-expanded="true"/);
 assert.doesNotMatch(menu,/role="tablist"|role="tab"|nav-scroll-hint/);
}
const compactCss=fs.readFileSync("site/assets/css/styles.css","utf8");
assert.match(compactCss,/\.nav-inner\{display:flex;flex-wrap:wrap;align-items:center/);
assert.match(compactCss,/\.metrics--three\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);

/* A biblioteca cresce a partir do catálogo, sem contagens fixas. */
const libraryCatalog=JSON.parse(fs.readFileSync("data/biblioteca/estudos.json","utf8"));
const expectedStudies=libraryCatalog.registros.filter(entry=>entry.publicar_no_site==="SIM");
const libraryHTML = fs.readFileSync("site/biblioteca.html","utf8");
const libraryEntries=[...libraryHTML.matchAll(/<article class="library-entry" id="([^"]+)" data-topic="([^"]+)">/g)];
assert.equal(libraryEntries.length,expectedStudies.length,"Número de estudos divergente do catálogo");
assert.equal(new Set(libraryEntries.map(x=>x[1])).size,expectedStudies.length);
const libraryLinks=[...libraryHTML.matchAll(/<a class="library-source" href="([^"]+)"/g)].map(x=>x[1]);
assert.equal(libraryLinks.length,expectedStudies.length);
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

/* Os títulos do acervo seguem capitalização editorial, sem caixa alta integral. */
for(const [, title] of libraryHTML.matchAll(/<article class="library-entry" id="[^"]+" data-topic="[^"]+">\s*<h2>([^<]+)<\/h2>/g)){
 const letters=title.replace(/[^A-Za-zÀ-ÿ]/g,"");
 assert.ok(letters!==letters.toUpperCase(),"Título integralmente em caixa alta: "+title);
}

/* Apresentação dos indicadores efetivamente disponíveis e mobile. */
for(const page of ["site/index.html","site/en/index.html"]){
 const html=fs.readFileSync(page,"utf8");
 const home=html.slice(html.indexOf('<section class="tab" id="inicio" role="region">'),html.indexOf('<section class="tab" hidden="" id="populacao"'));
 assert.deepEqual([...home.matchAll(/data-indicator="([^"]+)"/g)].map(x=>x[1]),["populacao-censo-2022","populacao-estimada","pib-per-capita-2023"]);
 assert.doesNotMatch(home,/id="sectors"|CAGED|Where are the jobs|Onde estão os empregos/);
 const work=html.slice(html.indexOf('<section class="tab" hidden="" id="trabalho"'),html.indexOf('<section class="tab" hidden="" id="economia"'));
 assert.doesNotMatch(work,/<table/);
 const workIds=[...work.matchAll(/data-indicator="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(workIds,[
  "rais-vinculos-formais-2025","estoque-vinculos-formais",
  "saldo-vinculos-formais","saldo-vinculos-formais-2026-08",
  "rais-vinculos-servicos-2025","rais-vinculos-industria-2025",
  "rais-vinculos-comercio-2025","rais-vinculos-construcao-2025",
  "rais-vinculos-agropecuaria-2025",
  "pessoas-ocupadas","pessoas-desocupadas","previdencia-ocupados","residentes-conta-propria-2022",
  "renda-mediana-ocupados-2022"
 ]);
 const economy=html.slice(html.indexOf('<section class="tab" hidden="" id="economia"'),
                          html.indexOf('<section class="tab" hidden="" id="empresas"'));
 const economyIds=[...economy.matchAll(/data-indicator="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(economyIds,["pib-municipal-2023","pib-per-capita-2023"]);
 const approved=new Set(JSON.parse(fs.readFileSync("data/processed/indicators.json","utf8"))
                        .indicators.map(x=>x.id));
 
 const population=html.slice(html.indexOf('<section class="tab" hidden="" id="populacao"'),
                             html.indexOf('<section class="tab" hidden="" id="trabalho"'));
 const populationIds=[...population.matchAll(/data-indicator="([^"]+)"/g)].map(x=>x[1]);
 assert.ok(populationIds.includes("escolarizacao-6-14-anos-2022"));
 assert.ok(populationIds.includes("taxa-alfabetizacao-15-mais-2022"));
 for(const id of [...workIds,...economyIds,...populationIds]) {
   assert.ok(approved.has(id), "Dados não auditados: "+id);
 }

 assert.ok(work.includes('href="#metodologia"'));
 assert.doesNotMatch(work,/Dados em conferência|Data being verified/);
 assert.ok(html.includes('class="independent-main"'));
 assert.doesNotMatch(html,/class="independent-secondary"/);
}
assert.doesNotMatch(glossaryCode,/getElementById\("sectors"\)/);

/* Estados de carregamento não devem apresentar dados validados como pendentes. */
for (const [page,expected] of [["site/index.html","Carregando…"],["site/en/index.html","Loading…"]]) {
 const html=fs.readFileSync(page,"utf8");
 const home=html.slice(html.indexOf('<section class="tab" id="inicio" role="region">'),
                       html.indexOf('<section class="tab" hidden="" id="populacao"'));
 assert.equal(home.split('<div class="number">'+expected+'</div>').length-1,3);
 assert.doesNotMatch(home,/class="number">Em validação|class="number">Pending validation/);
}

/* A biblioteca tem navegação independente da aba Análises. */
{
 const html=fs.readFileSync("site/biblioteca.html","utf8");
 assert.doesNotMatch(html,/class="library-back"|Voltar ao site/);
 assert.ok(html.includes('<nav class="subpage-nav library-nav" aria-label="Navegação principal">'));
 assert.ok(html.includes('aria-current="page">Biblioteca</a>'));
 const sections=["inicio","populacao","trabalho","economia","empresas","analises","metodologia","sobre"];
 const targets=[...html.matchAll(/<a href="index\.html#([^"]+)">[^<]+<\/a>/g)].map(m=>m[1]);
 assert.deepEqual(targets,sections,"A Biblioteca deve ter os mesmos itens do menu principal");
 assert.doesNotMatch(html,/href="en\/index\.html#analises"/);
 assert.ok(html.includes('<a href="index.html#analises">Análises</a>'));
 assert.ok(html.includes('hreflang="en" href="en/index.html"'));
}

/* Fontes oficiais e glossário permanecem acessíveis, sem catálogo repetido. */
for (const [path,titles] of [
 ["site/index.html",["Fontes e metodologia","Glossário"]],
 ["site/en/index.html",["Sources and methodology","Glossary"]]
]){
 const html=fs.readFileSync(path,"utf8");
 const section=html.slice(html.indexOf('<section class="tab" hidden="" id="metodologia"'),
                          html.indexOf('<section class="tab" hidden="" id="sobre"'));
 let previous=-1;
 for(const title of titles){
   const pos=section.indexOf(">"+title+"</h2>");
   assert.ok(pos>previous,path+": heading missing or out of order: "+title);
   previous=pos;
 }
 assert.ok(section.includes('<section class="glossary-section" id="glossario"'));
 assert.doesNotMatch(section,/indicator-sources|Detalhes dos indicadores|Indicator details/);
}
assert.doesNotMatch(code,/getElementById\("indicator-sources"\)|source--catalog/);
assert.match(code,/detail.addEventListener\("click", \(\) => openIndicatorDetail\(item\)\)/);

/* Apresentação editorial dos três indicadores verificados. */
for(const page of ["site/index.html","site/en/index.html"]){
 const html=fs.readFileSync(page,"utf8");
 const summary=html.slice(html.indexOf('<section class="tab" id="inicio" role="region">'),
                          html.indexOf('<section class="tab" hidden="" id="populacao"'));
 assert.doesNotMatch(summary,/Indicadores oficiais|Official indicators|Cada indicador apresenta sua fonte e metodologia|Each indicator provides its source and methodology/);
}
const editorialCss=fs.readFileSync("site/assets/css/styles.css","utf8");
assert.match(editorialCss,/\.metrics--three\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\);gap:0;border:0;background:transparent;box-shadow:none/);
assert.match(editorialCss,/\.metrics--three \.metric:first-child\{padding-left:0;border-top:1px solid var\(--line\)\}/);
assert.doesNotMatch(editorialCss,/\.metrics--three \.metric:first-child\{border-top:3px solid var\(--yellow\)\}/);

/* Limitações de um indicador pertencem à sua ficha técnica, não ao rodapé geral. */
for (const page of ["site/index.html","site/en/index.html"]){
 const html=fs.readFileSync(page,"utf8");
 const intro=html.slice(html.indexOf('<section class="tab" id="inicio" role="region">'),
                       html.indexOf('<section class="tab" hidden="" id="populacao"'));
 assert.doesNotMatch(intro,/PIB per capita não representa|GDP per capita is not average personal income/);
}
assert.doesNotMatch(fs.readFileSync("site/assets/css/styles.css","utf8"),/#inicio > \.footnote/);

/* Unidade visual: mesmo menu nas páginas independentes, linhas discretas. */
for(const [path,base,labels] of [
 ["site/governanca.html","index.html",["Visão geral","População","Trabalho e renda","Economia","Empresas","Análises","Entenda os dados","Institucional"]],
 ["site/en/governanca.html","index.html",["Overview","Population","Jobs & income","Economy","Businesses","Research","Understanding the data","About"]]
]){
 const html=fs.readFileSync(path,"utf8");
 assert.match(html,/<nav class="subpage-nav"/);
 assert.doesNotMatch(html,/class="back-link"/);
 const list=[...html.matchAll(/<a href="index\.html#[^"]+"(?: aria-current="page")?>([^<]+)<\/a>/g)].map(x=>x[1]);
 assert.deepEqual(list,labels);
 const menu=html.match(/<nav class="subpage-nav"[^>]*>[\s\S]*?<\/nav>/)?.[0];
 assert.ok(menu);
 const order=[...menu.matchAll(/href="index\.html#([^"]+)"|class="nav-library-link"/g)].map(m=>m[1]||"biblioteca");
 assert.deepEqual(order,["inicio","populacao","trabalho","economia","empresas","biblioteca","analises","metodologia","sobre"]);
 assert.match(html,/aria-current="page"/);
}
const unifiedStyles=fs.readFileSync("site/assets/css/styles.css","utf8");
assert.match(unifiedStyles,/\.institutional-block\{border:0;border-top:1px solid var\(--line\);background:transparent\}/);
assert.match(unifiedStyles,/\.metrics--two \.metric\{background:transparent;/);
assert.doesNotMatch(unifiedStyles,/\.note\{background: #fff; border-left: 4px/);
assert.doesNotMatch(fs.readFileSync("site/assets/css/biblioteca.css","utf8"),/\.library-nav \.nav-inner a/);
assert.doesNotMatch(fs.readFileSync("site/assets/js/indicators.js","utf8"),/last updated by the OES on/);

/* Os três painéis validados têm estado de carregamento, não de validação pendente. */
for(const [page,loading] of [["site/index.html","Carregando…"],["site/en/index.html","Loading…"]]){
 const html=fs.readFileSync(page,"utf8");
 const pop=html.slice(html.indexOf('<section class="tab" hidden="" id="populacao"'),html.indexOf('<section class="tab" hidden="" id="trabalho"'));
 const econ=html.slice(html.indexOf('<section class="tab" hidden="" id="economia"'),html.indexOf('<section class="tab" hidden="" id="empresas"'));
 assert.equal((pop.match(new RegExp('<div class="number">'+loading+'</div>','g'))||[]).length,4);
 assert.equal((econ.match(new RegExp('<div class="number">'+loading+'</div>','g'))||[]).length,2);
 assert.doesNotMatch(pop+econ,/class="number">Em validação|class="number">Pending validation/);
}
assert.doesNotMatch(fs.readFileSync("site/en/index.html","utf8"),/Not equivalent to average personal income/);

/* Cabeçalho uniforme, com o nome em duas linhas e uma única declaração. */
for (const [path,word,statement] of [
 ["site/index.html","Econômico","Iniciativa independente"],
 ["site/en/index.html","Economic","Independent initiative"],
 ["site/governanca.html","Econômico","Iniciativa independente"],
 ["site/en/governanca.html","Economic","Independent initiative"],
 ["site/biblioteca.html","Econômico","Iniciativa independente"]
]){
 const html=fs.readFileSync(path,"utf8");
 const mast=html.slice(html.indexOf('<header class="mast">'),html.indexOf('</header>')+9);
 assert.match(mast,new RegExp(word+'<br\\s*\\/?>'));
 assert.ok(mast.includes(`<span class="independent-main">${statement}</span>`));
 assert.doesNotMatch(mast,/apartidária|nonpartisan/i);
 assert.doesNotMatch(mast,/independent-secondary|Sem vínculo com a Prefeitura Municipal|Not affiliated with the municipal government/);
}
const topicMarkup=fs.readFileSync("site/biblioteca.html","utf8");
const topicScript=fs.readFileSync("site/assets/js/biblioteca.js","utf8");
assert.match(topicMarkup,/id="library-topics" role="group"/);
assert.doesNotMatch(topicMarkup,/id="library-topic"|<select/);
assert.match(topicScript,/aria-pressed/);
assert.match(topicScript,/filterByTopic/);

/* Filtragem por tema: seleção, estado ativo e retorno ao acervo completo. */
{
 const created=[];
 const topicsNode={append(button){created.push(button);}};
 const filterNode={hidden:true};
 const entries=[
   {dataset:{topic:"Educação"},hidden:false},
   {dataset:{topic:"Saúde"},hidden:false},
   {dataset:{topic:"Educação"},hidden:false}
 ];
 const doc={
   querySelectorAll(){return entries;},
   getElementById(id){return id==="library-topics"?topicsNode:filterNode;},
   createElement(){return {
     dataset:{},
     setAttribute(name,value){this[name]=value;},
     addEventListener(name,fn){this[name]=fn;}
   };}
 };
 vm.runInNewContext(fs.readFileSync("site/assets/js/biblioteca.js","utf8"),{document:doc});
 assert.equal(filterNode.hidden,false);
 assert.deepEqual(created.map(button=>button.textContent),["Todos os temas","Educação","Saúde"]);
 assert.equal(created[0]["aria-pressed"],"true");
 created[1].click();
 assert.deepEqual(entries.map(x=>x.hidden),[false,true,false]);
 assert.deepEqual(created.map(x=>x["aria-pressed"]),["false","true","false"]);
 created[0].click();
 assert.deepEqual(entries.map(x=>x.hidden),[false,false,false]);
}

/* Navegação uniforme, acessível e rotulada nos dois idiomas. */
for(const path of ["site/index.html","site/en/index.html"]){
 const html=fs.readFileSync(path,"utf8");
 assert.equal((html.match(/role="region"/g)||[]).length,8);
 assert.doesNotMatch(html,/role="tabpanel"|role="tablist"/);
}
for(const path of ["site/index.html","site/en/index.html","site/governanca.html","site/en/governanca.html","site/biblioteca.html"]){
 const html=fs.readFileSync(path,"utf8");
 const menu=html.match(/<nav\b[^>]*>[\s\S]*?<\/nav>/)?.[0];
 assert.ok(menu);
 const order=[...menu.matchAll(/data-tab="([^"]+)"|href="index\.html#([^"]+)"|class="nav-library-link"/g)]
   .map(m=>m[1]||m[2]||"biblioteca");
 assert.deepEqual(order,["inicio","populacao","trabalho","economia","empresas","biblioteca","analises","metodologia","sobre"]);
}
for(const path of ["site/en/index.html","site/en/governanca.html"]){
 assert.match(fs.readFileSync(path,"utf8"),/>Library \(Portuguese\)<\/a>/);
}
const cleanedCss=fs.readFileSync("site/assets/css/styles.css","utf8");
assert.equal((cleanedCss.match(/\.nav-inner\{display:flex/g)||[]).length,1);
assert.match(cleanedCss,/@media\(max-width:390px\)/);
assert.doesNotMatch(cleanedCss,/nav-scroll-hint|scroll-snap-type/);

/* Ficha pública resumida: metadados de auditoria permanecem apenas no JSON. */
{
 const dom={
   title:{textContent:""},
   body:{children:[],replaceChildren(){this.children=[];},append(node){this.children.push(node);}},
   dialog:{showModal(){this.opened=true;}}
 };
 const savedCreate=sandbox.document.createElement;
 const savedGet=sandbox.document.getElementById;
 sandbox.document.createElement=()=>({
   children:[],className:"",textContent:"",
   append(...children){this.children.push(...children);}
 });
 sandbox.document.getElementById=id=>
   id==="sourceDialog"?dom.dialog:
   id==="sourceDialogTitle"?dom.title:
   id==="sourceDialogBody"?dom.body:
   savedGet(id);
 vm.runInContext("this.openForTest = openIndicatorDetail;",sandbox);
 sandbox.openForTest({
   id:"populacao-censo-2022",name:"População residente",value:279545,
   unit:"pessoas",definition:"Total de residentes recenseados",
   reference_period:"2022",source:{institution:"IBGE",dataset:"Censo Demográfico",
   url:"https://www.ibge.gov.br/cidades-e-estados/sp/sumare.html"},
   method:"Contagem censitária.",limitations:"Ano de referência 2022.",updated_at:"2026-10-23"
 });
 const rows=dom.body.children[0].children;
 const keys=rows.map(row=>row.children[0].textContent);
 assert.deepEqual(keys,["Valor","Definição","Período","Fonte consultada","Metodologia",
   "Limitações","Última atualização no OES","Consultar fonte"]);
 assert.ok(dom.dialog.opened);
 assert.equal(rows.at(-1).children[1].children[0].textContent,"Abrir fonte consultada");
 assert.equal(rows.at(-1).children[1].children[0].href,
   "https://www.ibge.gov.br/cidades-e-estados/sp/sumare.html");
 sandbox.document.createElement=savedCreate;
 sandbox.document.getElementById=savedGet;
}
const publicJs=fs.readFileSync("site/assets/js/indicators.js","utf8");
for (const secret of ["Identificador da consulta","SHA-256 da evidência","Natureza da evidência",
  "Histórico de revisões","Revisão técnica","Coleta pelo OES","Evidência", "reviewed_by"]) {
 assert.ok(!publicJs.includes(secret),"Metadado técnico exposto no JS: "+secret);
}

/* Definição pública clara, com documentação original preservada. */
vm.runInContext("this.localizedForTest = localizedIndicator;",sandbox);
const censusText=sandbox.localizedForTest({
  id:"populacao-censo-2022",definition:"Total de residentes recenseados",
  source:{dataset:"Censo Demográfico"}
});
assert.equal(censusText.definition,
  "Número de pessoas que moravam em Sumaré no Censo de 2022.");


/* Texto público compreensível sem alterar registros técnicos. */
for(const [page,forbidden] of [
 ["site/index.html",["recenseado","recenseamento","Rastreabilidade dos indicadores","vínculos formais"]],
 ["site/governanca.html",["períodos de referência","informações necessárias à interpretação"]],
 ["site/biblioteca.html",["representa endosso"]]
]){
 const content=fs.readFileSync(page,"utf8");
 for(const word of forbidden)assert.ok(!content.includes(word),page+": linguagem excessivamente técnica: "+word);
}
const publicIndicators=fs.readFileSync("site/assets/js/indicators.js","utf8");
assert.match(publicIndicators,/const ptIndicatorText = /);
for(const phrase of ["Número de moradores por quilômetro quadrado",
 "Quanto a população de Sumaré mudou entre os Censos",
 "Não é a renda média dos moradores"])assert.ok(publicIndicators.includes(phrase));

/* PIB per capita em linguagem clara no site e nos dados publicados. */
{
 const id="pib-per-capita-2023";
 const definition="Valor gerado pela produção de bens e serviços em Sumaré, dividido pelo número de habitantes.";
 for(const path of ["data/catalog.json","site/data/catalog.json",
                   "data/processed/indicators.json","site/data/indicators.json"]){
   const record=JSON.parse(fs.readFileSync(path,"utf8")).indicators.find(x=>x.id===id);
   assert.equal(record.definition,definition,path);
   if(path==="data/processed/indicators.json"){
     assert.equal(sandbox.localizedForTest(record).definition,definition);
     assert.equal(record.value,68060.93);
   }
 }
 assert.match(fs.readFileSync("site/index.html","utf8"),/não é o salário médio nem mostra como a renda é distribuída/);
}

/* Regressão editorial: o PIB inicial deve mostrar a fonte correta sem JS. */
for (const [page, source] of [
  ["site/index.html", "Fonte: IBGE · PIB dos Municípios 2023"],
  ["site/en/index.html", "Source: IBGE · Municipal GDP 2023"]
]) {
  const html = fs.readFileSync(page, "utf8");
  for (const id of ["pib-municipal-2023", "pib-per-capita-2023"]) {
    const match = html.match(new RegExp('<article class="metric" data-indicator="' + id + '">([\\s\\S]*?)<\\/article>'));
    assert.ok(match, page + ": missing PIB " + id);
    assert.ok(match[1].includes(source), page + ": PIB initial source is wrong");
    assert.doesNotMatch(match[1], /Censo 2022/);
  }
}
/* Navegação compacta e filtros acessíveis no celular, também nas subpáginas. */
assert.match(fs.readFileSync("site/assets/css/styles.css","utf8"),
  /@media \(max-width: 800px\) \{\s*\.nav-inner \{\s*flex-wrap: wrap;/);
assert.match(fs.readFileSync("site/assets/css/biblioteca.css","utf8"),
  /\.library-topics \{ flex-wrap: nowrap; overflow-x: auto;/);
assert.match(fs.readFileSync("site/assets/css/empresas.css","utf8"),
  /\.empresas-numbers \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);


/* Regressoes: textos de validacao, fonte consultada e PIB sem Javascript. */
{
 const validos=JSON.parse(fs.readFileSync("site/data/indicators.json","utf8")).indicators;
 for(const id of ["saldo-vinculos-formais","estoque-vinculos-formais","saldo-vinculos-formais-2026-08"]){
   const item=validos.find(v=>v.id===id);
   assert.equal(item?.status,"validated",id);
   assert.match(item.source.institution,/Prefeitura Municipal de Sumaré/);
 }
 for(const [page,label] of [
   ["site/index.html","Fonte: IBGE · PIB dos Municípios 2023"],
   ["site/en/index.html","Source: IBGE · Municipal GDP 2023"]
 ]){
   const html=fs.readFileSync(page,"utf8");
   const econ=html.slice(html.indexOf('<section class="tab" hidden="" id="economia"'),
                         html.indexOf('<section class="tab" hidden="" id="empresas"'));
   assert.equal(econ.split(label).length-1,2,page+": PIB correto antes do JS");
   assert.doesNotMatch(econ,/Censo 2022|2022 Census/);
   const methodology=html.slice(html.indexOf('<section class="tab" hidden="" id="metodologia"'),
                                html.indexOf('<section class="tab" hidden="" id="sobre"'));
   assert.match(methodology,/sumare-lidera-saldo-de-empregos/);
   assert.match(methodology,/rais-2025-tabelas\.xlsx/);
   assert.doesNotMatch(methodology,/Esses números ainda estão sendo conferidos|Indicators remain unverified|Dados não conferidos na fonte original/);
 }
 assert.doesNotMatch(code,/Fonte primária|Consultar fonte original|subject to verification of its release/);
}


/* Semântica dos títulos dos indicadores, sem alterações dos dados ou da navegação. */
for(const path of ["site/index.html","site/en/index.html"]){
 const html=fs.readFileSync(path,"utf8");
 assert.equal((html.match(/<p class="metric-title">/g)||[]).length,23,path+": 23 indicadores");
 assert.doesNotMatch(html,/<label\b|<\/label>/i,path+": label não associado a formulário");
 assert.doesNotMatch(html,/data-company-filter(?:s)?/);
 assert.match(html,/data-company-list/);
}
const metricCss=fs.readFileSync("site/assets/css/styles.css","utf8");
assert.match(metricCss,/\.metric \.metric-title\{display:block;margin:0\}/);
assert.doesNotMatch(metricCss,/\.metric label/);

/* Metadados OG por página, sem UTM e com URL canônica. */
for(const [path,url,locale] of [
 ["site/index.html","https://oesumare.github.io/","pt_BR"],
 ["site/en/index.html","https://oesumare.github.io/en/index.html","en_US"],
 ["site/biblioteca.html","https://oesumare.github.io/biblioteca.html","pt_BR"],
 ["site/governanca.html","https://oesumare.github.io/governanca.html","pt_BR"],
 ["site/en/governanca.html","https://oesumare.github.io/en/governanca.html","en_US"]
]){
 const html=fs.readFileSync(path,"utf8");
 const head=html.slice(0,html.indexOf("</head>"));
 assert.ok(head.includes('<link rel="canonical" href="'+url+'">'),path);
 assert.ok(head.includes('<meta property="og:url" content="'+url+'">'),path);
 assert.ok(head.includes('<meta property="og:locale" content="'+locale+'">'),path);
 for(const field of ["og:type","og:title","og:description","og:site_name"])
   assert.ok(head.includes('property="'+field+'"'),path+": "+field);
 assert.ok(head.includes('<meta name="twitter:card" content="summary">'),path);
 assert.ok(!head.includes("utm_source="),path);
}
assert.match(fs.readFileSync("site/en/index.html","utf8"),/href="\.\.\/biblioteca\.html" title="Library in Portuguese"/);

/* Descoberta do menu móvel: todos os templates compartilham uma única lógica. */
for(const [path,prefix] of [
  ["site/index.html","assets/"],
  ["site/en/index.html","../assets/"],
  ["site/biblioteca.html","assets/"],
  ["site/governanca.html","assets/"],
  ["site/en/governanca.html","../assets/"]
]){
  const head=fs.readFileSync(path,"utf8").split("</head>")[0];
  assert.ok(head.includes('<script src="'+prefix+'js/nav-scroll-cue.js" defer></script>'),path);
}
const navCueCode=fs.readFileSync("site/assets/js/nav-scroll-cue.js","utf8");
const navCss=fs.readFileSync("site/assets/css/styles.css","utf8");
assert.match(navCss,/\.nav-shell\.nav-more-right::after/);
{
  const states=new Map(),handlers={};
  const shell={classList:{toggle(name,on){states.set(name,on);}}};
  const menu={scrollWidth:950,clientWidth:320,scrollLeft:0,
    addEventListener(name,handler){handlers[name]=handler;}};
  const doc={querySelector(selector){return selector===".nav-inner"?menu:shell;}};
  const win={addEventListener(name,handler){handlers[name]=handler;}};
  vm.runInNewContext(navCueCode,{document:doc,window:win});
  assert.equal(states.get("nav-more-right"),true);
  menu.scrollLeft=630; handlers.scroll();
  assert.equal(states.get("nav-more-right"),false);
  menu.scrollWidth=320;menu.scrollLeft=0;handlers.resize();
  assert.equal(states.get("nav-more-right"),false);
}


/* Consistência editorial das grades e leitura mobile, sem alterar dados/estrutura. */
{
 const mainCss=fs.readFileSync("site/assets/css/styles.css","utf8");
 const mapCss=fs.readFileSync("site/assets/css/mapa.css","utf8");
 const businessCss=fs.readFileSync("site/assets/css/empresas.css","utf8");
 const libraryCss=fs.readFileSync("site/assets/css/biblioteca.css","utf8");
 assert.match(mainCss,/\.metrics--two \.metric:nth-child\(odd\)\{padding-left:0\}/);
 assert.match(mainCss,/\.metrics--two \.metric:nth-child\(even\)\{padding-right:0;border-right:0\}/);
 assert.match(mainCss,/\.metrics--two \.metric:last-child:nth-child\(odd\)\{grid-column:1\/-1;border-right:0\}/);
 assert.match(mainCss,/\.metrics--two \.metric:first-child \{ border-top: 1px solid var\(--line\); \}/);
 assert.match(mainCss,/\.tab section > \.section-title h2 \{ font-size: clamp/);
 assert.match(mainCss,/\.institutional-block\{padding: 18px 0\}/);
 assert.match(mapCss,/#populacao \.populacao-indicadores \.metric \.metric-title \{ font-size: 12px/);
 assert.doesNotMatch(mapCss,/\.metric label\b/);
 assert.match(businessCss,/\.empresas-numbers>div\{display:flex;flex-direction:column/);
 assert.match(businessCss,/margin-top:auto;padding-top:10px;font-variant-numeric/);
 assert.match(businessCss,/\.empresas-bar-label\{white-space:normal/);
 assert.match(libraryCss,/\.library-topic-button \{ min-height: 40px; \}/);
 for (const page of ["site/index.html","site/en/index.html"]) {
   const html=fs.readFileSync(page,"utf8");
   assert.ok(html.includes('class="metrics metrics--two"'),page+": grade de indicadores preservada");
   assert.ok(html.includes('data-mapa-svg'),page+": mapa preservado");
   assert.ok(html.includes('data-cempre-bars'),page+": gráfico de empresas preservado");
 }
}


/* Clareza editorial sem remover fontes e critérios institucionais. */
for(const [path,companySubtitle,analysis,glossaryTerm] of [
  ["site/index.html","<span>Sem ranking</span>","Ainda não há análises do OES publicadas.","Em “Saiba mais”"],
  ["site/en/index.html","<span>Not ranked</span>","No OES research or analysis has been published yet.","Select “Learn more”"]
]){
  const html=fs.readFileSync(path,"utf8");
  assert.ok(html.includes(companySubtitle),path+": indicação de ausência de ranking");
  assert.ok(html.includes(analysis),path+": indicação de conteúdo não publicado");
  assert.ok(html.includes(glossaryTerm),path+": fonte acessível no glossário");
  assert.ok(html.includes('class="institutional-grid"'),path+": missão e visão preservadas");
  assert.ok(html.includes('class="glossary" id="glossary"'),path+": glossário preservado");
}

/* Hero editorial sem ponto final e sem contador redundante de empresas. */
for(const [page,heading] of [
 ["site/index.html","Conhecer a cidade começa pelos dados"],
 ["site/en/index.html","Understanding a city begins with data"]
]){
 const html=fs.readFileSync(page,"utf8");
 assert.ok(html.includes("<h1>"+heading+"</h1>"),page+": título principal");
 assert.doesNotMatch(html,/data-company-count/);
 assert.match(html,/data-company-status/);
 assert.match(html,/data-company-list/);
}
assert.doesNotMatch(fs.readFileSync("site/assets/js/empresas.js","utf8"),/data-company-count|count\.textContent/);


/* Distribuição etária: link público legível e API original preservada nas evidências. */
for (const [page,heading,warning] of [
  ["site/index.html","Moradores por faixa etária","Selecione uma barra para destacar"],
  ["site/en/index.html","Population by age group","Select a bar to highlight it"]
]) {
  const html=fs.readFileSync(page,"utf8");
  assert.ok(html.includes(heading),page);
  assert.ok(html.includes('href="https://sidra.ibge.gov.br/tabela/9514"'),page+": consulta legível do SIDRA");
  assert.doesNotMatch(html,/<p class="age-intro">/);
  assert.ok(!html.includes(warning),page+": instrução redundante");
  assert.match(html,/2\.699 pessoas|2,699 people/);
}
const ageSource=JSON.parse(fs.readFileSync("site/data/faixas-etarias-2022.json","utf8"));
assert.equal(ageSource.source.url,"https://apisidra.ibge.gov.br/values/t/9514/n6/3552403/p/2022/v/93/c2/6794/c287/all/c286/113635?formato=json");
assert.doesNotMatch(fs.readFileSync("site/assets/css/idades.css","utf8"),/\.age-intro/);


/* A hierarquia explica diferenças sem misturar amostras, datas ou séries. */
for(const [page,headings] of [
 ["site/index.html",["Empregos nos estabelecimentos da cidade","Trabalho dos moradores","Rendimentos do trabalho","Outros dados econômicos","Empresas com atuação documentada"]],
 ["site/en/index.html",["Jobs at workplaces in Sumaré","Residents and employment","Earnings from work","Other economic data","Companies with documented operations"]]
]){
 const html=fs.readFileSync(page,"utf8");
 const work=html.slice(html.indexOf('id="trabalho" role="region"'),html.indexOf('id="economia" role="region"'));
 const economy=html.slice(html.indexOf('id="economia" role="region"'),html.indexOf('id="empresas" role="region"'));
 for (const heading of headings) assert.ok(html.includes(heading),page+": "+heading);
 assert.equal((work.match(/class="metrics metrics--two"/g)||[]).length,3,page+": work groups");
 assert.equal((work.match(/class="metrics metrics--sectors"/g)||[]).length,1,page+": sector list visible");
 assert.doesNotMatch(work,/<details><summary>(?:Ver vínculos por setor|Employment links by sector)/);
 assert.ok(work.indexOf('class="sector-breakdown"')<work.indexOf('Trabalho dos moradores') ||
   work.indexOf('class="sector-breakdown"')<work.indexOf('Residents and employment'),page+": sectors near RAIS");
 assert.equal((work.match(/data-indicator="/g)||[]).length,15,page+": validated work values unchanged");
 assert.equal((economy.match(/data-indicator="/g)||[]).length,2,page+": GDP indicators unchanged");
 assert.ok(economy.includes('href="#empresas"'),page+": related evidence link");
 assert.ok(html.includes('href="https://sidra.ibge.gov.br/tabela/9528"'),page+": public CEMPRE table");
 const sources=html.slice(html.indexOf('id="metodologia" role="region"'),html.indexOf('id="sobre" role="region"'));
 assert.equal((sources.match(/class="source"/g)||[]).length,5,page+": five official datasets");
 for(const table of ["5938","9528"])
   assert.ok(sources.includes('href="https://sidra.ibge.gov.br/tabela/'+table+'"'),page+": SIDRA source "+table);
 assert.ok(sources.includes("MTE"),page+": differentiated original and republication");
}
assert.match(fs.readFileSync("site/assets/css/styles.css","utf8"),/\.tab \.data-subheading\{/);
/* Metadados apontam ao domínio canônico que os leitores recebem. */
for(const page of ["site/index.html","site/en/index.html","site/biblioteca.html","site/governanca.html","site/en/governanca.html"]){
 const head=fs.readFileSync(page,"utf8").split("</head>")[0];
 assert.doesNotMatch(head,/oes-sumare-beta\.vercel\.app/);
}


/* Links institucionais e evidências locais devem permanecer distintos. */
{
 const companyData=JSON.parse(fs.readFileSync("site/data/empresas.json","utf8"));
 assert.equal(companyData.companies.length,5);
 for(const company of companyData.companies){
   assert.equal(new URL(company.website).protocol,"https:");
   assert.equal(new URL(company.source.url).protocol,"https:");
   assert.notEqual(company.website,company.source.url,company.name+": site e evidência são diferentes");
 }
 const js=fs.readFileSync("site/assets/js/empresas.js","utf8");
 for(const phrase of ["company.website","company.source.url","Site oficial","Fonte sobre Sumaré","Official website","Sumaré evidence"])
   assert.ok(js.includes(phrase),phrase);
 for(const page of ["site/governanca.html","site/en/governanca.html"])
   assert.doesNotMatch(fs.readFileSync(page,"utf8"),/não representa as instituições em que ela estudou ou trabalhou|does not represent institutions where she studied or worked/);
}


/* RAIS: barras proporcionais aos valores oficiais, uma única ficha no grupo. */
for (const page of ["site/index.html","site/en/index.html"]) {
  const html = fs.readFileSync(page,"utf8");
  const sector = html.match(/<section class="sector-breakdown"[\s\S]*?<\/section>/)?.[0];
  assert.ok(sector,page+": distribuição RAIS visível");
  assert.equal((sector.match(/class="sector-track"/g)||[]).length,5);
  assert.equal((sector.match(/class="sector-fill"/g)||[]).length,5);
  assert.equal((sector.match(/data-indicator="/g)||[]).length,5);
  assert.equal((sector.match(/data-rais-method/g)||[]).length,1);
  assert.doesNotMatch(sector,/<div class="origin">|<details>/);
}
const raisCss=fs.readFileSync("site/assets/css/styles.css","utf8");
assert.match(raisCss,/\.metrics--sectors \.sector-track/);
assert.match(raisCss,/\.metrics--sectors \.sector-fill/);

/* RAIS usa o mesmo padrão editorial das barras CEMPRE: sem caixa externa. */
assert.match(raisCss,/#trabalho \.metrics--sectors\{[^}]*border:0;background:transparent;box-shadow:none/);
assert.match(raisCss,/#trabalho \.metrics--sectors \.metric\{[^}]*border:0;background:transparent/);
assert.match(raisCss,/#trabalho \.metrics--sectors \.metric \.number\{[^}]*font:500 14px\/1\.4/);
assert.match(raisCss,/#trabalho \.metrics--sectors \.sector-fill\{[^}]*background:#536d82/);
assert.match(raisCss,/@media\(max-width:720px\)/);
for(const [path,oldPhrase,newPhrase] of [
 ["site/index.html","Barras proporcionais ao maior setor","RAIS 2025 · empregos registrados"],
 ["site/en/index.html","Bar lengths are relative to the largest sector","RAIS 2025 · employment recorded"]
]){
 const html=fs.readFileSync(path,"utf8");
 const block=html.match(/<section class="sector-breakdown"[\s\S]*?<\/section>/)?.[0]||"";
 assert.ok(block.includes(newPhrase),path+": contexto da RAIS");
 assert.ok(!block.includes(oldPhrase),path+": instrução decorativa removida");
}

const sectorNumber={textContent:"",classList:{add(){}}};
const sectorFill={style:{}};
sandbox.renderForTest(
 {id:"rais-vinculos-industria-2025",value:18383,unit:"vínculos"},
 new Map([["rais-vinculos-industria-2025",[{
   querySelector(selector){
     return selector===".number"?sectorNumber:selector===".sector-fill"?sectorFill:null;
   }
 }]]]),
 35137
);
assert.equal(sectorNumber.textContent,"18.383");
assert.equal(sectorFill.style.width,"52.3%");
assert.match(code,/sourceButton.addEventListener\("click", \(\) => openIndicatorDetail\(rais\)\)/);
