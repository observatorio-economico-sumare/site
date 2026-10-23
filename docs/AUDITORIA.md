# Política de rastreabilidade do OES

- Cada indicador tem ID estável, definição, unidade, período, município, instituição de origem, base, URL HTTPS e identificador de consulta.
- Valores só entram em data/processed/indicators.json com estado **validated**, revisor identificado, método, limitações e histórico de revisões.
- O arquivo bruto de origem deve estar em data/raw/; o SHA-256 informado no registro precisa corresponder ao arquivo.
- O programa scripts/pipeline.py valida todas as entradas antes de gerar site/data/indicators.json.
- Qualquer falha cancela a atualização, sem sobrescrever a última versão.
- Toda alteração relevante de dados ou metodologia deve ser explicada no commit ou no pull request.
- Correções públicas precisam indicar a versão anterior, a razão da correção e a nova fonte.
- Dados históricos devem ser preservados pelo Git e, quando houver limitações de tamanho, por checksums e arquivos oficiais recuperáveis.
- A lista inicial de indicadores é somente um catálogo, **não atesta valores ou fontes específicas**.
- Antes de disponibilizar um número, pesquisar a tabela original e conferir conceito, delimitação municipal, revisão e período.
