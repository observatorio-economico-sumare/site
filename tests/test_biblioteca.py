"""Verifica a integridade do catálogo público da biblioteca."""
import copy
import json
import unittest
from pathlib import Path

from scripts import build_biblioteca as library


class BibliotecaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = json.loads(library.CATALOG.read_text(encoding="utf-8"))
        cls.page = library.PAGE.read_text(encoding="utf-8")

    def test_html_matches_source(self):
        self.assertEqual(library.render_page(self.catalog, self.page), self.page)
        self.assertIn('href="assets/css/biblioteca.css"', self.page)
        self.assertIn('rel="noopener noreferrer"', self.page)

    def test_only_verified_studies_are_public(self):
        records = library.public_records(self.catalog)
        self.assertTrue(records)
        self.assertEqual(len(records), self.page.count('class="library-entry"'))
        self.assertTrue(all(r["status_verificacao_link"] in library.CONFIRMED for r in records))
        years = [int(r["ano_publicacao"]) for r in records]
        self.assertEqual(years, sorted(years, reverse=True))

    def test_pending_cannot_be_published(self):
        catalog = copy.deepcopy(self.catalog)
        pending = next(r for r in catalog["registros"] if r["publicar_no_site"] != "SIM")
        pending["publicar_no_site"] = "SIM"
        with self.assertRaisesRegex(ValueError, "não confirmado"):
            library.public_records(catalog)

    def test_markup_is_escaped(self):
        record = dict(library.public_records(self.catalog)[0])
        record["titulo_original"] = '<img src=x onerror=alert(1)>'
        markup = library.render_article(record)
        self.assertNotIn("<img", markup)
        self.assertIn("&lt;img", markup)


if __name__ == "__main__":
    unittest.main()
