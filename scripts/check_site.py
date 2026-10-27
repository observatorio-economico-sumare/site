#!/usr/bin/env python3
"""Checagem estática de estrutura, links, acessibilidade e dados do OES."""
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"


class DocumentCheck(HTMLParser):
    """Inspeciona HTML sem interpretar scripts ou alterar o conteúdo."""

    def __init__(self):
        super().__init__()
        self.scripts = []
        self.css = []
        self.hrefs = []
        self.ids = []
        self.inline_scripts = 0
        self.bad_events = []
        self.tabs = []
        self.panels = []
        self.indicator_ids = set()

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        self.bad_events.extend(k for k, _ in attrs if k.startswith("on"))
        if "id" in values:
            self.ids.append(values["id"])
        if tag == "script":
            if "src" not in values:
                self.inline_scripts += 1
            else:
                self.scripts.append(values["src"])
        if tag == "link" and values.get("rel") == "stylesheet":
            self.css.append(values.get("href"))
        if tag == "a" and values.get("href"):
            self.hrefs.append(values["href"])
        if tag == "button" and values.get("data-tab"):
            self.tabs.append(values.get("data-tab"))
        if values.get("role") == "region" and "tab" in values.get("class", "").split():
            self.panels.append(values.get("id"))
        if values.get("data-indicator"):
            self.indicator_ids.add(values["data-indicator"])


def read_page(name):
    path = SITE / name
    html = path.read_text(encoding="utf-8")
    doc = DocumentCheck()
    doc.feed(html)
    assert not doc.bad_events, f"{name}: eventos HTML inline proibidos"
    assert doc.inline_scripts == 0, f"{name}: JavaScript inline não permitido"
    assert len(doc.ids) == len(set(doc.ids)), f"{name}: IDs HTML duplicados"
    assert "Content-Security-Policy" in html, f"{name}: CSP ausente"
    assert any(urlsplit(asset).path.endswith("assets/css/styles.css") for asset in doc.css), f"{name}: CSS principal ausente"
    for asset in doc.scripts + doc.css:
        asset_path = urlsplit(asset).path
        assert asset_path and not asset_path.startswith(("/", "//")), (
            f"{name}: recurso não local: {asset}")
        assert (path.parent / asset_path).resolve().is_relative_to(SITE.resolve()), f"{name}: recurso fora de site/: {asset}"
        assert (path.parent / asset_path).is_file(), f"{name}: recurso ausente: {asset}"
    return doc


def check_links(name, doc, pages):
    for href in doc.hrefs:
        uri = urlsplit(href)
        assert uri.scheme in ("", "https", "mailto"), (
            f"{name}: protocolo não permitido em link: {href}")
        if uri.scheme or uri.netloc:
            continue
        local = unquote(uri.path)
        target = ((SITE / name).parent / local).resolve() if local else SITE / name
        assert target.is_relative_to(SITE.resolve()) and target.is_file(), (
            f"{name}: link interno inexistente: {href}")
        if uri.fragment and target.suffix == ".html":
            target_name = target.relative_to(SITE).as_posix()
            assert target_name in pages, f"{name}: página não verificada: {target_name}"
            assert unquote(uri.fragment) in pages[target_name].ids, (
                f"{name}: âncora inexistente: {href}")


def main():
    pages = {name: read_page(name) for name in ("index.html", "governanca.html", "biblioteca.html", "en/index.html", "en/governanca.html")}
    index = pages["index.html"]
    assert {"assets/js/app.js", "assets/js/indicators.js"}.issubset(index.scripts)
    assert {"sourceDialog", "sourceDialogTitle", "sourceDialogBody",
            "closeSourceDialog"}.issubset(index.ids)
    assert {"populacao-censo-2022", "populacao-estimada",
            "pib-per-capita-2023"}.issubset(index.indicator_ids)
    assert len(index.tabs) == len(set(index.tabs)), "Abas com nomes repetidos"
    assert set(index.tabs) == set(index.panels), "Abas sem painéis correspondentes"
    english = pages["en/index.html"]
    assert set(english.tabs) == set(index.tabs), "Abas divergentes entre idiomas"
    assert set(english.indicator_ids) == set(index.indicator_ids), "Indicadores divergentes entre idiomas"
    assert '<html lang="en"' in (SITE / "en/index.html").read_text(encoding="utf-8"), "Idioma EN ausente"
    governance = pages["governanca.html"]
    policies = {"declaracao-de-independencia", "politica-editorial", "politica-de-auditoria",
                "politica-de-transparencia", "privacidade-e-protecao-de-dados",
                "direitos-autorais-e-licencas"}
    assert policies.issubset(governance.ids), "Políticas institucionais ausentes"
    assert not {"sobre-o-oes", "identidade-institucional", "sobre-a-fundadora"}.intersection(
        governance.ids
    ), "Informações repetidas na página de políticas"

    assert set(pages["en/governanca.html"].ids) == set(governance.ids), "Políticas divergentes entre idiomas"
    for name, doc in pages.items():
        check_links(name, doc, pages)

    published = json.loads((SITE / "data/indicators.json").read_text(encoding="utf-8"))
    processed = json.loads((ROOT / "data/processed/indicators.json").read_text(encoding="utf-8"))
    assert published == processed, "Dados servidos divergem dos registros validados"
    print("HTML, links, acessibilidade e dados: OK")


if __name__ == "__main__":
    main()
