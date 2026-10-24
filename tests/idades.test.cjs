"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const data = JSON.parse(fs.readFileSync("site/data/faixas-etarias-2022.json", "utf8"));
assert.deepEqual(data.bands.map(x => x.label),
  ["0-14","15-24","25-34","35-44","45-54","55-64","65+"]);
assert.equal(data.bands.reduce((total, row) => total + row.value, 0), 279545);
const js = fs.readFileSync("site/assets/js/idades.js","utf8");
new vm.Script(js);
assert.match(js,/aria-pressed/);
assert.match(js,/data\.bands\.reduce/);
assert.match(js,/age-fill/);
for (const [page, prefix] of [["site/index.html",""],["site/en/index.html","../"]]) {
  const html = fs.readFileSync(page,"utf8");
  assert.equal(html.split('data-age-chart').length-1,1,page+": gráfico duplicado");
  assert.ok(html.includes('href="'+prefix+'assets/css/idades.css"'));
  assert.ok(html.includes('src="'+prefix+'assets/js/idades.js"'));
  const ages = html.indexOf('data-age-chart');
  const map = html.indexOf('class="mapa-section"');
  const education = html.indexOf('class="populacao-educacao"');
  assert.ok(map < ages && ages < education,page+": ordem das seções");
  assert.ok(html.includes("https://sidra.ibge.gov.br/tabela/9514"),page+": consulta pública legível");
}
console.log("Faixas etárias: visualização PT/EN, dados e acessibilidade OK");
