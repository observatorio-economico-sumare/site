"""Publicação enxuta dos dados CEMPRE: nenhuma estimativa ou total de CNPJ 2026."""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data/processed/empresas_cempre_2024.json"
PUBLIC = ROOT / "site/data/empresas-cempre-2024.json"

class EmpresasPublicacaoTest(unittest.TestCase):
    def test_publicado_reproduz_base_validada(self):
        source = json.loads(SOURCE.read_text(encoding="utf-8"))
        public = json.loads(PUBLIC.read_text(encoding="utf-8"))
        self.assertEqual(source["reference_year"], 2024)
        self.assertEqual(public["reference_year"], source["reference_year"])
        self.assertEqual(public["municipality_ibge"], source["municipality_ibge"])
        self.assertEqual(public["total"], source["total"])
        self.assertEqual(public["occupied_persons"], source["secondary_context"]["occupied_persons"])
        self.assertEqual(public["salaried_persons"], source["secondary_context"]["salaried_persons"])
        self.assertEqual(public["sectors"], [
            {"name": x["name"], "value": x["value"]} for x in source["sectors"]
        ])
        self.assertEqual(sum(x["value"] for x in public["sectors"]), public["total"])
        self.assertEqual(len({x["name"] for x in public["sectors"]}), 5)
        self.assertEqual(public["source"]["total_query"], source["source"]["total_query"])
        self.assertEqual(public["source"]["sectors_query"], source["source"]["sectors_query"])

    def test_html_bilingue_tem_grafico_e_metodologia(self):
        for path in ("site/index.html", "site/en/index.html"):
            html = (ROOT / path).read_text(encoding="utf-8")
            self.assertIn('data-cempre-bars', html)
            self.assertIn('data-cempre-selected', html)
            self.assertIn('empresas-cempre.js', html)
            self.assertIn('2024', html)
            self.assertIn('href="https://sidra.ibge.gov.br/tabela/9528"', html)
            self.assertIn('Empresas e organizações' if path == "site/index.html" else 'Businesses and organizations', html)
            self.assertEqual(html.count('data-cempre-number='), 1)
        self.assertIn('apisidra.ibge.gov.br/values/t/9528/', json.dumps(json.loads(PUBLIC.read_text(encoding="utf-8"))["source"]))
        script = (ROOT / "site/assets/js/empresas-cempre.js").read_text(encoding="utf-8")
        self.assertIn("data.total", script)
        self.assertIn('aria-pressed', script)

if __name__ == "__main__":
    unittest.main()
