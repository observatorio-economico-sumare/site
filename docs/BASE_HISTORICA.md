# Base histórica do OES

**Status:** base de pesquisa preparada para revisão; não integrada ao site.
**Última organização:** 26/10/2026.

Os valores e metadados normalizados estão em [`data/historico/series.json`](../data/historico/series.json). As respostas brutas das consultas SIDRA e os arquivos originais baixados nesta etapa ficam em `data/raw/historico/`. Registros que já estavam validados foram reaproveitados e mantêm a referência ao arquivo de evidência existente.

A organização e as regras de expansão estão em [`data/historico/README.md`](../data/historico/README.md). Os marcos de história local estão em [`data/historico/marcos.json`](../data/historico/marcos.json), separados dos indicadores quantitativos para não sugerir uma série numérica contínua desde a fundação.

## Cobertura

| Tema | Indicador | Anos cobertos | Fonte e observação |
|---|---|---:|---|
| População | Estimativa residente | 2001–2026, com lacunas | SIDRA 6579 até 2024; estimativas IBGE 2025 e 2026 em fontes próprias. Os anos sem resposta permanecem ausentes. |
| População | População censitária | 1960, 1980, 1991, 2000, 2010 e 2022 | Pontos de 1960, 1980, 1991 e 2000 acrescentados nesta etapa; 2010 reaproveitado do registro SES-SP já usado pelo OES, com divergência frente a tabela IBGE; 2022 é o Censo mais recente. 1970 segue pendente de reconciliação. |
| Empresas | Unidades locais ativas do CEMPRE | 2006; 2007–2021; 2022–2024 | SIDRA 6450 até 2021 e SIDRA 9528 a partir de 2022. Os intervalos não devem ser apresentados como uma série contínua comparável. |
| Economia | PIB municipal a preços correntes | 2002–2023 | SIDRA 5938, unidade original mantida: mil reais. Valores nominais, sem deflator. |
| Trabalho | Vínculos formais RAIS por setor e total | 2020–2021; 2022; 2023–2025 | 2020–2021 da tabela 4 da edição RAIS 2021; 2022 da tabela 4 da edição RAIS 2022; 2023–2025 da tabela 4 da edição RAIS 2025. Estoque em 31 de dezembro por estabelecimento; manter cada bloco separado pelas mudanças de edição e captação. |
| Trabalho | Pessoas ocupadas e desocupadas | 2022 | Censo Demográfico, dados já validados e preservados nos arquivos SIDRA existentes. Pessoas residentes, não vínculos por estabelecimento. |
| Trabalho | Pessoas ocupadas com rendimento no trabalho principal | 2000 | SIDRA 2927, população de 10 anos ou mais; conceito e universo próprios. Não se confunde com o Censo 2022 nem com vínculos RAIS. |
| Trabalho | Estoque e saldo Novo CAGED | ago/2026; jan–ago/2026 | Boletim municipal já registrado. É um retrato pontual e um acumulado, sem série mensal completa nesta base. |
| Renda | Rendimento médio e mediano do trabalho | 2000; 2022 | Censo 2000: trabalho principal, pessoas de 10 anos ou mais. Censo 2022: todos os trabalhos, pessoas de 14 anos ou mais. Pontos preservados em blocos separados; não comparar diretamente. Não há série municipal anual contínua preparada. |

## Quebras, divergências e lacunas

