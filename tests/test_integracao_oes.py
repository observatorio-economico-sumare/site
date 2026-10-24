"""Pré-integração auditável: dados de pesquisa não alteram a publicação."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from scripts import pipeline

ROOT = Path(__file__).resolve().parents[1]
CANDIDATES = ROOT / "data/review/integracao_13.json"
TRANSLATIONS = ROOT / "data/review/translations_en.json"


class TestIntegration(unittest.TestCase):
    def test_full_proposal_validates_and_builds_only_to_temp(self):
        with tempfile.TemporaryDirectory() as tmp:
            temporary_output = Path(tmp) / "indicators.json"
            original = pipeline.OUTPUT.read_bytes()
            with patch.object(pipeline, "INPUT", CANDIDATES), patch.object(
                    pipeline, "OUTPUT", temporary_output):
                catalog, items = pipeline.validate()
                self.assertEqual(len(items), 13)
                self.assertEqual(len({x["id"] for x in items}), 13)
                self.assertEqual({x["municipality_code"] for x in items}, {"3552403"})
                self.assertEqual(len([x for x in items if x["evidence"]["original_file_preserved"]]), 2)
                pipeline.build()
            self.assertEqual(pipeline.OUTPUT.read_bytes(), original)
            self.assertEqual(len(json.loads(temporary_output.read_text(encoding="utf-8"))["indicators"]), 13)

    def test_en_translations_cover_exactly_new_records(self):
        proposed = json.loads(CANDIDATES.read_text(encoding="utf-8"))["indicators"]
        published = json.loads(pipeline.INPUT.read_text(encoding="utf-8"))["indicators"]
        added = {x["id"] for x in proposed} - {x["id"] for x in published}
        translations = json.loads(TRANSLATIONS.read_text(encoding="utf-8"))
        self.assertEqual(set(translations), added)
        self.assertEqual(len(added), 10)
        for key, value in translations.items():
            for field in ("name", "definition", "unit", "dataset", "method", "limitations", "revisions"):
                self.assertTrue(isinstance(value.get(field), str) and value[field].strip(),
                                f"{key}.{field}: missing English translation")
        self.assertNotIn("escolarizacao-6-14-anos-2022", translations)

    def test_proposal_preserves_initial_records_and_does_not_publish(self):
        proposed = json.loads(CANDIDATES.read_text(encoding="utf-8"))["indicators"]
        published = json.loads(pipeline.INPUT.read_text(encoding="utf-8"))["indicators"]
        self.assertEqual(proposed[:len(published)], published)
        self.assertEqual(len(published), 3)
        self.assertEqual(json.loads((ROOT / "site/data/indicators.json").read_text(encoding="utf-8"))["indicators"],
                         published)


if __name__ == "__main__":
    unittest.main()
