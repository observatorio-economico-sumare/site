# Observatório Econômico de Sumaré (OES)

Projeto independente e apartidário, sem vínculo presumido com a Prefeitura Municipal de Sumaré.

## Estado do projeto

**Etapa 1: estrutura técnica.** A interface foi migrada do MVP visual v4 para HTML/CSS/JS modular. Todos os indicadores estão **Em validação** e nenhum valor numérico é publicado como confirmado. Integração das fontes virá depois.

## Testar localmente

É necessário Python 3.10+; não são necessárias dependências externas.

```bash
python -m http.server 8000 --directory site
```

Abra `http://localhost:8000`. Não abra `index.html` diretamente pelo explorador de arquivos: navegadores bloqueiam a leitura de JSON via `file://`.

## Validar os dados

```bash
python -m unittest discover -s tests -v
python scripts/pipeline.py validate
python scripts/pipeline.py build
```

A rotina só publica dados com fonte, identificador da consulta, metodologia, revisor, datas, recorte de Sumaré e prova de integridade de arquivo de origem. Se houver falha, a publicação é bloqueada e o JSON previamente validado permanece intacto.

## Estrutura

- `site/`: HTML, CSS, JS e apenas dados para exibição pública. A referência v4 permanece em `docs/mvp_v4_referencia.html`.
- `data/catalog.json`: catálogo de indicadores, ainda pendentes.
- `data/raw/`: arquivos oficiais de origem, com versão e hash SHA-256 (não inclua dados pessoais).
- `data/processed/indicators.json`: indicadores revisados, inicialmente vazio.
- `scripts/pipeline.py`: validações e montagem de dados publicados.
- `tests/`: testes automatizados.
- `.github/workflows/audit.yml`: verificações em PRs e no ramo principal.
- `GitHub Pages`: publicação ainda não configurada; repositório privado e site fora do ar.
- `docs/`: políticas editoriais e de segurança.

## Próximas etapas

1. Criar repositório `observatorio-economico-sumare`, inicialmente privado.
2. Os arquivos já foram enviados ao repositório privado pelo GitHub conectado.
3. Ativar 2FA e proteger a branch `main` contra modificações sem revisão (conforme recursos do plano).
4. Identificar as tabelas e consultas originais para cada indicador, testar extração e somente depois publicar números.
5. Para GitHub Pages, configurar *Settings → Pages → Build and deployment → GitHub Actions*. Publicar apenas quando estiver pronto, executando manualmente o workflow.

Leia `docs/AUDITORIA.md` e `docs/SEGURANCA.md` antes da primeira publicação pública.