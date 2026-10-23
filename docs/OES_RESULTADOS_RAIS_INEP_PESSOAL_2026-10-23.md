# OES | RAIS, INEP e pessoal municipal — execução de 23/10/2026

**Estado:** evidência coletada para posterior auditoria. Nenhum indicador foi
publicado ou atualizado em data/processed e site/data.

[Execução do GitHub Actions](https://github.com/observatorio-economico-sumare/site/actions/runs/40037277893)

## RAIS 2025: arquivo original recuperado

- Fonte: Ministério do Trabalho e Emprego, **RAIS 2025 - Tabelas.xlsx**.
- URL: https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/acoes-e-programas/programas-projetos-acoes-obras-e-atividades/estatisticas-trabalho/rais/rais-2025/rais-2025-tabelas.xlsx
- SHA-256 dos bytes baixados: `b53279b80448e4b5545eee3192130215727d066c62dcce7e77337921ea14efff`.
- Tamanho do arquivo: 2.732.765 bytes.
- Aba `TABELA 4`, linha 3866: município `355240`, nome `Sumaré`.
- Sequência de totais da linha (2023/2024/2025):
  **70.984 / 73.410 / 75.421 vínculos**.
- Os cinco grupos de valores de 2025 somam 75.421, mas os rótulos setoriais
  precisam ser conferidos no cabeçalho da planilha antes de publicar a decomposição.
- **Esses totais são vínculos por estabelecimento, não trabalhadores residentes.**
- A tabela selecionada **não fornece salário médio por setor**. Essa pendência
  não está concluída.

## INEP 2025

- Link oficial descoberto:
  https://download.inep.gov.br/dados_abertos/sinopses_estatisticas/sinopse_estatistica_censo_escolar_2025.zip
- Download no GitHub Actions: `URLError: <urlopen error timed out>`.
- Resultado: **nenhuma linha municipal de matrículas recuperada**.
- Não confundir matrículas técnicas com total da educação básica.

## Servidores municipais

- Fonte: https://sumare.atende.net/transparencia/item/resumo-funcionario-por-regime
- Página acessível, mas sem link de exportação diretamente identificado no HTML.
- Não extrair nem armazenar informações individualizadas de servidores.
- Resultado: **contagem agregada ainda pendente**.

## Procedimento e limpeza técnica

- O workflow mantém somente relatórios e recortes agregados em artefato
  temporário, com retenção de 14 dias.
- Downloads grandes originais não são versionados no GitHub; hashes e URLs
  permitem rastrear a origem. Para auditoria permanente será necessária
  preservação controlada das evidências brutas.
- Nenhuma alteração na branch principal, no site, no catálogo de produção ou
  nos dados validados.
- Próxima validação: checar cabeçalhos da RAIS e cruzar com publicação do MTE
  antes de liberar o estoque de vínculos.
