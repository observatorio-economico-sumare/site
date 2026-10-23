#!/usr/bin/env python3
"""Smoke test simples sem dependências para HTML e dados servidos pelo GitHub Pages."""
import json
from pathlib import Path
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"

class DocumentCheck(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts = []
        self.css = []
        self.inline_scripts = 0
        self.controls = set()
        self.indicator_ids = set()
        self.bad_events = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        self.bad_events.extend(k for k, _ in attrs if k.startswith("on"))
        if tag == "script":
            if not values.get("src"): self.inline_scripts += 1
            else: self.scripts.append(values["src"])
        if tag == "link" and values.get("rel") == "stylesheet":
            self.css.append(values.get("href"))
        if "id" in values: self.controls.add(values["id"])
        if values.get("data-indicator"): self.indicator_ids.add(values["data-indicator"])

doc = DocumentCheck()
html = (SITE / "index.html").read_text(encoding="utf-8")
doc.feed(html)
assert not doc.bad_events, f"Eventos inline proibidos: {doc.bad_events}"
assert doc.inline_scripts == 0, "Não usar scripts inline"
assert "Content-Security-Policy" in html, "CSP ausente"
assert "assets/js/indicators.js" in doc.scripts
assert "assets/js/app.js" in doc.scripts
assert "assets/css/styles.css" in doc.css
assert {"sourceDialog","sourceDialogTitle","sourceDialogBody","closeSourceDialog"}.issubset(doc.controls)
assert {"populacao-censo-2022","populacao-estimada"}.issubset(doc.indicator_ids)
for asset in doc.scripts + doc.css:
    assert not asset.startswith(("http:", "https:", "/")), f"Arquivo precisa ser local: {asset}"
    assert (SITE / asset).is_file(), f"Arquivo inexistente: {asset}"
served = json.loads((SITE / "data/indicators.json").read_text(encoding="utf-8"))
processed = json.loads((ROOT / "data/processed/indicators.json").read_text(encoding="utf-8"))
assert served == processed, "Indicadores servidos divergem dos validados"
print("Smoke test da interface e consistência dos dados: OK")
