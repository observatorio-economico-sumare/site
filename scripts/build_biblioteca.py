"""Gera a lista estática da biblioteca a partir do catálogo auditável."""
import json
import sys
from html import escape
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data/biblioteca/estudos.json"
PAGE = ROOT / "site/biblioteca.html"
START = '<section class="library-list" aria-label="Publicações por ano, das mais recentes às mais antigas">\n'
END = "\n  </section>"
CONFIRMED = {
    "Confirmado: registro primário acessível",
    "Confirmado: registro institucional acessível",
    "Confirmado: página editorial acessível",
}
FIELDS = ("id", "titulo_original", "autores", "instituicao_responsavel",
          "ano_publicacao", "tipo_documento", "descricao_objetiva", "url_original")


def public_records(catalog):
    records = [r for r in catalog["registros"] if r.get("publicar_no_site") == "SIM"]
    ids, urls = set(), set()
    for record in records:
        identifier = record.get("id", "?")
        if record.get("status_verificacao_link") not in CONFIRMED:
            raise ValueError(f"{identifier}: registro não confirmado marcado para publicação")
        if any(not str(record.get(key, "")).strip() for key in FIELDS):
            raise ValueError(f"{identifier}: metadados obrigatórios incompletos")
        if not (str(record["ano_publicacao"]).isdigit() and
                len(str(record["ano_publicacao"])) == 4):
            raise ValueError(f"{identifier}: ano inválido")
        url = urlsplit(record["url_original"])
        if url.scheme != "https" or not url.hostname or any(c.isspace() for c in record["url_original"]):
            raise ValueError(f"{identifier}: endereço original inválido")
        if identifier in ids or record["url_original"] in urls:
            raise ValueError(f"{identifier}: ID ou link duplicado")
        ids.add(identifier)
        urls.add(record["url_original"])
    return sorted(records, key=lambda r: (-int(r["ano_publicacao"]),
                    r["titulo_original"].casefold(), r["id"]))


def render_article(record):
    e = lambda field: escape(str(record[field]), quote=True)
    return (
        f'<article class="library-entry" id="{escape(record["id"].lower(), quote=True)}">\n'
        f'  <h2>{e("titulo_original")}</h2>\n'
        f'  <p class="library-meta">{e("autores")} · {e("instituicao_responsavel")} · '
        f'{e("ano_publicacao")} · {e("tipo_documento")}</p>\n'
        f'  <p class="library-summary">{e("descricao_objetiva")}</p>\n'
        f'  <a class="library-source" href="{e("url_original")}" target="_blank" '
        'rel="noopener noreferrer">Acessar publicação original '
        '<span aria-hidden="true">↗</span></a>\n'
        '</article>'
    )


def render_page(catalog, html):
    if html.count(START) != 1:
        raise ValueError("Marcador da biblioteca ausente ou duplicado")
    begin = html.index(START) + len(START)
    finish = html.index(END, begin)
    articles = "\n".join(render_article(r) for r in public_records(catalog))
    return html[:begin] + articles + html[finish:]


def main():
    if sys.argv[1:] not in ([], ["--check"]):
        raise SystemExit("Uso: python3 scripts/build_biblioteca.py [--check]")
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    current = PAGE.read_text(encoding="utf-8")
    expected = render_page(catalog, current)
    if sys.argv[1:] == ["--check"]:
        if expected != current:
            raise SystemExit("Biblioteca desatualizada: execute python3 scripts/build_biblioteca.py")
        print("Biblioteca e catálogo: OK")
    elif expected != current:
        PAGE.write_text(expected, encoding="utf-8")
        print("Biblioteca atualizada.")


if __name__ == "__main__":
    main()
