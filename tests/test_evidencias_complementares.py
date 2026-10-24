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

    def test_sidra_originals_have_expected_hashes(self):
        from scripts.oes_coleta.validar_sidra import validate_sidra
        candidates = [
            ("sidra_10261_ocupacao_2022.json",
             "b645ee393a93aa9bcb6e14589c6d82d1d7f40400cd5dc1203c51ab8ac95a7c44",
             32334, "pessoas", "2022",
             {"D1C": "3552403", "D2C": "2022", "D3C": "4090",
              "D4C": "79378", "D5C": "6794", "D6C": "95251"}, 1,
             "https://apisidra.ibge.gov.br/values/t/10261/n6/3552403/p/2022/v/4090/c11913/all?formato=json"),
            ("sidra_5938_pib_2023.json",
             "64b19e9b71f4c0180aaee551567dd82030bb2feb82a99aed9fd591bb23ae99f5",
             19026093000, "R$", "2023",
             {"D1C": "3552403", "D2C": "2023", "D3C": "37"}, 1000,
             "https://apisidra.ibge.gov.br/values/t/5938/n6/3552403/p/2023/v/37?formato=json")
        ]
        for filename, digest, value, unit, period, selector, factor, url in candidates:
            with self.subTest(file=filename):
                raw = (ROOT / filename).read_bytes()
                self.assertEqual(hashlib.sha256(raw).hexdigest(), digest)
                validate_sidra(json.loads(raw),
                               {"value": value, "unit": unit, "reference_period": period,
                                "municipality_code": "3552403",
                                "evidence": {"original_file_preserved": True,
                                             "row_selector": selector,
                                             "value_multiplier": factor}},
                               {"institution": "IBGE", "url": url})

    def test_review_candidates_cannot_be_published(self):
        from unittest.mock import patch
        from scripts import pipeline
        path = ROOT.parent / "review" / "sidra_candidates.json"
        proposal = json.loads(path.read_text(encoding="utf-8"))
        self.assertIs(proposal["publication_allowed"], False)
        self.assertEqual({x["id"] for x in proposal["indicators"]},
                         {"residentes-conta-propria-2022", "pib-municipal-2023"})
        catalog = {x["id"]: x for x in pipeline.load(pipeline.CATALOG)["indicators"]}
        for item in proposal["indicators"]:
            self.assertEqual(item["status"], "pending_review")
            self.assertIsNone(item["reviewed_at"])
            self.assertEqual(item["definition"], catalog[item["id"]]["definition"])
            raw = (pipeline.ROOT / item["evidence"]["raw_path"]).read_bytes()
            self.assertEqual(hashlib.sha256(raw).hexdigest(), item["evidence"]["sha256"])
        with patch.object(pipeline, "INPUT", path):
            with self.assertRaisesRegex(ValueError, "revisão pendente"):
                pipeline.validate()

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
