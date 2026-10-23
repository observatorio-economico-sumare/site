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
- MTE/RAIS 2025, INEP Sinopses da Educação Básica e Portal da Transparência
  de Sumaré: verificação de páginas institucionais **apenas**. A extração
  de arquivos de salários por setor, matrículas e servidores não está implementada.

## Manutenção técnica

- O coletor utiliza diretamente `apisidra.ibge.gov.br`, que respondeu nas execuções
  anteriores; removemos chamadas redundantes ao endpoint que expirava.
- Evidências brutas são mantidas em artifacts temporários e em pacote de
  pesquisa preservado separadamente; **não são versionadas na branch do site**.
- Arquivos temporários e CSVs candidatos não entram em `data/processed/`.
- Limpeza futura não deve apagar históricos de revisão ou evidências originais.

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
