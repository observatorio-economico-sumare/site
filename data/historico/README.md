# Organização da base histórica

Esta pasta guarda a camada histórica de pesquisa do OES. Ela não é importada pelo site e não altera os dados exibidos.

## Camadas

- `series.json`: observações quantitativas por indicador, com unidade, fonte, origem, extração e limitações. Cada série mantém seu próprio intervalo; quebras de metodologia ficam em séries distintas.
- `marcos.json`: eventos históricos documentados. Marcos narrativos não são convertidos em indicadores ou valores numéricos.
- `../raw/historico/`: respostas e arquivos oficiais originais preservados quando o tamanho e o formato permitem.
- `../../docs/BASE_HISTORICA.md`: cobertura, decisões, lacunas e revisões da base.

## Regras de inclusão

1. Manter primeiro o núcleo de dados que já está validado. Ampliar para anos anteriores indicador por indicador, usando a fonte oficial mais antiga que possa ser confirmada.
2. Registrar lacunas como lacunas. Não interpolar, projetar nem reconstruir valores sem uma fonte que os publique.
3. Não juntar séries que tenham universos, conceitos ou metodologias diferentes. Documentar a quebra e conservar as observações anteriores.
4. Reutilizar evidências do OES já validadas; pesquisar novamente apenas quando necessário para confirmar disponibilidade, revisão ou divergência.
5. Antes de trocar qualquer valor, comparar a nova extração com a observação existente e registrar a divergência em `docs/BASE_HISTORICA.md`.

## Tamanho e arquivos originais

Arquivos municipais agregados e tabelas oficiais pequenas podem ser versionados aqui. Não copiar microdados nacionais volumosos para o repositório: guardar a URL oficial, nome/versão do arquivo, data de extração, checksum quando disponível e o recorte agregado de Sumaré. Arquivos individuais acima de 50 MiB devem ser avaliados antes de entrar no Git; acima de 100 MiB não cabem em Git comum no GitHub.

## Horizonte temporal

- **Núcleo:** completar e documentar os dados oficiais disponíveis a partir de 2000.
- **Recuo por indicador:** acrescentar anos anteriores quando a fonte municipal e a comparabilidade forem confirmadas. Não é necessário que todos os indicadores comecem no mesmo ano.
- **História da cidade:** documentar marcos desde 1868 em `marcos.json`. A data de fundação da localidade não implica que existam estatísticas anuais desde esse ano; antes da autonomia municipal, os limites e a unidade administrativa podem ser diferentes.

Manter `series.json` como arquivo único enquanto continuar pequeno e simples de revisar. Separar por tema só se o volume tornar a revisão ou o processamento mais difícil.
