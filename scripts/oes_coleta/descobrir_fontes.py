#!/usr/bin/env python3
"""Descobre URLs de planilhas oficiais. Não coleta nem armazena dados pessoais."""
import argparse
import csv
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from scripts.oes_coleta.coletar import get

SOURCES = [
    ("inep_2025", "https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/sinopses-estatisticas/educacao-basica"),
    ("rais_2025", "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/estatisticas-trabalho/rais/rais-2025"),
    ("servidores_sumare", "https://sumare.atende.net/transparencia/item/resumo-funcionario-por-regime"),
]
TOKENS = ("2025", "sinopse", "rais", "download", ".xls", ".zip", ".ods", ".csv",
          "remunera", "tabela", "funcion", "regime", "relatorio")
class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.active = None
        self.links = []
    def handle_starttag(self, tag, attrs):
        if tag.lower() == "a":
            self.active = {"href": dict(attrs).get("href", ""), "label": ""}
    def handle_data(self, data):
        if self.active is not None:
            self.active["label"] += data.strip() + " "
    def handle_endtag(self, tag):
        if tag.lower() == "a" and self.active is not None:
            self.links.append(self.active)
            self.active = None

def discover(out):
    out.mkdir(parents=True, exist_ok=True)
    items = []
    for label, url in SOURCES:
        try:
            html = get(url).decode("utf-8", errors="replace")
            parser = Links()
            parser.feed(html)
            matches = []
            for item in parser.links:
                href = urljoin(url, item["href"])
                parsed = urlparse(href)
                title = item["label"].strip()[:120]
                if parsed.scheme != "https" or not parsed.hostname:
                    continue
                if any(term in (title+" "+href).lower() for term in TOKENS):
                    matches.append({"source":label, "title":title, "url":href, "status":"link_discovered"})
            seen = set()
            for item in matches:
                if item["url"] not in seen:
                    items.append(item)
                    seen.add(item["url"])
                    if len(seen) == 100:
                        break
            items.append({"source":label,"title":"", "url":url,
                          "status":"ok_links_%d" % len(matches)})
        except Exception as exc:
            items.append({"source":label, "title":str(exc)[:130], "url":url, "status":"error"})
    with (out/"fontes_links.csv").open("w",newline="",encoding="utf-8") as fp:
        w=csv.DictWriter(fp,fieldnames=["source","title","url","status"])
        w.writeheader()
        w.writerows(items)
    for label, _ in SOURCES:
        rows=[x for x in items if x["source"]==label]
        print(label, "links:",sum(x["status"]=="link_discovered" for x in rows),
              "error:",any(x["status"]=="error" for x in rows))
    return items
if __name__ == "__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--output", type=Path, required=True)
    discover(p.parse_args().output)
