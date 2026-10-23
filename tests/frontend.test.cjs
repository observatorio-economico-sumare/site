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
vm.runInContext(code + "\nthis.formatForTest = formatIndicatorValue; this.dateForTest = formatRecordDate;", sandbox);
const value = sandbox.formatForTest;
const normalize = text => text.replace(/\u00a0/g, " ").replace(/\u202f/g, " ");

assert.equal(normalize(value({ value: 68060.93, unit: "R$" })), "R$ 68.060,93");
assert.equal(value({ value: 279545, unit: "pessoas" }), "279.545");
assert.equal(value({ value: 279545, unit: "pessoas" }, true), "279.545 pessoas");
assert.equal(value({ value: 77.9, unit: "%" }), "77,9%");
assert.equal(sandbox.dateForTest("2026-10-23"), "23/10/2026");
assert.equal(sandbox.dateForTest("não informado"), "não informado");

console.log("Formatação dos indicadores e datas: OK");
