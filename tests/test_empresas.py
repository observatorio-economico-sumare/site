"""Validação das fichas públicas de empresas do OES."""
import json
import unittest
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "site/data/empresas.json"

class EmpresasTest(unittest.TestCase):
    def test_curadoria_com_fontes_primarias(self):
        content = json.loads(DATA.read_text(encoding="utf-8"))
        companies = content["companies"]
        self.assertEqual(content["reviewed_at"], "2026-10-23")
        self.assertEqual(len(companies), 5)
        self.assertEqual(len({c["id"] for c in companies}), len(companies))
        for company in companies:
            self.assertTrue(company["name"].strip())
            self.assertEqual(urlsplit(company["source"]["url"]).scheme, "https")
            for field in ("sector", "activity", "presence"):
                for language in ("pt", "en"):
                    self.assertTrue(company[field][language].strip())
            self.assertNotIn("employees", company)
            self.assertNotIn("taxes", company)

    def test_navegacao_bilingue(self):
        for name in ("site/index.html", "site/en/index.html"):
            page = (ROOT / name).read_text(encoding="utf-8")
            self.assertIn('data-tab="empresas"', page)
            self.assertIn('id="empresas" role="region"', page)
            self.assertIn('data-company-list', page)
            self.assertIn("empresas.js", page)
            self.assertIn("empresas.css", page)

if __name__ == "__main__":
    unittest.main()
