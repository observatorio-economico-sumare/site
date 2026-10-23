"use strict";

/* Texto didático do OES; termos e IDs originais permanecem estáveis para os links existentes. */
/* As referências oficiais embasam as explicações, não substituem as definições das pesquisas. */
const glossaryEntries = {
  "Vínculo formal": {
    "pt": {
      "title": "Vínculo formal",
      "short": "É uma relação de trabalho registrada oficialmente. Uma pessoa pode ter mais de um vínculo, portanto o número de vínculos não representa necessariamente o número de trabalhadores.",
      "detail": "No Novo CAGED, os vínculos são associados ao local do estabelecimento empregador. Uma pessoa pode trabalhar em Sumaré e morar em outra cidade. O indicador não equivale ao total de moradores empregados."
    },
    "en": {
      "title": "Formal employment relationship",
      "short": "An officially recorded employment relationship. One person can hold multiple jobs, so the number of employment relationships does not necessarily equal the number of workers.",
      "detail": "In Novo CAGED, employment relationships are assigned to the employer's establishment. Someone may work in Sumaré but live elsewhere. This measure does not equal the number of employed residents."
    },
    "source": {
      "pt": "Ministério do Trabalho e Emprego · Novo CAGED",
      "en": "Ministry of Labour and Employment · Novo CAGED",
      "url": "https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo/2026/setembro/novo-caged-emprego-formal-gera-165-8-mil-vagas-em-agosto-e-acumula-1-13-milhao-de-postos-no-ano/"
    }
  },
  "Pessoa ocupada": {
    "pt": {
      "title": "Pessoa ocupada",
      "short": "Pessoa que estava trabalhando ou temporariamente afastada do trabalho no período pesquisado, conforme os critérios do IBGE. Inclui diferentes formas de trabalho, não apenas empregos com carteira assinada.",
      "detail": "Na PNAD Contínua, a definição inclui quem trabalhou pelo menos uma hora na semana de referência, em atividades previstas na pesquisa, e algumas situações de afastamento temporário. Os critérios exatos podem variar entre pesquisas, inclusive no Censo."
    },
    "en": {
      "title": "Employed person",
      "short": "Someone who was working or temporarily absent from work during the survey's reference period, under IBGE rules. This includes different kinds of work, not only registered employment.",
      "detail": "In the Continuous PNAD survey, this includes people who worked for at least one hour in the reference week under the survey's criteria, as well as some temporary absences. Exact criteria may differ between surveys, including the Census."
    },
    "source": {
      "pt": "IBGE · Glossário estatístico (PNAD Contínua)",
      "en": "IBGE · Statistical glossary (Continuous PNAD)",
      "url": "https://anuario.ibge.gov.br/2024/glossario-2024.html"
    }
  },
  "Pessoa desocupada": {
    "pt": {
      "title": "Pessoa desocupada",
      "short": "Pessoa sem trabalho que procurou uma ocupação e estava disponível para trabalhar, conforme os critérios da pesquisa. Nem toda pessoa sem emprego é classificada como desocupada.",
      "detail": "O IBGE considera o período de procura e a disponibilidade para assumir trabalho. Existem situações específicas, como pessoas que já conseguiram trabalho para começar em breve. A classificação depende da pesquisa e de sua referência temporal."
    },
    "en": {
      "title": "Unemployed person",
      "short": "Someone without work who sought employment and was available to start, under the survey's rules. Not everyone without a job is classified as unemployed.",
      "detail": "IBGE considers the job-search period and availability to start work. Specific cases exist, including people who have already secured a job that will start soon. Classification depends on the survey and its reference period."
    },
    "source": {
      "pt": "IBGE · Glossário estatístico (PNAD Contínua)",
      "en": "IBGE · Statistical glossary (Continuous PNAD)",
      "url": "https://anuario.ibge.gov.br/2024/glossario-2024.html"
    }
  },
  "CLT": {
    "pt": {
      "title": "CLT",
      "short": "Sigla para Consolidação das Leis do Trabalho. É o conjunto de regras que regulamenta a contratação de empregados nesse regime, geralmente com carteira assinada.",
      "detail": "O regime CLT não abrange todas as formas de trabalho: trabalhadores autônomos e servidores estatutários, por exemplo, seguem regras diferentes. Não se deve confundir emprego celetista com total de pessoas ocupadas."
    },
    "en": {
      "title": "CLT employment",
      "short": "Brazil's Consolidation of Labour Laws, the framework governing employees hired under this legal regime, usually with a signed employment record.",
      "detail": "CLT does not cover every form of work. Self-employed workers and statutory public servants, for example, follow different rules. CLT employment is not equivalent to total employment."
    },
    "source": {
      "pt": "Presidência da República · Decreto-Lei nº 5.452/1943",
      "en": "Brazilian Federal Government · Decree-Law No. 5,452/1943",
      "url": "https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452compilado.htm"
    }
  },
  "MEI": {
    "pt": {
      "title": "MEI (Microempreendedor Individual)",
      "short": "Pessoa que formalizou um pequeno negócio nessa categoria. Ser MEI não significa trabalhar exclusivamente por conta própria: o titular também pode ter emprego com carteira assinada.",
      "detail": "MEI é uma categoria de registro empresarial e não uma categoria estatística equivalente a todos os trabalhadores autônomos. O registro permite identificar negócios formalizados, mas não autoriza somar automaticamente seus titulares ao número de trabalhadores sem conferir possíveis sobreposições."
    },
    "en": {
      "title": "Individual Microentrepreneur (MEI)",
      "short": "A person who has formally registered a small business in Brazil's MEI category. An MEI owner may also have a job under the CLT regime.",
      "detail": "MEI is a business-registration category, not a statistical category covering all self-employed workers. MEI registrations cannot simply be added to worker counts without checking for overlap."
    },
    "source": {
      "pt": "Portal do Empreendedor (gov.br) · Perguntas frequentes",
      "en": "Brazilian Entrepreneur Portal (gov.br) · FAQ",
      "url": "https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/perguntas-frequentes"
    }
  },
  "Conta própria": {
    "pt": {
      "title": "Trabalhador por conta própria",
      "short": "Pessoa que trabalha em sua própria atividade ou negócio, sem empregar trabalhadores assalariados nessa atividade. Pode ou não possuir CNPJ.",
      "detail": "O conceito estatístico se refere à posição da pessoa no trabalho, não à existência de um cadastro empresarial. Por isso, nem todo trabalhador por conta própria é MEI, e ser MEI não basta para classificá-lo como trabalhador por conta própria."
    },
    "en": {
      "title": "Self-employed worker",
      "short": "Someone who operates their own business or works independently without paid employees in that activity. They may or may not have a registered company.",
      "detail": "This statistical classification concerns a person's position in their work, not whether they hold a business registration. Not every self-employed worker is an MEI, and having an MEI registration does not by itself establish the classification."
    },
    "source": {
      "pt": "IBGE · Glossário estatístico",
      "en": "IBGE · Statistical glossary",
      "url": "https://anuario.ibge.gov.br/2024/glossario-2024.html"
    }
  },
  "Saldo de empregos": {
    "pt": {
      "title": "Saldo de empregos",
      "short": "Diferença entre admissões e desligamentos em determinado período. Se as contratações superam os desligamentos, o saldo é positivo.",
      "detail": "O saldo mostra a variação líquida dos vínculos formais, não o total de empregos existentes. Pode ser divulgado para um mês ou para um período acumulado e está sujeito às atualizações da fonte."
    },
    "en": {
      "title": "Net change in employment",
      "short": "The difference between hires and separations in a given period. The balance is positive when hires exceed separations.",
      "detail": "The balance measures the net change in formal employment relationships, not the total number of existing jobs. It may refer to a month or a cumulative period and may be revised by the source."
    },
    "source": {
      "pt": "Ministério do Trabalho e Emprego · Novo CAGED",
      "en": "Ministry of Labour and Employment · Novo CAGED",
      "url": "https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo/2026/setembro/novo-caged-emprego-formal-gera-165-8-mil-vagas-em-agosto-e-acumula-1-13-milhao-de-postos-no-ano/"
    }
  },
  "Rendimento médio": {
    "pt": {
      "title": "Rendimento médio",
      "short": "Média dos rendimentos das pessoas incluídas na pesquisa. Não significa que todas recebam esse valor.",
      "detail": "A média é calculada somando os rendimentos e dividindo pelo número de pessoas consideradas. Pode diferir muito da mediana e é sensível a rendas altas. É fundamental conferir o grupo pesquisado, a unidade, o período e o tipo de rendimento."
    },
    "en": {
      "title": "Average earnings",
      "short": "The average earnings of the people included in a survey. It does not mean everyone earns that amount.",
      "detail": "The mean is calculated by dividing total earnings by the number of people included. It can differ substantially from the median and is affected by very high incomes. Always check the population, unit, period and income definition."
    },
    "source": {
      "pt": "IBGE · Glossário estatístico",
      "en": "IBGE · Statistical glossary",
      "url": "https://anuario.ibge.gov.br/2024/glossario-2024.html"
    }
  },
  "Servidor público": {
    "pt": {
      "title": "Servidor público",
      "short": "Pessoa que atua na administração pública sob vínculo definido pela legislação. As estatísticas podem distinguir servidores estatutários, empregados públicos e temporários.",
      "detail": "O trabalho no setor público inclui diferentes regimes, como estatutário, celetista e contratações temporárias. O alcance do termo “servidor público” varia com a base consultada. Ao comparar ou somar dados, é preciso confirmar quais categorias estão incluídas."
    },
    "en": {
      "title": "Public-sector worker",
      "short": "Someone working in public administration under a legally defined employment arrangement. Statistics may distinguish statutory officials, public employees and temporary workers.",
      "detail": "Public-sector work includes statutory, CLT and temporary arrangements. The meaning of 'public servant' varies by data source. Before comparing or adding totals, check which categories are included."
    },
    "source": {
      "pt": "Ministério da Previdência · Regimes de contratação pública",
      "en": "Brazilian Ministry of Social Security · Public-sector employment regimes",
      "url": "https://www.gov.br/previdencia/pt-br/assuntos/rpps/julgamentos/julgamentos-stf/adi-2135-regime-juridico-unico-na-administracao-publica"
    }
  }
};
const appEnglish = document.documentElement?.lang === "en";
const glossaryLanguage = appEnglish ? "en" : "pt";
const termDialog = document.getElementById("termDialog");
const termTitle = document.getElementById("termTitle");
const termText = document.getElementById("termText");
const termDetails = document.getElementById("termDetails");
const termSource = document.getElementById("termSource");

