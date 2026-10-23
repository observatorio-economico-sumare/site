"""Offline tests of the OES research collector (no network)."""
import hashlib
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from scripts.oes_coleta.coletar import CITY, capture, collect, extract, get

class TestCollector(unittest.TestCase):
    def test_safe_hosts(self):
        for url in ("http://servicodados.ibge.gov.br/a", "https://example.com/a",
                    "https://bad:password@www.gov.br"):
            with self.assertRaises(ValueError):
                get(url)

    def test_capture_keeps_raw_and_hash(self):
        with tempfile.TemporaryDirectory() as d:
            rows = []
            raw = b'{"id":"3552403"}'
            with patch("scripts.oes_coleta.coletar.get", return_value=raw):
                result, row = capture(rows, Path(d), "test", "https://servicodados.ibge.gov.br/x")
            self.assertEqual(result["id"], CITY)
            self.assertEqual(row["sha256"], hashlib.sha256(raw).hexdigest())
            self.assertEqual((Path(d) / row["raw_path"]).read_bytes(), raw)

    def test_candidate_filters_city(self):
        with tempfile.TemporaryDirectory() as d:
            data = [{"id": "4090", "unidade": "Pessoas", "resultados": [{
                "classificacoes": [], "series": [
                    {"localidade": {"id": CITY}, "serie": {"2022": "123"}},
                    {"localidade": {"id": "3550308"}, "serie": {"2022": "999"}}]}]}]
            self.assertEqual(extract(data, 4090, 10261, Path(d), "sample"), 1)
            csv = (Path(d) / "candidates/sample.csv").read_text()
            self.assertIn("123", csv)
            self.assertNotIn("999", csv)

    def test_portal_html_not_archived_for_privacy(self):
        with tempfile.TemporaryDirectory() as d:
            with patch("scripts.oes_coleta.coletar.get", return_value=b"<html>Nome de servidor</html>"):
                _, row = capture([], Path(d), "servidores", "https://sumare.atende.net/abc", False)
            self.assertEqual(row["status"], "landing_page_only")
            self.assertEqual(row["raw_path"], "")
            self.assertFalse((Path(d) / "raw").exists())

    def test_failure_does_not_invent_values(self):
        with tempfile.TemporaryDirectory() as d:
            with patch("scripts.oes_coleta.coletar.get", side_effect=RuntimeError("offline")):
                summary = collect(Path(d))
            self.assertEqual(summary["downloaded_json"], 0)
            self.assertEqual(summary["candidate_rows"], 0)
            self.assertFalse(summary["validated"])
            self.assertFalse(summary["publication_allowed"])
            self.assertTrue((Path(d) / "consultas.csv").exists())

if __name__ == "__main__":
    unittest.main()
