"use strict";
/* Indicadores públicos: HTML inicial permanece neutro até o JSON ser verificado. */
const DATA_URL = "data/indicators.json";

function appendField(parent, title, value, url) {
  const row = document.createElement("div");
  row.className = "data-detail";
  const label = document.createElement("dt");
  label.textContent = title;
  const content = document.createElement("dd");
  if (url && typeof value === "string") {
    let address;
    try { address = new URL(url); } catch { address = null; }
    if (address && address.protocol === "https:") {
      const link = document.createElement("a");
      link.href = address.href;
      link.rel = "noopener noreferrer";
      link.target = "_blank";
      link.textContent = value;
      content.append(link);
    } else {
      content.textContent = "Endereço inválido";
    }
  } else {
    content.textContent = String(value ?? "Não informado");
  }
  row.append(label, content);
  parent.append(row);
}

function openIndicatorDetail(item) {
  const dialog = document.getElementById("sourceDialog");
  document.getElementById("sourceDialogTitle").textContent = item.name;
  const body = document.getElementById("sourceDialogBody");
  body.replaceChildren();
  const list = document.createElement("dl");
  list.className = "indicator-detail";
  const info = [
    ["Valor", new Intl.NumberFormat("pt-BR").format(item.value) + " " + item.unit],
    ["Definição", item.definition],
    ["Município", "Sumaré (SP), IBGE " + item.municipality_code],
    ["Período", item.reference_period],
    ["Fonte primária", item.source.institution + " · " + item.source.dataset],
    ["Identificador da consulta", item.source.query_id],
    ["Metodologia", item.method],
    ["Limitações", item.limitations],
    ["Coleta pelo OES", item.collected_at],
    ["Última atualização no OES", item.updated_at],
    ["Revisão técnica", item.reviewed_at + " · " + item.reviewed_by],
    ["Histórico de revisões", item.revisions],
    ["Evidência", item.evidence.raw_path],
    ["SHA-256 da evidência", item.evidence.sha256],
    ["Natureza da evidência", "Transcrição estruturada do conteúdo oficial; não é download original da base"]
  ];
  for (const [key, value] of info) appendField(list, key, value);
  appendField(list, "Endereço da fonte", item.source.url, item.source.url);
  body.append(list);
  dialog.showModal();
}

function validDisplayItem(value) {
  return value && typeof value.id === "string" &&
    typeof value.value === "number" && Number.isFinite(value.value) &&
    value.status === "validated" && value.source &&
    typeof value.source.url === "string" && value.source.url.startsWith("https://") &&
    typeof value.reference_period === "string" &&
    typeof value.unit === "string" &&
    value.evidence && typeof value.evidence.sha256 === "string";
}

function renderItem(item) {
  document.querySelectorAll("[data-indicator]").forEach(card => {
    if (card.dataset.indicator !== item.id) return;
    const number = card.querySelector(".number");
    const provenance = card.querySelector(".origin");
    if (!number || !provenance) return;
    number.textContent = new Intl.NumberFormat("pt-BR").format(item.value);
    number.classList.add("number--verified");
    provenance.replaceChildren();
    const line = document.createElement("span");
    line.textContent = item.source.institution + " · " + item.reference_period + " · atualizado no OES em " + item.updated_at;
    const detail = document.createElement("button");
    detail.type = "button";
    detail.className = "source-detail";
    detail.textContent = "Fonte e metodologia";
    detail.addEventListener("click", () => openIndicatorDetail(item));
    provenance.append(line, detail);
  });
}

async function renderIndicators() {
  const status = document.getElementById("updateState");
  const list = document.getElementById("indicator-sources");
  try {
    const result = await fetch(DATA_URL, {cache: "no-store"});
    if (!result.ok) throw new Error("JSON indisponível");
    const payload = await result.json();
    if (!payload || !Array.isArray(payload.indicators) ||
        !payload.indicators.every(validDisplayItem)) {
      throw new Error("Estrutura de dados inválida");
    }
    list.replaceChildren();
    payload.indicators.forEach(item => {
      renderItem(item);
      const row = document.createElement("div");
      row.className = "source source--catalog";
      const left = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = item.name;
      const period = document.createElement("p");
      period.textContent = item.source.institution + " · " + item.reference_period +
        " · " + new Intl.NumberFormat("pt-BR").format(item.value) + " " + item.unit;
      left.append(name, period);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "source-detail";
      button.textContent = "Ver ficha completa";
      button.addEventListener("click", () => openIndicatorDetail(item));
      row.append(left, button);
      list.append(row);
    });
    if (!payload.indicators.length) list.textContent = "Ainda não há indicadores certificados.";
    if (status) status.textContent = payload.indicators.length +
      " indicadores com fonte e documentação disponíveis. Os demais seguem em validação.";
  } catch (error) {
    console.error("OES: não foi possível carregar os indicadores.", error);
    list.textContent = "Indicadores indisponíveis nesta consulta. Os valores não validados não são exibidos.";
    if (status) status.textContent = "Falha ao consultar os dados publicados. Nenhum valor foi presumido.";
  }
}
document.getElementById("closeSourceDialog").addEventListener("click", () =>
  document.getElementById("sourceDialog").close());
renderIndicators();
