"""Conferência offline das transcrições oficiais ainda não publicadas."""
import hashlib
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "data" / "raw"
FILES = {
    "ses_sp_sumare_censo_2022_2026-10-23.json":
        "a410756ac28efb50ee73640b67a9471ff0804f435bb7a76aeb76b718fa95f88a",
    "ibge_cidades_adicionais_2026-10-23.json":
        "146a12b9a7050b6f2c8ad8a02a21dbe099a7447d59a6b26c5ed2bce20d3771db",
}


class EvidenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.records = {}
        for filename, expected in FILES.items():
            raw = (ROOT / filename).read_bytes()
            if hashlib.sha256(raw).hexdigest() != expected:
                raise AssertionError(f"{filename}: SHA-256 alterado")
            cls.records[filename] = json.loads(raw)

    def test_provenance_and_no_false_original_claim(self):
        for filename, source in self.records.items():
            with self.subTest(file=filename):
                self.assertEqual(source["municipality_code"], "3552403")
                self.assertTrue(source["source_url"].startswith("https://"))
                self.assertIs(source["original_file_preserved"], False)
                self.assertEqual(len(source["measurements"]),
                                 len({m["id"] for m in source["measurements"]}))

    def test_demographic_totals(self):
        ms = {m["id"]: m["value"] for m in self.records[
            "ses_sp_sumare_censo_2022_2026-10-23.json"]["measurements"]}
        self.assertEqual(ms["populacao-homens-2022"] + ms["populacao-mulheres-2022"], 279545)
        self.assertEqual(sum(ms[k] for k in (
            "populacao-0-14-anos-2022", "populacao-15-64-anos-2022",
            "populacao-65-mais-2022")), 279545)
        self.assertEqual(round((279545 / 241311 - 1) * 100, 4),
                         ms["crescimento-intercensitario-2010-2022"])
        self.assertEqual(round(216905 / (216905 + 7869) * 100, 1),
                         ms["taxa-alfabetizacao-15-mais-2022"])

    def test_catalog_stages_only_uncontested_candidates(self):
        from scripts import pipeline
        catalog = pipeline.load(pipeline.CATALOG)
        ids = [i["id"] for i in catalog["indicators"]]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual(len(ids), 19)
        self.assertNotIn("escolarizacao-6-14-anos-2022", ids)
        self.assertIn("residentes-conta-propria-2022", ids)
        self.assertIn("pib-municipal-2023", ids)
        self.assertEqual(len(pipeline.validate()[1]), 3)

    def test_ibge_schooling_must_keep_discrepancy(self):
        ms = {m["id"]: m for m in self.records[
            "ibge_cidades_adicionais_2026-10-23.json"]["measurements"]}
        self.assertEqual(ms["densidade-demografica-2022"]["value"], 1821.56)
        self.assertEqual(ms["escolarizacao-6-14-anos-2022"]["value"], 98.62)
        self.assertIn("2010", ms["escolarizacao-6-14-anos-2022"]["methodological_flag"])


if __name__ == "__main__":
    unittest.main()
