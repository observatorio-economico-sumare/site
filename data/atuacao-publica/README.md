# Histórico de atuação pública de Sumaré

Uma única base canônica: [base_unica.json](base_unica.json).

**Em construção. Consulta em 27/10/2026.** Escopo: os 21 vereadores atuais e Henrique do Paraíso, incluindo seus cargos anteriores. Não inclui todos os antigos ocupantes nem todos os candidatos de 2026.

| Conteúdo | Situação |
|---|---|
| Pessoas | 22 |
| Registros detalhados municipais por pessoa | 2.211 |
| Consultas reconciliadas | 31 de 46 |
| Consultas incompletas | 15 |
| Produção federal | 6 proposições de tipos distintos |

## Organização da base

- `pessoas`, `cargos`, `legislaturas`: identificação e trajetória; datas não comprovadas permanecem pendentes.
- `documentos`: documentos por sistema + ID oficial; relacionados sem detalhe têm marcação própria.
- `vinculos_pessoa_documento`: autoria cadastrada por pessoa e cargo; não significa autoria exclusiva.
- `vinculos_projeto_lei`: ligação explícita encontrada no sistema oficial.
- `registros_listas_cadastro`: listagens de projetos e leis dos vereadores, com fonte de cada linha.
- `fontes_consulta_por_registro`: origem da consulta de cada detalhe municipal.
- `contagens_anuais_cadastro`: números do cadastro, separados dos detalhes recuperados.
- `cobertura_consultas`: esperado, extraído, situação e URL por pessoa e tipo.
- `resumo`: contagens dos detalhes recuperados, **parciais**, com cobertura identificada.
- `metodologia`: critérios e limitações.

## Leitura dos dados

31 consultas reconciliadas significa que a quantidade recuperada coincide com o total daquela consulta no Siscam. Não certifica a carreira integral. As outras 15 têm paginação incompleta após interrupção de acesso. Não interpretar ausência como zero; não calcular rankings ou taxas de conversão nesta versão.

Lei ordinária é uma norma, distinta do projeto. Projeto aprovado não comprova publicação de lei; norma publicada não comprova execução ou impacto. O vínculo projeto–lei exige referência explícita, sem correspondência presumida por título. Coautoria pode vincular um documento a várias pessoas; não somar vínculos como documentos distintos.

Partidos são os informados no cadastro consultado, sem certificação de filiação eleitoral atual. Fim em 2028 é previsto. Legislatura não comprova exercício ininterrupto. Indicações e requerimentos têm contagens cadastrais, mas seus documentos individuais ainda não foram integralmente coletados. Fontes institucionais biográficas comprovam informação declarada, sem certificar entregas de gestão.

Fontes primárias: Siscam/Câmara Municipal de Sumaré, Diário Oficial municipal e Câmara dos Deputados. URLs específicas estão na base. Esta pasta guarda dados para pesquisa; não adiciona página ao site.
