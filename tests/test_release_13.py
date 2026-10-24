"""Controles de publicação e rastreabilidade do OES, sem bibliotecas extras."""
import json
import unittest
from pathlib import Path

from scripts import pipeline

ROOT = Path(__file__).resolve().parents[1]


class IndicatorReleaseTests(unittest.TestCase):
    def test_sources_periods_and_exact_values(self):
        _, items = pipeline.validate()
        by_id = {item["id"]: item for item in items}
        self.assertEqual(len(by_id), 31)
        self.assertNotIn("escolarizacao-6-14-anos-2022", by_id)
        self.assertEqual(by_id["residentes-conta-propria-2022"]["value"], 32334)
        self.assertEqual(by_id["pib-municipal-2023"]["value"], 19026093000)
        self.assertEqual(by_id["populacao-homens-2022"]["value"] +
                         by_id["populacao-mulheres-2022"]["value"], 279545)
        self.assertEqual(sum(by_id[x]["value"] for x in
                             ("populacao-0-14-anos-2022",
                              "populacao-15-64-anos-2022",
                              "populacao-65-mais-2022")), 279545)
        self.assertTrue(all(x["status"] == "validated" for x in items))
        self.assertEqual(sum(x["evidence"]["original_file_preserved"] is True
                             for x in items), 11)

    def test_site_feed_exactly_equals_validated_input(self):
        processed = (ROOT / "data/processed/indicators.json").read_bytes()
        published = (ROOT / "site/data/indicators.json").read_bytes()
        self.assertEqual(processed, published)
        self.assertEqual(json.loads(published)["indicators"][0]["value"], 279545)

    def test_english_labels_cover_all_records(self):
        source = (ROOT / "site/assets/js/indicators.js").read_text(encoding="utf-8")
        start = "const enIndicatorText = "
        end = ";\nconst enFieldLabels"
        self.assertIn(start, source)
        self.assertIn(end, source)
        labels = json.loads(source.split(start, 1)[1].split(end, 1)[0])
        ids = {x["id"] for x in pipeline.validate()[1]}
        self.assertEqual(set(labels), ids)
        for key in ids:
            for field in ("name", "definition", "unit", "dataset",
                          "method", "limitations", "revisions"):
                self.assertTrue(labels[key].get(field), f"{key}.{field}: missing")


if __name__ == "__main__":
    unittest.main()
