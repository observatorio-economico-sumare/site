# OES | Coleta exploratória de dados oficiais

**Escopo:** pesquisa isolada; não altera as bases do site, não faz commit de dados,
não executa validação de publicação e não consulta dados pessoais.

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
- Evidências brutas são mantidas em artifacts temporários e em pacote de
  pesquisa preservado separadamente; **não são versionadas na branch do site**.
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
- Todos os onze candidatos à integração continuam `pending_review`.
  O pipeline e os dados de produção não foram alterados nesta revisão.

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
