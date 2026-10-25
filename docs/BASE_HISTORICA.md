# Base histórica do OES

**Status:** base de pesquisa preparada para revisão; não integrada ao site.
**Extração desta etapa:** 25/10/2026.

Os valores e metadados normalizados estão em [`data/historico/series.json`](../data/historico/series.json). As respostas brutas das consultas SIDRA e os arquivos originais baixados nesta etapa ficam em `data/raw/historico/`. Registros que já estavam validados foram reaproveitados e mantêm a referência ao arquivo de evidência existente.

## Cobertura

| Tema | Indicador | Anos cobertos | Fonte e observação |
|---|---|---:|---|
| População | Estimativa residente | 2001–2026, com lacunas | SIDRA 6579 até 2024; estimativas IBGE 2025 e 2026 em fontes próprias. Os anos sem resposta permanecem ausentes. |
| População | População censitária | 2010 e 2022 | 2010 reaproveitado do registro SES-SP já usado pelo OES; 2022 reaproveitado do IBGE Cidades. |
| Empresas | Unidades locais ativas do CEMPRE | 2006; 2007–2021; 2022–2024 | SIDRA 6450 até 2021 e SIDRA 9528 a partir de 2022. Os intervalos não devem ser apresentados como uma série contínua comparável. |
| Economia | PIB municipal a preços correntes | 2002–2023 | SIDRA 5938, unidade original mantida: mil reais. Valores nominais, sem deflator. |
| Trabalho | Vínculos formais RAIS por setor e total | 2023–2025 | Tabela 4 da planilha original RAIS 2025. Estoque em 31 de dezembro por estabelecimento. |
| Trabalho | Pessoas ocupadas e desocupadas | 2022 | Censo Demográfico, dados já validados e preservados nos arquivos SIDRA existentes. Pessoas residentes, não vínculos por estabelecimento. |
| Trabalho | Estoque e saldo Novo CAGED | ago/2026; jan–ago/2026 | Boletim municipal já registrado. É um retrato pontual e um acumulado, sem série mensal completa nesta base. |
| Renda | Rendimento médio e mediano do trabalho | 2022 | Censo Demográfico, registros validados já existentes. Não há série municipal anual contínua preparada. |

## Quebras, divergências e lacunas

- **CEMPRE:** o IBGE declara que os dados de 2022 em diante não são comparáveis aos de 2007–2021, devido à mudança metodológica e à incorporação de estabelecimentos ativos do CNPJ. O critério também foi ajustado a partir de 2019 durante a substituição gradativa da RAIS pelo eSocial. O ano de 2006 fica isolado porque a metodologia de unidades ativas foi reformulada na divulgação de 2007. Os valores anteriores foram preservados, sem encadear a variação de 2021 para 2022. Fonte: [página e notas técnicas do CEMPRE/IBGE](https://www.ibge.gov.br/estatisticas/economicas/servicos/9016-estatisticas-do-cadastro-central-de-empresas.html).
- **CEMPRE 2024:** 12.746 unidades locais, igual ao registro já validado em `data/processed/empresas_cempre_2024.json`. A conferência não alterou esse arquivo.
- **PIB 2023:** SIDRA informa 19.026.093 mil reais. Convertido apenas para conferência de escala, equivale a R$ 19.026.093.000, igual ao registro já validado em `data/processed/indicators.json`. A base histórica conserva a unidade original da tabela: mil reais.
- **RAIS:** os valores de 2023–2025 foram lidos da planilha original preservada e conferem com a transcrição existente em `data/raw/rais_2025_sumare_tabela4_2026-10-23.json`. Nenhuma divergência foi encontrada.
- **População:** a consulta à tabela SIDRA 6579 não retornou observações para 2007, 2010, 2022 e 2023. Os censos de 2010 e 2022 e as estimativas de 2025 e 2026 estão registrados como pontos separados, com suas próprias fontes. O IBGE alerta que a série de estimativas deve ser comparada considerando as revisões das projeções e as bases censitárias; não se interpolaram lacunas.
- **Renda:** os pontos de 2022 foram reaproveitados. A cobertura de outros Censos e a comparabilidade de conceitos ainda precisam ser avaliadas antes de ampliar essa série.
- **Trabalho:** a RAIS mede vínculos em estabelecimentos; o Censo mede pessoas residentes. O estoque RAIS não deve ser somado ao Novo CAGED nem comparado como se tivesse o mesmo universo. A coleta de salário médio municipal por setor permanece pendente.

Não foram encontrados valores anteriores divergentes que justificassem alterar registros validados. O único salto metodológico claramente identificado nesta etapa é o do CEMPRE em 2022, documentado acima.

## Arquivos preparados

- `data/historico/series.json` — base normalizada com 23 séries e metadados por fonte, unidade, período, arquivo bruto, data de extração e limitações.
- `data/raw/historico/ibge_sidra_6579_populacao_2001-2024.json` — resposta original da tabela SIDRA 6579.
- `data/raw/historico/ibge_sidra_6450_cempre_2006-2021.json` e `data/raw/historico/ibge_sidra_9528_cempre_2022-2024.json` — respostas originais das tabelas do CEMPRE.
- `data/raw/historico/ibge_sidra_5938_pib_2002-2023.json` — resposta original da série anual do PIB municipal.
- `data/raw/historico/ibge_estimativa_populacao_2025.xls` — arquivo original de estimativas municipais do IBGE.
- `data/raw/historico/mte_rais_2025_tabelas.xlsx` — planilha original da RAIS que contém os anos 2023–2025.

As observações extraídas diretamente nesta etapa incluem SHA-256 no JSON. Os arquivos brutos são evidência; `series.json` é a camada de leitura, não uma nova fonte. Atualizações devem preservar as versões anteriores e registrar qualquer revisão antes de substituir valores.
