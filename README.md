# Observatório Econômico de Sumaré (OES)

Observatório independente, apartidário e gratuito para divulgação de dados econômicos e sociais de Sumaré (SP). Não possui vínculo presumido com a Prefeitura Municipal.

## Situação atual (23/10/2026)

**Etapa 2: interface revisada e dois indicadores populacionais conferidos no IBGE.**
- População residente, Censo 2022: **279.545 pessoas**.
- População estimada em 1º de julho de 2026: **292.307 pessoas**.
- Fonte primária: [IBGE, Cidades e Estados, Sumaré](https://www.ibge.gov.br/cidades-e-estados/sp/sumare.html).
- Metodologia das estimativas: [IBGE, Estimativas de População](https://www.ibge.gov.br/estatisticas/sociais/populacao/9103-estimativas-de-population.html).
- Outros indicadores continuam **em validação**. Não inferir nem publicar dados pendentes.
- **Site não publicado.** O repositório permanece privado.

## Testar localmente

Requisitos: Python 3.10+; sem pacotes Python adicionais.

```bash
python3 -m http.server 8000 --directory site
```

Acesse http://localhost:8000 no navegador. Use servidor local (não abra o arquivo HTML diretamente), pois a interface carrega os indicadores por `fetch`.

## Checagem e preparação dos dados

```bash
python3 -m unittest discover -s tests -v
python3 scripts/check_site.py
python3 scripts/pipeline.py validate
python3 scripts/pipeline.py build
```

O validador exige fonte, endereço, identificador de consulta, data, período, metodologia, evidência local com SHA-256, revisão e coincidência do valor publicado com o registro de origem. Qualquer inconsistência cancela a compilação **antes de substituir** o arquivo JSON publicado.

**Natureza da evidência:** `data/raw/ibge_cidades_sumare_2026-10-23.json` registra uma *transcrição assistida* dos valores vistos na página oficial, não é o arquivo original da base do IBGE. A revisão técnica assistida está identificada nos metadados e ainda não constitui revisão humana independente. Para auditoria externa, consulte a página do IBGE. O próximo ciclo poderá integrar exportações oficiais originais (SIDRA/planilhas) e registrar revisões.

## Organização

| Caminho | Finalidade |
|---|---|
| `site/index.html` | Site estático, responsivo |
| `site/assets/css/` | Paleta e tipografia institucionais |
| `site/assets/js/` | Navegação, glossário e fichas técnicas |
| `site/data/indicators.json` | Somente dados validados exibidos |
| `data/catalog.json` | Indicadores previstos e definições |
| `data/raw/` | Evidência e registro da fonte |
| `data/processed/indicators.json` | Dados revisados |
| `scripts/pipeline.py` | Checagem e geração de JSON |
| `scripts/check_site.py` | Smoke test HTML/JS/CSS |
| `tests/` | Testes de regressão |
| `.github/workflows/audit.yml` | Validação automática por alteração |
| `.github/workflows/deploy.yml` | Deploy **apenas manual** com confirmação |
| `docs/` | Segurança, metodologia, decisões e histórico |

## Publicação futura

1. Revisar visualmente no navegador (desktop e celular) e fazer verificação editorial independente.
2. No GitHub Free, o GitHub Pages requer repositório **público**. Escolha conscientemente quando alterar a visibilidade; não há publicação automática nesta etapa.
3. Em **Settings → Pages**, selecionar **GitHub Actions** como fonte quando decidir publicar.
4. Em **Actions → OES | Publicação manual → Run workflow**, preencher **PUBLICAR**. O fluxo só publica quando testes e verificação dos dados passam.
5. Manter autenticação em duas etapas e revisão de mudanças antes da publicação.

Consulte `docs/AUDITORIA.md`, `docs/SEGURANCA.md` e `docs/PUBLICACAO.md`.

