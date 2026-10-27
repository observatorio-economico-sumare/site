# Quebras e comparabilidade da base histórica
Pesquisa: 27/10/2026. Escopo: séries presentes em `data/historico/series.json`. Documento interno; não integrado ao site. Nenhum valor foi alterado.

“Quebra” aqui significa descontinuidade da comparação no tempo. Não significa recorte por sexo, idade ou setor. Mudança de edição, lacuna e diferença de conceito não são, por si só, provas de quebra metodológica.

## Empresas: CEMPRE

- **2006 → 2007 | reformulação confirmada.** O IBGE reformulou a identificação das unidades ativas na divulgação de 2007. Conservar 2006 separado; não interpretar a diferença como abertura ou fechamento líquido de empresas.
- **2018 → 2019 | ajuste confirmado, não equiparar automaticamente à quebra de 2022.** A substituição gradual da RAIS pelo eSocial exigiu ajuste do critério de unidades ativas. A própria instituição ainda identifica 2007–2021 como série histórica. Os blocos separados no OES são uma cautela documental; não demonstram, isoladamente, impossibilidade absoluta de comparação em 2019.
- **2021 → 2022 | quebra explicitamente declarada.** A incorporação de estabelecimentos ativos do CNPJ e mudanças nas fontes e critérios de seleção alteraram a cobertura. O IBGE informa que 2022 em diante não mantém comparabilidade com 2007–2021. Não calcular crescimento entre os blocos.

Texto curto: “Em 2022, a cobertura e os critérios do levantamento mudaram. Os resultados não são diretamente comparáveis aos anos anteriores.”