- **CEMPRE:** o IBGE declara que os dados de 2022 em diante não são comparáveis aos de 2007–2021, devido à mudança metodológica e à incorporação de estabelecimentos ativos do CNPJ. O critério também foi ajustado a partir de 2019 durante a substituição gradativa da RAIS pelo eSocial. O ano de 2006 fica isolado porque a metodologia de unidades ativas foi reformulada na divulgação de 2007. Os valores anteriores foram preservados, sem encadear a variação de 2021 para 2022. Fonte: [página e notas técnicas do CEMPRE/IBGE](https://www.ibge.gov.br/estatisticas/economicas/servicos/9016-estatisticas-do-cadastro-central-de-empresas.html).
- **CEMPRE 2024:** 12.746 unidades locais, igual ao registro já validado em `data/processed/empresas_cempre_2024.json`. A conferência não alterou esse arquivo.
- **PIB 2023:** SIDRA informa 19.026.093 mil reais. Convertido apenas para conferência de escala, equivale a R$ 19.026.093.000, igual ao registro já validado em `data/processed/indicators.json`. A base histórica conserva a unidade original da tabela: mil reais.
- **RAIS:** os valores de 2023–2025 foram lidos da planilha original preservada e conferem com a transcrição existente em `data/raw/rais_2025_sumare_tabela4_2026-10-23.json`. Nenhuma divergência foi encontrada. Os dados de 2020–2021 foram extraídos da tabela 4 da edição RAIS 2021. O ponto de 2022 foi extraído da tabela 4 da edição RAIS 2022; por mudanças de edição e captação (eSocial e GDRAIS), os blocos foram separados e não alteram os valores posteriores.
- **População:** a consulta à tabela SIDRA 6579 não retornou observações para 2007, 2010, 2022 e 2023. Os censos de 2010 e 2022 e as estimativas de 2025 e 2026 estão registrados como pontos separados, com suas próprias fontes. O IBGE alerta que a série de estimativas deve ser comparada considerando as revisões das projeções e as bases censitárias; não se interpolaram lacunas.
- **Renda:** os pontos de 2022 foram reaproveitados. O Censo 2000 acrescenta média e mediana do rendimento do trabalho principal, mas com universo etário de 10 anos ou mais; o Censo 2022 considera o rendimento de todos os trabalhos para pessoas de 14 anos ou mais. São blocos separados e não formam uma série diretamente comparável.
- **Trabalho:** a RAIS mede vínculos em estabelecimentos; o Censo mede pessoas residentes. O estoque RAIS não deve ser somado ao Novo CAGED nem comparado como se tivesse o mesmo universo. A coleta de salário médio municipal por setor permanece pendente.

Nenhum valor da série existente foi alterado. Na pesquisa de recuo histórico, foram encontradas divergências que precisam de reconciliação antes da inclusão de novos pontos ou da substituição de valores já validados:

- **População 2010:** a observação validada que o OES reaproveitou é 241.311 habitantes. Uma tabela oficial de resultados do Censo 2010 para São Paulo registra 241.437 para Sumaré (diferença de 126 pessoas). Manter 241.311 sem alteração até confirmar edição, data de referência e revisão de cada publicação. Fontes: [registro reaproveitado pelo OES](../data/raw/ses_sp_sumare_censo_2022_2026-10-23.json) e [tabela estadual do Censo 2010/IBGE](https://ftp.ibge.gov.br/Censos/Censo_Demografico_2010/resultados/tabelas_pdf/total_populacao_sao_paulo.pdf).
- **População 1970:** a tabela histórica do IBGE apresenta 23.054 habitantes; o Plano Diretor municipal, que atribui seus números aos Censos do IBGE, apresenta 23.074. Não incorporar até conferir a publicação censitária original e a definição territorial. Os pontos de 1960 (10.663, resultado preliminar), 1980 (101.851), 1991 (139.168) e 2000 (196.723) foram incorporados com fonte e ressalvas próprias. Os valores de 1980 e 1991 foram transcritos da tabela do Plano Diretor, que cita os Censos do IBGE; os endereços e hashes dos documentos originais foram registrados; os PDFs estaduais não foram adicionados ao Git para conter o tamanho do repositório. Não foram interpolados os anos ausentes. Fontes: [IBGE — resultados do Censo 1970](https://seculoxx.ibge.gov.br/images/seculoxx/arquivos_download/populacao/1971/populacao_m_1971aeb_017_a_043.pdf) e [Plano Diretor de Sumaré](https://www.sumare.sp.gov.br/plano_diretor/arquivos/mapVol1/VOLUME01COMPLETO.pdf).

O salto metodológico do CEMPRE em 2022 permanece documentado acima.

## Arquivos preparados

- `data/historico/series.json` — base normalizada com 23 séries e metadados por fonte, unidade, período, arquivo bruto, data de extração e limitações.
- `data/raw/historico/ibge_sidra_6579_populacao_2001-2024.json` — resposta original da tabela SIDRA 6579.
- `data/raw/historico/ibge_sidra_6450_cempre_2006-2021.json` e `data/raw/historico/ibge_sidra_9528_cempre_2022-2024.json` — respostas originais das tabelas do CEMPRE.
- `data/raw/historico/ibge_sidra_5938_pib_2002-2023.json` — resposta original da série anual do PIB municipal.
- `data/raw/historico/ibge_estimativa_populacao_2025.xls` — arquivo original de estimativas municipais do IBGE.
- `data/raw/historico/ibge_censo_1960_sumare.pdf`, `ibge_censo_1980_sumare.pdf`, `ibge_censo_1991_sp_sumare.pdf` e `ibge_censo_2010_sp_sumare.pdf` — publicações oficiais do IBGE consultadas para os pontos censitários. Os arquivos não foram copiados para o repositório para conter seu tamanho; os endereços oficiais e hashes SHA-256 dos documentos consultados estão registrados na base.
- `data/raw/historico/mte_rais_2025_tabelas.xlsx` — planilha original da RAIS que contém os anos 2023–2025.
- `data/raw/historico/ibge_sidra_2927_renda_trabalho_2000.json` — resposta bruta da tabela SIDRA 2927 para rendimento do trabalho principal e pessoas com rendimento, Censo 2000.
- `data/raw/historico/mte_rais_2020-2021_sumare_table4.json` — linha de Sumaré extraída da tabela 4 da RAIS 2021, com URL e hash da planilha oficial original.
- `data/raw/historico/mte_rais_2022_sumare_table4.json` — linha de Sumaré extraída da tabela 4 da RAIS 2022, com URL e hash da planilha oficial original. A edição de 2022 usa dados do eSocial e do GDRAIS; o ponto fica separado de 2023–2025.
- `data/historico/README.md` — estrutura, regras de expansão por indicador e política para arquivos de grande porte.
- `data/historico/marcos.json` — registro separado da data oficial de fundação da localidade (1868) e da criação legal do município (1953).

As observações extraídas diretamente nesta etapa incluem SHA-256 no JSON. Os arquivos brutos são evidência; `series.json` é a camada de leitura, não uma nova fonte. Atualizações devem preservar as versões anteriores e registrar qualquer revisão antes de substituir valores.

## Expansão planejada

O núcleo priorizado é completar a cobertura oficial disponível a partir de 2000. O recuo anterior será feito por indicador, sem exigir o mesmo ano inicial para todos:

| Tema | Pista de fonte anterior a 2000 | Situação para esta base |
|---|---|---|
| População | Censo de Sumaré em [1960](https://seculoxx.ibge.gov.br/images/seculoxx/arquivos_download/populacao/1961/populacao_m_1961aeb_01a24.pdf); estimativas municipais do IBGE desde [1975](https://www.ibge.gov.br/estatisticas/sociais/populacao/9103-estimativas-de-populacao.html). | Ainda não incorporados ao JSON histórico; há divergência de 1970 e uma diferença de publicação para 2010 registrada acima. Conferir geografia, edição e vintage antes de incluir. |
| Empresas | O [CEMPRE](https://www.ibge.gov.br/estatisticas/economicas/servicos/9016-estatisticas-do-cadastro-central-de-empresas.html) tem origem nos Censos Econômicos de 1985. | A existência do cadastro desde 1985 não confirma, por si só, valores anuais municipais publicados; manter 2006 como primeiro valor carregado até confirmar a cobertura de Sumaré. |
| Economia | A publicação oficial [PIB dos Municípios 1999–2002](https://biblioteca.ibge.gov.br/visualizacao/livros/liv62930.pdf) antecede a série atual com referência 2002. | Tratar a edição antiga como vintage distinto e comparar os anos sobrepostos antes de qualquer encadeamento. |
| Trabalho | O MTE disponibiliza [microdados da RAIS desde 1985](https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/acoes-e-programas/programas-projetos-acoes-obras-e-atividades/estatisticas-trabalho/comunicados/1651-07-07-2016-comunicado-mtb-205-16-novos-anos-bases-disponibilizados-em-txt-2). | Não carregar microdados nacionais; extrair apenas agregados de Sumaré e registrar alterações de classificação/cobertura. |
| Renda | Publicação do [Censo 1991 — mão de obra em São Paulo](https://biblioteca.ibge.gov.br/visualizacao/periodicos/79/cd_1991_n21_mao_de_obra_sp.pdf) inclui os municípios paulistas. | Trabalhar como pontos censitários, com conceito e universo documentados; confirmar as tabelas de rendimento de Sumaré antes de transcrever; não apresentar como série anual. |

A data histórica local adotada pela Prefeitura é 26/07/1868. A criação legal do município ocorreu em 1953. Portanto, a linha do tempo pode começar em 1868, enquanto os indicadores começam no primeiro registro verificável de cada fonte. Fontes e ressalvas desses marcos estão em `data/historico/marcos.json`.