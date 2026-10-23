import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from scripts import pipeline

class PipelineTests(unittest.TestCase):
    def test_empty_catalog_is_validated_as_empty(self):
        _, items = pipeline.validate()
        self.assertEqual(items, [])

    def test_invalid_record_cannot_be_published(self):
        with tempfile.TemporaryDirectory() as folder:
            bad_path = Path(folder) / "bad.json"
            bad_path.write_text(json.dumps({"indicators":[{"id":"populacao-censo-2022","status":"pending"}]}))
            with patch.object(pipeline, "INPUT", bad_path):
                with self.assertRaises(ValueError):
                    pipeline.validate()

if __name__ == "__main__":
    unittest.main()
