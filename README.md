# Observatório Econômico de Sumaré (OES)

Projeto independente, apartidário e gratuito para consulta de dados econômicos e sociais de Sumaré (SP). Sem vínculo com a Prefeitura Municipal.

**Site oficial:** https://oesumare.github.io/

## Estrutura

- `site/`: site público, recursos estáticos e indicadores publicados.
- `data/raw/`: arquivos e evidências de origem, preservados para rastreabilidade.
- `data/processed/` e `data/catalog.json`: dados revisados e definições.
- `scripts/` e `tests/`: preparação, validação e testes.
- `docs/`: metodologia, políticas, segurança e registros históricos.

## Desenvolvimento

O site utiliza HTML, CSS e JavaScript, sem framework. Testes e validações usam Python, sem dependências externas.

```bash
python3 -m unittest discover -s tests -v
python3 scripts/check_site.py
python3 scripts/pipeline.py validate
python3 scripts/pipeline.py build
```

Visualização local: `python3 -m http.server 8000 --directory site`.

A validação automática ocorre em `.github/workflows/audit.yml`. Após aprovação dos testes na branch `main`, o fluxo `.github/workflows/deploy.yml` publica automaticamente no GitHub Pages. O acionamento manual permanece disponível.

Dados publicados devem manter fontes, períodos, métodos, limitações e evidências verificáveis. O histórico Git e os registros originais são preservados.

**Limitação registrada:** `data/raw/ibge_cidades_sumare_2026-10-23.json` contém uma transcrição assistida do IBGE, não uma exportação oficial bruta. Consulte `docs/AUDITORIA.md`.

**Contato:** oes.sumare@gmail.com
