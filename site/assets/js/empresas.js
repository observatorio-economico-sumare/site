"use strict";
(() => {
  const root = document.querySelector("[data-empresas]");
  if (!root) return;
  const english = document.documentElement.lang === "en";
  const lang = english ? "en" : "pt";
  const list = root.querySelector("[data-company-list]");
  const filter = root.querySelector("[data-company-sector]");
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
    const matching = companies.filter(c => !filter.value || c.id === filter.value);
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
      for (const company of companies) filter.append(el("option", "", company.name));
      [...filter.options].slice(1).forEach((option, index) => { option.value = companies[index].id; });
      filter.addEventListener("change", () => render(companies));
      status.hidden = true;
      render(companies);
    })
    .catch(() => { status.textContent = english ? "Company records are temporarily unavailable." : "Não foi possível carregar as empresas agora."; });
})();
