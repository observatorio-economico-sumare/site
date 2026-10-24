"use strict";
const indicatorsEnglish = document.documentElement?.lang === "en";
const DATA_URL = indicatorsEnglish ? "../data/indicators.json" : "data/indicators.json";
const enIndicatorText = {"populacao-censo-2022":{"name":"Resident population (2022 Census)","definition":"Total residents counted in the 2022 Census.","unit":"people","dataset":"Population Census","method":"The number of residents recorded in the 2022 Population Census, as displayed by IBGE for Sumaré.","limitations":"2022 census count. It is not the current population.","revisions":"First added on October 23, 2026; no subsequent OES revision recorded."},"populacao-estimada":{"name":"Estimated population","definition":"Official resident population estimate, subject to verification of its release and reference period.","unit":"people","dataset":"Population Estimates","method":"Official IBGE estimate for July 1, 2026, reproduced without additional calculations by the OES. IBGE's AiBi method applies.","limitations":"Statistical estimate, not a census count. Differences from the census must not automatically be interpreted as observed population growth.","revisions":"First added on October 23, 2026; no subsequent OES revision recorded."},"pib-per-capita-2023":{"name":"GDP per capita","definition":"Municipal gross domestic product divided by the reference population, at current prices.","unit":"R$","dataset":"Municipal GDP","method":"2023 current-price municipal GDP per capita, reproduced from IBGE's Sumaré page without additional calculation by the OES.","limitations":"Not a measure of average personal income or income distribution. The reference year is 2023, and the figure is not adjusted for inflation.","revisions":"First added on October 23, 2026; no subsequent OES revision recorded."},"crescimento-intercensitario-2010-2022":{"name":"Population growth between the 2010 and 2022 censuses","definition":"Cumulative percentage change in resident population between the 2010 and 2022 censuses.","unit":"%","dataset":"SES-SP municipal report / 2022 Census","method":"(279,545 / 241,311 - 1) × 100, rounded to four decimal places.","limitations":"Cumulative change over 12 years, not an annual rate or a current population estimate.","revisions":"Initial OES technical review on October 23, 2026; later changes tracked in Git."},"populacao-homens-2022":{"name":"Resident population - men","definition":"Census count of male residents.","unit":"people","dataset":"SES-SP municipal report / 2022 Census","method":"Count published in Table 1 of the SES-SP municipal report based on IBGE census data.","limitations":"Sex classification according to the census, not a measure of gender identity.","revisions":"Initial OES technical review on October 23, 2026; later changes tracked in Git."},"populacao-mulheres-2022":{"name":"Resident population - women","definition":"Census count of female residents.","unit":"people","dataset":"SES-SP municipal report / 2022 Census","method":"Count published in Table 1 of the SES-SP municipal report based on IBGE census data.","limitations":"Sex classification according to the census, not a measure of gender identity.","revisions":"Initial OES technical review on October 23, 2026; later changes tracked in Git."},"populacao-0-14-anos-2022":{"name":"Population aged 0–14","definition":"Number of residents aged 0 to 14 inclusive.","unit":"people","dataset":"SES-SP municipal report / 2022 Census","method":"Sum of age bands 0–4, 5–9 and 10–14 in Table 1 of the SES-SP report.","limitations":"An OES aggregate derived from the 2022 census age categories.","revisions":"Initial OES technical review on October 23, 2026; later changes tracked in Git."},"populacao-15-64-anos-2022":{"name":"Population aged 15–64","definition":"Number of residents aged 15 to 64 inclusive.","unit":"people","dataset":"SES-SP municipal report / 2022 Census","method":"Sum of ten five-year age groups, from 15–19 through 60–64.","limitations":"This age group is not the labor force or employed population.","revisions":"Initial OES technical review on October 23, 2026; later changes tracked in Git."},"populacao-65-mais-2022":{"name":"Population aged 65 and over","definition":"Number of residents aged 65 or over.","unit":"people","dataset":"SES-SP municipal report / 2022 Census","method":"Sum of census age bands from 65–69 through 100 and over.","limitations":"Uses a 65+ cutoff, not alternative definitions such as 60+.","revisions":"Initial OES technical review on October 23, 2026; later changes tracked in Git."},"taxa-alfabetizacao-15-mais-2022":{"name":"Literacy rate - population aged 15+","definition":"Share of residents aged 15 or over who can read and write a simple note.","unit":"%","dataset":"SES-SP municipal report / 2022 Census","method":"216,905 literate persons divided by 216,905 + 7,869, multiplied by 100 and rounded to one decimal place.","limitations":"Reproduced from IBGE figures in an SES-SP report; the original report file is not archived in the OES.","revisions":"Initial OES technical review on October 23, 2026; later changes tracked in Git."},"densidade-demografica-2022":{"name":"Population density - 2022 Census","definition":"Number of residents per square kilometer.","unit":"people/km²","dataset":"IBGE Cities and States","method":"Official density published by IBGE for Sumaré's 2022 Census, without mixing land-area reference years.","limitations":"Uses the land area applied in the 2022 Census publication.","revisions":"Initial OES technical review on October 23, 2026; later changes tracked in Git."},"residentes-conta-propria-2022":{"name":"Self-employed residents without employees","definition":"Residents aged 14 or over working on their own account, without employees, in the 2022 Census reference week.","unit":"people","dataset":"2022 Census","method":"SIDRA table 10261, variable 4090, occupation code 79378, municipality 3552403, all sexes and racial groups.","limitations":"Residents, not local jobs or unique legal entities; includes workers with and without registered businesses.","revisions":"Initial OES technical review on October 23, 2026; later changes tracked in Git."},"pib-municipal-2023":{"name":"Municipal GDP at current prices","definition":"Municipal gross domestic product at current prices, comprising gross value added and net taxes on products.","unit":"R$","dataset":"Municipal GDP","method":"SIDRA table 5938, variable 37; source value in thousands of reais multiplied by 1,000.","limitations":"Local output, not residents' personal income; nominal rather than inflation-adjusted.","revisions":"Initial OES technical review on October 23, 2026; later changes tracked in Git."}};
const enFieldLabels = {"Valor":"Value","Definição":"Definition","Período":"Reference year","Fonte primária":"Source","Metodologia":"Methodology","Limitações":"Limitations","Última atualização no OES":"Last updated by the OES","Consultar fonte original":"Original source","Fonte e metodologia":"Source and methodology","Ver ficha completa":"View indicator details","Endereço inválido":"Invalid URL","Não informado":"Not available"};
const localizeLabel = label => indicatorsEnglish ? (enFieldLabels[label] || label) : label;
function localizedIndicator(item) {
  if (!indicatorsEnglish || !enIndicatorText[item.id]) return item;
  const words = enIndicatorText[item.id];
  return {...item, name:words.name, definition:words.definition, unit:words.unit,
    method:words.method, limitations:words.limitations,
    source:{...item.source,dataset:words.dataset}};
}

