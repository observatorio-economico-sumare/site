"""RAIS 2025 Sumaré: checks of official table structure, recast source and publication hold."""
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts import pipeline

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data/raw/rais_2025_sumare_tabela4_2026-10-23.json"
REVIEW = ROOT / "data/review/rais_2025_pendentes.json"
SHA = "9995fd8dcf601384a8b56cda62cf4cf1095bbfc3081d69e76098e6542e60bf04"
UPSTREAM = "b53279b80448e4b5545eee3192130215727d066c62dcce7e77337921ea14efff"


class RAISResearchTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.raw = json.loads(RAW.read_text(encoding="utf-8"))
        cls.proposal = json.loads(REVIEW.read_text(encoding="utf-8"))

    def test_source_scope_and_original_workbook_hash(self):
        self.assertEqual(hashlib.sha256(RAW.read_bytes()).hexdigest(), SHA)
        self.assertEqual(self.raw["original_workbook_sha256"], UPSTREAM)
        self.assertEqual(self.raw["source_institution"], "MTE")
        self.assertEqual(self.raw["municipality_code"], "3552403")
        self.assertEqual(self.raw["rais_municipality_code"], "355240")
        self.assertEqual(self.raw["sheet"], "TABELA 4")
        self.assertEqual(self.raw["header_rows"], [13, 14])
        self.assertEqual(self.raw["municipality_row"], 3866)
        self.assertIs(self.raw["original_file_preserved"], False)

    def test_2023_2025_series_reconciles_without_adjustment(self):
        years = self.raw["yearly_values"]
        expected_totals = {"2023": 70984, "2024": 73410, "2025": 75421}
        sectors = ("agropecuaria", "industria", "construcao", "comercio", "servicos")
        for year, total in expected_totals.items():
            with self.subTest(year=year):
                self.assertEqual(years[year]["total"], total)
                self.assertEqual(sum(years[year][sector] for sector in sectors), total)
        self.assertEqual(years["2025"]["total"] - years["2024"]["total"], 2011)

    def test_2025_candidates_match_year_and_exact_source_cells(self):
        values = self.raw["yearly_values"]["2025"]
        cells = {"agropecuaria": "G3866", "industria": "L3866",
                 "construcao": "Q3866", "comercio": "V3866",
                 "servicos": "AA3866", "total": "AF3866"}
        measurements = self.raw["measurements"]
        indicators = self.proposal["indicators"]
        self.assertEqual(len(measurements), len(indicators))
        by_id = {x["id"]: x for x in indicators}
        self.assertEqual(len(by_id), 6)
        for sector, source_cell in cells.items():
            indicator_id = ("rais-vinculos-formais-2025" if sector == "total"
                            else "rais-vinculos-" + sector + "-2025")
            with self.subTest(sector=sector):
                value = values[sector]
                measure = next(m for m in measurements if m["id"] == indicator_id)
                record = by_id[indicator_id]
                self.assertEqual(measure["value"], value)
                self.assertEqual(record["value"], value)
                self.assertEqual(measure["source_cell"], source_cell)
                self.assertEqual(record["evidence"]["source_cell"], source_cell)
                self.assertEqual(record["evidence"]["sha256"], SHA)
                self.assertEqual(record["evidence"]["upstream_sha256"], UPSTREAM)

    def test_review_lock_and_unchanged_site(self):
        self.assertFalse(self.proposal["publication_allowed"])
        self.assertTrue(all(x["status"] == "pending_review" and
                            x["reviewed_at"] is None for x in self.proposal["indicators"]))
        current = pipeline.load(pipeline.INPUT)["indicators"]
        current_ids = {x["id"] for x in current}
        self.assertEqual(len(current), 13)
        self.assertTrue(current_ids.isdisjoint({x["id"] for x in self.proposal["indicators"]}))
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "candidate_input.json"
            output.write_text(json.dumps({"indicators": current + self.proposal["indicators"]}),
                              encoding="utf-8")
            with patch.object(pipeline, "INPUT", output):
                with self.assertRaisesRegex(ValueError, "revisão pendente"):
                    pipeline.validate()

    def test_reviewed_proposal_validates_without_production_write(self):
        baseline = pipeline.OUTPUT.read_bytes()
        official = pipeline.load(pipeline.INPUT)["indicators"]
        proposed = [dict(item, status="validated", reviewed_at="2026-10-23",
                         reviewed_by="Validação técnica de teste, sem aprovação editorial")
                    for item in self.proposal["indicators"]]
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / "proposed.json"
            file.write_text(json.dumps({"indicators": official + proposed},
                                      ensure_ascii=False), encoding="utf-8")
            with patch.object(pipeline, "INPUT", file):
                _, validated = pipeline.validate()
                self.assertEqual(len(validated), 19)
        self.assertEqual(pipeline.OUTPUT.read_bytes(), baseline)


if __name__ == "__main__":
    unittest.main()
