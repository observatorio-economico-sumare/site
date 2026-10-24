"use strict";
(() => {
  const root = document.querySelector("[data-empresas]");
  if (!root) return;
  const english = document.documentElement.lang === "en";
  const lang = english ? "en" : "pt";
  const list = root.querySelector("[data-company-list]");
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
    const fragment = document.createDocumentFragment();
    for (const company of companies) {
      const article = el("article", "empresa-entry");
      const sector = el("p", "empresa-sector", company.sector[lang]);
      const title = el("h3", "", company.name);
      const activity = el("p", "", company.activity[lang]);
      const presence = el("p", "", company.presence[lang]);
      article.append(sector, title, activity, presence);
      const links = el("div", "empresa-links");
      for (const [url, label] of [
        [company.website, english ? "Official website ↗" : "Site oficial ↗"],
        [company.source.url, english ? "Sumaré evidence ↗" : "Fonte sobre Sumaré ↗"]
      ]) {
        const link = el("a", "", label);
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        links.append(link);
      }
      article.append(links);
      fragment.append(article);
    }
    list.replaceChildren(fragment);
  };

  const dataUrl = english ? "../data/empresas.json" : "data/empresas.json";
  fetch(dataUrl)
    .then(response => { if (!response.ok) throw new Error("HTTP " + response.status); return response.json(); })
    .then(data => {
      const companies = data.companies;
      if (!Array.isArray(companies) || companies.some(c =>
        !c.id || !c.name || !c.sector?.[lang] || !c.activity?.[lang] ||
        !c.presence?.[lang] || !validSource(c.source?.url) || !validSource(c.website))) throw new Error("Invalid company data");
      companies.sort((a,b) => a.name.localeCompare(b.name, lang));
      status.hidden = true;
      render(companies);
    })
    .catch(() => { status.textContent = english ? "Company records are temporarily unavailable." : "Não foi possível carregar as empresas agora."; });
})();