function showTerm(term) {
  const entry = glossaryEntries[term];
  if (!entry) return;
  const localized = entry[glossaryLanguage];
  termTitle.textContent = localized.title;
  termText.textContent = localized.short;
  termDetails.textContent = localized.detail;
  termSource.textContent = entry.source[glossaryLanguage];
  termSource.href = entry.source.url;
  termDialog.showModal();
}

const glossary = document.getElementById("glossary");
for (const [key, entry] of Object.entries(glossaryEntries)) {
  const localized = entry[glossaryLanguage];
  const wrapper = document.createElement("div");
  wrapper.className = "term";
  const heading = document.createElement("b");
  heading.textContent = localized.title;
  const summary = document.createElement("p");
  summary.textContent = localized.short;
  const details = document.createElement("button");
  details.type = "button";
  details.className = "term-action";
  details.textContent = appEnglish ? "Learn more" : "Saiba mais";
  details.setAttribute("aria-label",
    (appEnglish ? "Learn more about " : "Saiba mais sobre ") + localized.title);
  details.addEventListener("click", () => showTerm(key));
  wrapper.append(heading, summary, details);
  glossary.append(wrapper);
}

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
  const selectedTab = hashTab === "glossario" ? "metodologia" :
    validTabs.has(hashTab) ? hashTab : "inicio";
  chooseTab(selectedTab, false);
  if (hashTab === "glossario") document.getElementById("glossario")?.scrollIntoView?.();
}

window.addEventListener("hashchange", showTabFromLocation);
showTabFromLocation();
