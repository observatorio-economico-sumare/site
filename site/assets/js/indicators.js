"use strict";
/* Indicadores públicos: HTML inicial permanece neutro até o JSON ser verificado. */
const DATA_URL = "data/indicators.json";

/* Instâncias reutilizadas para evitar recriá-las a cada cartão. */
const numberFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL",
  minimumFractionDigits: 2, maximumFractionDigits: 2
});

/* Formatação é determinada pela unidade oficial do indicador. */
function formatIndicatorValue(item, includeUnit = false) {
  const value = item.value;
  if (item.unit === "R$") {
    return currencyFormatter.format(value);
  }
  const number = numberFormatter.format(value);
  if (item.unit === "%") return number + "%";
  return includeUnit ? number + " " + item.unit : number;
}

function formatRecordDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [year, month, day] = value.split("-");
  return day + "/" + month + "/" + year;
}

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
    ["Valor", formatIndicatorValue(item, true)],
    ["Definição", item.definition],
    ["Município", "Sumaré (SP), IBGE " + item.municipality_code],
    ["Período", item.reference_period],
    ["Fonte primária", item.source.institution + " · " + item.source.dataset],
    ["Identificador da consulta", item.source.query_id],
    ["Metodologia", item.method],
    ["Limitações", item.limitations],
    ["Coleta pelo OES", formatRecordDate(item.collected_at)],
    ["Última atualização no OES", formatRecordDate(item.updated_at)],
    ["Revisão técnica", formatRecordDate(item.reviewed_at) + " · " + item.reviewed_by],
    ["Histórico de revisões", item.revisions],
    ["Evidência", item.evidence.raw_path],
    ["SHA-256 da evidência", item.evidence.sha256],
    ["Natureza da evidência", item.evidence.original_file_preserved === true ? "Arquivo original preservado" : "Registro estruturado da fonte, sem arquivo original preservado"]
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

/* Indexar o DOM uma só vez: evita varrer todos os cartões para cada indicador. */
function indexIndicatorCards() {
  const index = new Map();
  document.querySelectorAll("[data-indicator]").forEach(card => {
    const id = card.dataset.indicator;
    if (!index.has(id)) index.set(id, []);
    index.get(id).push(card);
  });
  return index;
}

function renderItem(item, cardsById) {
  for (const card of cardsById.get(item.id) || []) {
    const number = card.querySelector(".number");
    const provenance = card.querySelector(".origin");
    if (!number || !provenance) continue;
    number.textContent = formatIndicatorValue(item);
    number.classList.add("number--verified");
    provenance.replaceChildren();

    const line = document.createElement("span");
    line.textContent = item.source.institution + " · " + item.reference_period +
      " · atualizado no OES em " + formatRecordDate(item.updated_at);
    const detail = document.createElement("button");
    detail.type = "button";
    detail.className = "source-detail";
    detail.textContent = "Fonte e metodologia";
    detail.addEventListener("click", () => openIndicatorDetail(item));
    provenance.append(line, detail);
  }
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
    const cardsById = indexIndicatorCards();
    payload.indicators.forEach(item => {
      renderItem(item, cardsById);
      const row = document.createElement("div");
      row.className = "source source--catalog";
      const left = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = item.name;
      const period = document.createElement("p");
      period.textContent = item.source.institution + " · " + item.reference_period +
        " · " + formatIndicatorValue(item, true);
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