const numberFormatter = new Intl.NumberFormat(indicatorsEnglish ? "en-US" : "pt-BR", { maximumFractionDigits: 2 });
const currencyFormatter = new Intl.NumberFormat(indicatorsEnglish ? "en-US" : "pt-BR", {
  style: "currency", currency: "BRL",
  minimumFractionDigits: 2, maximumFractionDigits: 2
});

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
  return indicatorsEnglish ? month + "/" + day + "/" + year : day + "/" + month + "/" + year;
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
      content.textContent = localizeLabel("Endereço inválido");
    }
  } else {
    content.textContent = String(value ?? localizeLabel("Não informado"));
  }
  row.append(label, content);
  parent.append(row);
}

function openIndicatorDetail(item) {
  const dialog = document.getElementById("sourceDialog");
  const localized = localizedIndicator(item);
  document.getElementById("sourceDialogTitle").textContent = localized.name;
  const body = document.getElementById("sourceDialogBody");
  body.replaceChildren();
  const list = document.createElement("dl");
  list.className = "indicator-detail";
  const info = [
    ["Valor", formatIndicatorValue(localized, true)],
    ["Definição", localized.definition],
    ["Período", item.reference_period],
    ["Fonte primária", item.source.institution + " · " + localized.source.dataset],
    ["Metodologia", localized.method],
    ["Limitações", localized.limitations],
    ["Última atualização no OES", formatRecordDate(item.updated_at)]
  ];
  for (const [key, value] of info) appendField(list, localizeLabel(key), value);
  appendField(list, localizeLabel("Consultar fonte original"),
    indicatorsEnglish ? "Open official source" : "Acessar fonte oficial", item.source.url);
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
    line.textContent = item.source.institution + " · " + item.reference_period;
    const detail = document.createElement("button");
    detail.type = "button";
    detail.className = "source-detail";
    detail.textContent = localizeLabel("Fonte e metodologia");
    detail.addEventListener("click", () => openIndicatorDetail(item));
    provenance.append(line, detail);
  }
}

async function renderIndicators() {
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
      name.textContent = localizedIndicator(item).name;
      const period = document.createElement("p");
      period.textContent = item.source.institution + " · " + item.reference_period +
        " · " + formatIndicatorValue(localizedIndicator(item), true);
      left.append(name, period);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "source-detail";
      button.textContent = localizeLabel("Ver ficha completa");
      button.addEventListener("click", () => openIndicatorDetail(item));
      row.append(left, button);
      list.append(row);
    });
    if (!payload.indicators.length) list.textContent = indicatorsEnglish ? "No indicators have been verified yet." : "Ainda não há indicadores certificados.";

  } catch (error) {
    console.error("OES: não foi possível carregar os indicadores.", error);
    list.textContent = indicatorsEnglish ? "Indicators are unavailable. Unverified values are not shown." : "Indicadores indisponíveis nesta consulta. Os valores não validados não são exibidos.";
    document.querySelectorAll("[data-indicator]").forEach(card => {
      const number = card.querySelector(".number");
      if (number) number.textContent = indicatorsEnglish ? "Unavailable" : "Indisponível";
    });
  }
}
document.getElementById("closeSourceDialog").addEventListener("click", () =>
  document.getElementById("sourceDialog").close());
renderIndicators();
