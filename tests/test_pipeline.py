"""Testes de regressão para publicação controlada do OES."""
import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts import pipeline


class PipelineTests(unittest.TestCase):
    def test_two_verified_ibge_indicators(self):
        _, indicators = pipeline.validate()
        values = {item["id"]: item["value"] for item in indicators}
        self.assertEqual(values["populacao-censo-2022"], 279545)
        self.assertEqual(values["populacao-estimada"], 292307)
        self.assertEqual(len(values), 2)

    def test_modified_value_is_rejected_even_with_same_evidence_hash(self):
        _, items = pipeline.validate()
        tampered = copy.deepcopy(items)
        tampered[0]["value"] = tampered[0]["value"] + 1
        with tempfile.TemporaryDirectory() as root:
            path = Path(root) / "bad.json"
            path.write_text(json.dumps({"indicators": tampered}), encoding="utf-8")
            with patch.object(pipeline, "INPUT", path):
                with self.assertRaisesRegex(ValueError, "divergem da evidência"):
                    pipeline.validate()

    def test_incomplete_record_is_rejected(self):
        with tempfile.TemporaryDirectory() as root:
            path = Path(root) / "missing.json"
            path.write_text(json.dumps({"indicators": [
                {"id": "populacao-censo-2022", "status": "pending"}]}), encoding="utf-8")
            with patch.object(pipeline, "INPUT", path):
                with self.assertRaises(ValueError):
                    pipeline.validate()

    def test_bad_source_hash_is_rejected(self):
        _, items = pipeline.validate()
        tampered = copy.deepcopy(items)
        tampered[0]["evidence"]["sha256"] = "0" * 64
        with tempfile.TemporaryDirectory() as root:
            path = Path(root) / "hash.json"
            path.write_text(json.dumps({"indicators": tampered}), encoding="utf-8")
            with patch.object(pipeline, "INPUT", path):
                with self.assertRaisesRegex(ValueError, "SHA-256 divergente"):
                    pipeline.validate()

    def test_invalid_build_preserves_previous_publication(self):
        with tempfile.TemporaryDirectory() as root:
            folder = Path(root)
            bad = folder / "bad.json"
            published = folder / "published.json"
            bad.write_text('{"indicators": [{"id":"populacao-censo-2022"}]}', encoding="utf-8")
            published.write_text("VERSAO_ANTERIOR", encoding="utf-8")
            with patch.object(pipeline, "INPUT", bad), patch.object(pipeline, "OUTPUT", published):
                with self.assertRaises(ValueError):
                    pipeline.build()
            self.assertEqual(published.read_text(encoding="utf-8"), "VERSAO_ANTERIOR")


if __name__ == "__main__":
    unittest.main()
