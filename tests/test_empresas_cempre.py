"""Consistência dos agregados oficiais CEMPRE 2024, Sumaré."""
import json
import unittest
from pathlib import Path
from urllib.parse import urlparse

DATA = Path(__file__).resolve().parents[1] / "data/processed/empresas_cempre_2024.json"

class EmpresasCempreTest(unittest.TestCase):
    def test_soma_sem_duplicidade(self):
        d = json.loads(DATA.read_text(encoding="utf-8"))
        self.assertEqual((d["municipality_ibge"], d["reference_year"], d["total"]),
                         ("3552403", 2024, 12746))
        self.assertEqual(sum(s["value"] for s in d["sectors"]), d["total"])
        sections = [section for s in d["sectors"] for section in s["cnae_sections"]]
        self.assertEqual(sorted(sections), list("ABCDEFGHIJKLMNOPQRSTU"))

    def test_fonte_e_escopo(self):
        d = json.loads(DATA.read_text(encoding="utf-8"))
        self.assertEqual(d["status"], "validated_research_not_published")
        for url in (d["source"]["total_query"], d["source"]["sectors_query"]):
            self.assertEqual(urlparse(url).hostname, "apisidra.ibge.gov.br")
            self.assertIn("3552403", url)
            self.assertIn("/2024/", url)
        self.assertEqual(len(d["source"]["total_response_sha256"]), 64)
        self.assertEqual(len(d["source"]["sectors_response_sha256"]), 64)
        self.assertIn("não equivalem", d["limitations"])

if __name__ == "__main__":
    unittest.main()
