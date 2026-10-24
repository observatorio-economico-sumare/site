"use strict";
(() => {
  const root = document.querySelector("[data-empresas]");
  if (!root) return;
  const english = document.documentElement.lang === "en";
  const lang = english ? "en" : "pt";
  const list = root.querySelector("[data-company-list]");
  const filters = root.querySelector("[data-company-filters]");
  const filterPanel = root.querySelector("[data-company-filter]");
  let selectedSector = "";
  const count = root.querySelector("[data-company-count]");
  const status = root.querySelector("[data-company-status]");

  const el = (tag, className, content) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content) node.textContent = content;
    return node;
  };
  const validSource = value => {
    try { return new URL(value).protocol === "https:"; } catch { return false; }
  };
  const render = companies => {
    const matching = companies.filter(c => !selectedSector || c.sector.pt === selectedSector);
    const fragment = document.createDocumentFragment();
    for (const company of matching) {
      const article = el("article", "empresa-entry");
      const sector = el("p", "empresa-sector", company.sector[lang]);
      const title = el("h3", "", company.name);
      const activity = el("p", "", company.activity[lang]);
      const presence = el("p", "", company.presence[lang]);
      article.append(sector, title, activity, presence);
      if (validSource(company.source.url)) {
        const link = el("a", "", english ? "Official source ↗" : "Fonte original ↗");
        link.href = company.source.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        article.append(link);
      }
      fragment.append(article);
    }
    list.replaceChildren(fragment);
    count.textContent = english ? `${matching.length} documented ${matching.length === 1 ? "company" : "companies"}` : `${matching.length} ${matching.length === 1 ? "empresa documentada" : "empresas documentadas"}`;
  };

  const dataUrl = english ? "../data/empresas.json" : "data/empresas.json";
  fetch(dataUrl)
    .then(response => { if (!response.ok) throw new Error("HTTP " + response.status); return response.json(); })
    .then(data => {
      const companies = data.companies;
      if (!Array.isArray(companies) || companies.some(c =>
        !c.id || !c.name || !c.sector?.[lang] || !c.activity?.[lang] ||
        !c.presence?.[lang] || !validSource(c.source?.url))) throw new Error("Invalid company data");
      companies.sort((a,b) => a.name.localeCompare(b.name, lang));
      const sectors = new Map(companies.map(c => [c.sector.pt, c.sector[lang]]));
      const options = [["", english ? "All industries" : "Todas as atividades"],
        ...[...sectors].sort((a,b) => a[1].localeCompare(b[1], lang))];
      const buttons = options.map(([key, label]) => {
        const button = el("button", "empresa-filter-button", label);
        button.type = "button";
        button.dataset.sector = key;
        button.setAttribute("aria-pressed", String(key === selectedSector));
        button.addEventListener("click", () => {
          selectedSector = key;
          for (const item of buttons) {
            item.setAttribute("aria-pressed", String(item.dataset.sector === selectedSector));
          }
          render(companies);
        });
        return button;
      });
      filters.replaceChildren(...buttons);
      filterPanel.hidden = false;
      status.hidden = true;
      render(companies);
    })
    .catch(() => { status.textContent = english ? "Company records are temporarily unavailable." : "Não foi possível carregar as empresas agora."; });
})();
