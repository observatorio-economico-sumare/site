"use strict";

const definitions={'Vínculo formal':'Registro de uma relação de trabalho formal contabilizada na base administrativa utilizada. Neste painel, o dado se refere ao local do estabelecimento, não necessariamente ao município de residência do trabalhador.','Pessoa ocupada':'Pessoa que exercia atividade remunerada ou outra atividade considerada trabalho segundo os critérios da pesquisa no período de referência.','Pessoa desocupada':'Pessoa sem trabalho que procurou uma ocupação e estava disponível para trabalhar, segundo os critérios da pesquisa.','CLT':'Trabalhador contratado sob as regras da Consolidação das Leis do Trabalho. Empregos com carteira não são equivalentes ao total de pessoas ocupadas.','MEI':'Microempreendedor individual: modalidade de formalização de um pequeno negócio. Um mesmo titular também pode ter outra atividade profissional.','Conta própria':'Pessoa que trabalha explorando seu próprio negócio ou atividade, sem necessariamente possuir CNPJ.','Saldo de empregos':'Diferença entre admissões e desligamentos no período. Não corresponde à quantidade total de empregos existentes.','Rendimento médio':'Média dos rendimentos do grupo definido pela pesquisa. Não é o salário de cada pessoa nem representa necessariamente a renda mediana.','Servidor público':'Pessoa que trabalha no setor público, sob regime estatutário ou outra forma de contratação. As bases estatísticas podem classificar vínculos de maneiras distintas.'};

const termDialog = document.getElementById("termDialog");
const termTitle = document.getElementById("termTitle");
const termText = document.getElementById("termText");

function showTerm(term) {
  if (!Object.prototype.hasOwnProperty.call(definitions, term)) return;
  termTitle.textContent = term;
  termText.textContent = definitions[term];
  termDialog.showModal();
}

const glossary = document.getElementById("glossary");
for (const [term, meaning] of Object.entries(definitions)) {
  const wrapper = document.createElement("div");
  wrapper.className = "term";
  const heading = document.createElement("b");
  heading.textContent = term;
  const explanation = document.createElement("p");
  explanation.textContent = meaning;
  wrapper.append(heading, explanation);
  glossary.append(wrapper);
}

document.getElementById("sectors").textContent =
  "Distribuição setorial em validação na fonte original.";

document.querySelectorAll("[data-term]").forEach(button => {
  button.addEventListener("click", () => showTerm(button.dataset.term));
});
document.getElementById("closeDialog").addEventListener("click", () =>
  termDialog.close());

const navButtons = [...document.querySelectorAll('nav button[data-tab]')];
const tabPanels = [...document.querySelectorAll(".tab[role=tabpanel]")];
const validTabs = new Set(navButtons.map(button => button.dataset.tab));

navButtons.forEach((button, index) => {
  button.id = "tab-" + button.dataset.tab;
  button.setAttribute("aria-controls", button.dataset.tab);
  const panel = document.getElementById(button.dataset.tab);
  if (panel) panel.setAttribute("aria-labelledby", button.id);

  button.addEventListener("click", () => chooseTab(button.dataset.tab));
  button.addEventListener("keydown", event => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home" ? 0 :
      event.key === "End" ? navButtons.length - 1 :
      (index + (event.key === "ArrowRight" ? 1 : -1) +
       navButtons.length) % navButtons.length;
    navButtons[nextIndex].focus();
    chooseTab(navButtons[nextIndex].dataset.tab);
  });
});

function chooseTab(id, updateHash = true) {
  if (!validTabs.has(id)) return;
  navButtons.forEach(button => {
    const selected = button.dataset.tab === id;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  tabPanels.forEach(panel => {
    panel.hidden = panel.id !== id;
  });
  if (updateHash && location.hash !== "#" + id) {
    location.hash = id;
  }
}

function showTabFromLocation() {
  const hashTab = decodeURIComponent(location.hash.slice(1));
  chooseTab(validTabs.has(hashTab) ? hashTab : "inicio", false);
}

window.addEventListener("hashchange", showTabFromLocation);
showTabFromLocation();