Fonte: [IBGE, CEMPRE, notas técnicas e séries históricas](https://www.ibge.gov.br/estatisticas/economicas/servicos/9016-estatisticas-do-cadastro-central-de-empresas.html).

## Trabalho: RAIS

- **2021 → 2022 | quebra confirmada pelo MTE.** A entrada do Grupo 3 no eSocial ampliou a cobertura, incluindo vínculos preexistentes antes ausentes. A diferença de estoque mistura movimento do emprego e mudança de captação. Não apresentá-la integralmente como criação de empregos em Sumaré.
- **2022 → 2023 | transição de captação confirmada; efeito municipal ainda não quantificado.** Em 2022, o poder público ainda declarava pelo GDRAIS; a partir do ano-base 2023, todos os grupos passaram à extração do eSocial. Isso justifica cautela. A mudança de edição não basta para afirmar que toda comparação 2022–2023 é proibida.
- **2023–2025 | bloco da edição preservada.** Manter os dados tal como publicados. Comparações devem usar versões consistentes, observando eventuais revisões da fonte.

Texto curto: “A migração para o eSocial ampliou a cobertura em 2022. A variação frente a 2021 não representa apenas novos empregos.”

Fontes: [MTE, Nota Técnica RAIS 2022, especialmente seção 3](https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/acoes-e-programas/programas-projetos-acoes-obras-e-atividades/estatisticas-trabalho/rais/rais-2022/nota-tecnica-rais-2022.pdf); [portal RAIS](https://www.rais.gov.br/).

## População

**Estimativas e censos | diferença de operação e revisão de base.** Censo e estimativa anual não são a mesma medição. O IBGE exige considerar revisões das projeções e alterações territoriais para comparar estimativas. A passagem de uma estimativa anterior ao Censo 2022 a um resultado censitário não mede, isoladamente, aumento ou queda efetiva da população. A ausência de resposta na consulta SIDRA é lacuna da extração, não comprovação de inexistência de dado oficial.

**Território | alerta confirmado; aplicação aos valores antigos pendente.** Hortolândia foi desmembrada de Sumaré pela Lei Estadual 7.644, de 30/12/1991. É necessário verificar se cada tabela antiga usa limites da época ou território reconstituído. O número de 1991 registrado no OES não deve ser automaticamente classificado como incluindo Hortolândia. Não calcular crescimento de longo prazo até validar a base territorial dos pontos.

Textos curtos: “Censos e estimativas usam procedimentos diferentes. Revisões da base podem afetar a comparação.” / “Os limites municipais mudaram. Os dados antigos exigem conferência territorial.”

Fontes: [IBGE, Estimativas da População, notas técnicas](https://www.ibge.gov.br/estatisticas/sociais/populacao/9103-estimativas-de-populacao.html); [IBGE, histórico de Hortolândia](https://www.ibge.gov.br/biblioteca/visualizacao/dtb/saopaulo/hortolandia.pdf).

## Economia: PIB municipal

**1999–2002 antigo versus série atual | versões metodológicas distintas.** O registro antigo é uma publicação de 2005. A série atual é de referência 2010 e começa em 2002; “começa em 2002” não significa “ano-base 2002”. O IBGE também publicou uma série intermediária de referência 2002. A normalização do OES deve evitar confundir essas três versões. A divergência de 2002 já registrada é evidência de revisão, não de mudança econômica entre dois anos. Não emendar o bloco antigo à série atual.

**2022–2023 atual | ressalva oficial adicional.** O IBGE alerta para procedimentos específicos nesses anos e não divulga nessa edição a abertura setorial tradicional. Isso exige ressalva, sem declarar uma ruptura total de comparabilidade que a fonte não afirma.

Texto curto: “A série foi revisada metodologicamente. Valores de publicações antigas não devem ser unidos automaticamente aos atuais.”

Fontes: [IBGE, nova série de referência 2002](https://ftp.ibge.gov.br/Pib_Municipios/Notas_Metodologicas_Referencia_2002/PIBMun_novaserie.pdf); [IBGE, PIB dos Municípios, edição 2022–2023 e notas técnicas](https://www.ibge.gov.br/estatisticas/economicas/contas-nacionais/9088-produto-interno-bruto-dos-municipios.html).

## Renda e ocupação dos censos

**2000 versus 2022 | conceitos diferentes na seleção atual do OES.** A tabela 2927 preservada na base usa pessoas de 10 anos ou mais com rendimento do trabalho principal; os registros de renda de 2022 usam pessoas de 14 anos ou mais com rendimento de todos os trabalhos. Trata-se de incompatibilidade entre os indicadores selecionados, não de prova de que toda comparação entre censos seja impossível. Corrigir a inflação não resolve idade e abrangência distintas.

Texto curto: “Os indicadores usam faixas etárias e conceitos de rendimento diferentes; não permitem comparação direta.”

Fontes: [IBGE/SIDRA, tabela 2927](https://sidra.ibge.gov.br/tabela/2927), metadados preservados em `data/raw/historico/ibge_sidra_2927_renda_trabalho_2000.json`; [IBGE, Censo 2022, Trabalho e Rendimento](https://www.ibge.gov.br/estatisticas/sociais/populacao/22827-censo-demografico-2022.html?edicao=44663).

## Fontes de trabalho diferentes e lacunas

RAIS, Novo CAGED e Censo não são blocos substitutos de uma mesma série. O Censo da base conta residentes; a RAIS conta vínculos em estabelecimentos; os registros Novo CAGED preservados são um estoque mensal e saldos de períodos determinados. Não somar estoques nem usar a diferença RAIS–CAGED como criação de empregos. A base atual não contém série mensal completa do Novo CAGED.

As divergências populacionais de 1970 e 2010 já apontadas em `docs/BASE_HISTORICA.md` permanecem pendentes. Não são quebras metodológicas explicadas nesta pesquisa. Nenhuma observação foi substituída ou interpolada.

## Encaminhamento

Preservar os blocos existentes. Antes de exibir histórico: conferir território dos censos antigos; reconciliar divergências de população; detalhar notas das edições RAIS posteriores; identificar explicitamente a referência metodológica atual do PIB nos metadados. Os textos curtos acima são propostas para uso futuro, não conteúdo publicado.
