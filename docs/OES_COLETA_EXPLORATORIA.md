# OES | Coleta exploratória de dados oficiais

**Escopo:** pesquisa isolada; preserva apenas evidências agregadas na branch
de pesquisa, sem modificar arquivos de publicação nem consultar dados pessoais.

## Fontes efetivamente testadas

- IBGE/SIDRA tabela 10061, variável 2667, Censo 2022, município 3552403:
  escolaridade e conclusão do ensino médio.
- IBGE/SIDRA tabela 10261, variável 4090, Censo 2022, município 3552403:
  posição na ocupação, conta própria, trabalho sem carteira.
- IBGE/SIDRA tabela 5938, anos 2021 e 2023: valores de PIB e composição
  da atividade econômica. Cada variável exige revisão.
- MTE/RAIS 2025: total municipal de 75.421 vínculos formais e recorte por
  cinco setores conferidos em XLSX oficial; remuneração setorial não identificada.
- INEP 2025 e portal municipal: matrícula profissional e quadro de pessoal
  continuam sem extração agregada reproduzível.

## Manutenção técnica

- O coletor utiliza diretamente `apisidra.ibge.gov.br`, que respondeu nas execuções
  anteriores; removemos chamadas redundantes ao endpoint que expirava.
- Arquivos SIDRA usados nos candidatos de ocupação e PIB estão preservados
  em `data/raw/` **somente na branch de pesquisa**; outras extrações ficam
  em artefatos temporários e pacote histórico, sem duplicação no repositório.
- Arquivos temporários e CSVs candidatos não entram em `data/processed/`.
- Limpeza futura não deve apagar históricos de revisão ou evidências originais.

## Revisão documental complementar

- `data/raw/ses_sp_sumare_censo_2022_2026-10-23.json`: sete medidas
  conferidas nas páginas 12, 13 e 15 do PDF oficial da SES-SP, incluindo
  somas demográficas e crescimento intercensitário.
- `data/raw/ibge_cidades_adicionais_2026-10-23.json`: densidade e
  escolarização exibidas no IBGE Cidades e Estados.
- Os arquivos acima são transcrições auditáveis, **não** cópias do PDF ou do
  HTML original. A escolarização de 2022 permanece bloqueada: o cartão
  apresenta 2022, mas as notas da página ainda citam o Censo 2010.
- Das 11 propostas de pesquisa, 10 definições foram incorporadas ao catálogo
  exclusivamente na branch de pesquisa; a escolarização de 6–14 anos permanece
  bloqueada por conflito entre cartão (2022) e notas do IBGE (2010).
- Dois registros completos de SIDRA estão isolados em
  `data/review/sidra_candidates.json` com status `pending_review`.
  A aprovação editorial e os demais registros continuam pendentes.
- `data/processed/indicators.json` e `site/data/indicators.json` permanecem
  com os três indicadores anteriores. Nenhum valor foi publicado.
- Os dois arquivos originais `data/raw/sidra_10261_ocupacao_2022.json` e
  `data/raw/sidra_5938_pib_2023.json` passaram na verificação de SHA-256,
  seleção municipal e conversão de unidade. A revisão editorial continua pendente.
- O front-end em inglês traduz explicitamente apenas os três indicadores
  atuais; a apresentação bilíngue dos novos registros exigirá ajuste
  isolado do responsável pelo site, sem alterar a coleta de dados.

## Saída

Workflow da branch de pesquisa: OES | Coleta exploratória oficial.
Na página de execução: Artifacts > oes-evidencias-exploratorias.
Retenção dos arquivos: 14 dias.

- relatorio.json: consultas, erros, hashes e contagens.
- consultas.csv: tabela das requisições.
- raw/*.json: resposta JSON bruta das APIs oficiais, preservada com SHA-256.
- candidates/*.csv: linhas municipais, sem derivação nem validação.

## Restrições

1. Município: código IBGE 3552403.
2. Residente do Censo e vínculo por estabelecimento são universos diferentes.
3. Nada é publicado: validated=false, publication_allowed=false.
4. HTML de portais não é arquivado, para evitar retenção de dados pessoais.
5. Erros são registrados. Nenhum valor é simulado.
6. GitHub Actions sem permissão de escrita (contents: read).
7. Execução e artefatos ficam restritos à branch de pesquisa até revisão.

## Executar localmente

    python -m unittest discover -s tests -p test_oes_coleta.py -v
    python scripts/oes_coleta/coletar.py --output /tmp/oes-resultado

A coleta só estará completa quando cada indicador tiver a linha municipal
da fonte oficial, período, unidade e arquivo original verificável.
Este teste não substitui a auditoria posterior.
