# Política de auditoria e rastreabilidade do OES

## Indicadores
Cada registro precisa de: ID, conceito, unidade, município IBGE 3552403, período de referência, valor, instituição e base oficial, URL HTTPS, identificador da consulta, coleta/atualização/revisão, método, limitações, revisões e prova de origem com SHA-256.

## Controles
- `scripts/pipeline.py` confere catálogo, município, números finitos, status `validated`, método, datas, URLs, arquivo da evidência, SHA-256 e correspondência do valor/período com a evidência.
- A comparação é feita antes de qualquer escrita em `site/data/indicators.json`. Atualização falha não altera a última versão válida.
- `tests/test_pipeline.py` cobre adulteração de valores, ausência de campos, SHA inválido e preservação da versão anterior.
- Git registra diferenças de código, valores e documentação; `.github/workflows/audit.yml` testa o repositório a cada alteração.
- Alterações posteriores devem justificar o que mudou, quando e por qual publicação da fonte. Corrigir dados no Git, nunca apagar o histórico sem motivo.
- Base original, consulta e script devem ser arquivados quando disponíveis, com licença e tamanho compatíveis com Git.

## Evidência nesta etapa
O arquivo `data/raw/ibge_cidades_sumare_2026-10-23.json` registra **transcrição assistida de uma página oficial**, e não a captura do arquivo bruto original do IBGE. Esse arquivo preserva os valores, a URL, o período e o hash do registro local; **não comprova por si só a integridade ou versão histórica da página remota**. O identificador da consulta é descritivo, pois a página Cidades e Estados não fornece o código de uma tabela SIDRA para os cartões exibidos.

Os dois indicadores populacionais foram conferidos na página do IBGE em 23/10/2026. O campo `reviewed_by` informa que a revisão foi assistida, sem revisão humana independente. A contagem censitária (2022) e a estimativa (2026) representam métodos distintos. Outros indicadores seguem pendentes.

Fonte primária: https://www.ibge.gov.br/cidades-e-estados/sp/sumare.html

Metodologia da estimativa: https://www.ibge.gov.br/estatisticas/sociais/populacao/9103-estimativas-de-population.html

## Política de revisão
1. Preservar a versão publicada até aprovar a substituição.
2. Documentar divergência, consulta, explicação e data de correção.
3. Publicar a correção com registro Git rastreável.
4. Se fonte ou interpretação não for reproduzível, não classificar o novo valor como validado.
