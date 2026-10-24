"""Verifica a integridade do catálogo público da biblioteca."""
import copy
import json
import unittest

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

    def test_topic_filter_matches_catalog(self):
        records = library.public_records(self.catalog)
        self.assertEqual(self.page.count('data-topic="'), len(records))
        for record in records:
            self.assertIn(
                f'id="{record["id"].lower()}" data-topic="{record["categoria"]}"',
                self.page,
            )
        self.assertIn('id="library-topic"', self.page)
        self.assertIn('src="assets/js/biblioteca.js"', self.page)

    def test_topic_required_to_publish(self):
        catalog = copy.deepcopy(self.catalog)
        published = next(r for r in catalog["registros"] if r["publicar_no_site"] == "SIM")
        published.pop("categoria")
        with self.assertRaisesRegex(ValueError, "metadados obrigatórios"):
            library.public_records(catalog)

    def test_pending_cannot_be_published(self):
        catalog = copy.deepcopy(self.catalog)
        pending = next(r for r in catalog["registros"] if r["publicar_no_site"] != "SIM")
        pending["publicar_no_site"] = "SIM"
        with self.assertRaisesRegex(ValueError, "não confirmado"):
            library.public_records(catalog)

    def test_display_title_does_not_modify_original(self):
        record = next(r for r in library.public_records(self.catalog)
                      if r["id"] == "OES-018")
        self.assertTrue(record["titulo_original"].startswith("CONTAMINAÇÃO"))
        self.assertTrue(record["titulo_exibicao"].startswith("Contaminação"))
        self.assertIn("<h2>Contaminação", library.render_article(record))
        self.assertNotIn("<h2>CONTAMINAÇÃO", library.render_article(record))

    def test_no_scielo_links_published(self):
        catalog = copy.deepcopy(self.catalog)
        record = next(r for r in catalog["registros"] if r["id"] == "OES-024")
        record["publicar_no_site"] = "SIM"
        record["url_original"] = record["url_alternativa"]
        record["status_verificacao_link"] = "Confirmado: página editorial acessível"
        with self.assertRaisesRegex(ValueError, "agregador SciELO"):
            library.public_records(catalog)
        self.assertNotIn('href="https://www.scielo.br/', self.page)

    def test_markup_is_escaped(self):
        record = dict(library.public_records(self.catalog)[0])
        record["titulo_original"] = '<img src=x onerror=alert(1)>'
        markup = library.render_article(record)
        self.assertNotIn("<img", markup)
        self.assertIn("&lt;img", markup)


if __name__ == "__main__":
    unittest.main()
