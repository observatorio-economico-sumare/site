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
            self.assertEqual(urlsplit(company["website"]).scheme, "https")
            self.assertNotEqual(company["website"], company["source"]["url"])
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

    def test_descricao_de_empresas_sem_redundancia(self):
        pt = (ROOT / "site/index.html").read_text(encoding="utf-8")
        en = (ROOT / "site/en/index.html").read_text(encoding="utf-8")
        self.assertIn("<h2>O que algumas empresas fazem em Sumaré</h2>", pt)
        self.assertNotIn("Sem ranking", pt)
        self.assertIn("<h2>What some companies do in Sumaré</h2>", en)
        self.assertNotIn("Not ranked", en)
        self.assertNotIn("A seleção não representa todas as empresas", pt)
        self.assertNotIn("This is neither a complete directory", en)

    def test_lista_simples_de_cinco_empresas(self):
        empresas = json.loads(DATA.read_text(encoding="utf-8"))["companies"]
        self.assertEqual(len(empresas), 5)
        self.assertEqual(len({e["sector"]["pt"] for e in empresas}), 5)
        for path in ("site/index.html", "site/en/index.html"):
            html = (ROOT / path).read_text(encoding="utf-8")
            self.assertIn('data-company-list', html)
            self.assertNotIn("data-company-count", html)
            self.assertIn("data-company-status", html)
            self.assertNotIn('data-company-filter', html)
            self.assertNotIn('data-company-filters', html)
        css = (ROOT / "site/assets/css/empresas.css").read_text(encoding="utf-8")
        self.assertNotIn(".empresa-filter-button", css)
        js = (ROOT / "site/assets/js/empresas.js").read_text(encoding="utf-8")
        self.assertIn("for (const company of companies)", js)
        self.assertIn("companies.sort(", js)
        self.assertNotIn("data-company-count", js)
        self.assertNotIn("count.textContent", js)
        self.assertNotIn("company.source.url", js)
        self.assertIn("company.website", js)
        self.assertNotIn("Fonte sobre Sumaré", js)
        self.assertNotIn("selectedSector", js)
        self.assertNotIn("data-company-filter", js)

if __name__ == "__main__":
    unittest.main()
