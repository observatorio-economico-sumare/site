"""Auditoria offline das candidatas do Censo e da série anual RAIS."""
import hashlib
import json
import unittest
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

from scripts import pipeline

ROOT = Path(__file__).resolve().parents[1]
REVIEW = ROOT / "data/review/censo_2022_pendencias.json"


def selection(rows, selector):
    matches = [
        row for row in rows[1:]
        if row.get("NC") == "6" and
        all(row.get(field) == value for field, value in selector.items())
    ]
    if len(matches) != 1:
        raise ValueError("SIDRA: linha municipal não identificada unicamente")
    if matches[0].get("MN") != "Pessoas":
        raise ValueError("SIDRA: unidade incompatível")
    return int(matches[0]["V"])


class PendingCensusEvidenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.review = json.loads(REVIEW.read_text(encoding="utf-8"))
        cls.candidates = {x["id"]: x for x in cls.review["indicators"]}
        cls.published = {x["id"]: x for x in pipeline.validate()[1]}

    def raw_rows(self, item):
        path = ROOT / item["evidence"]["raw_path"]
        self.assertTrue(path.resolve().is_relative_to((ROOT / "data/raw").resolve()))
        raw = path.read_bytes()
        self.assertEqual(hashlib.sha256(raw).hexdigest(), item["evidence"]["sha256"])
        self.assertEqual(item["source"]["institution"], "IBGE")
        self.assertIn("apisidra.ibge.gov.br/values/", item["source"]["url"])
        rows = json.loads(raw)
        self.assertEqual(rows[0]["D1C"], "Município (Código)")
        return rows

    def test_status_and_publication_gates(self):
        self.assertFalse(self.review["publication_allowed"])
        self.assertEqual(self.review["municipality_code"], "3552403")
        for key in ("pessoas-desocupadas", "previdencia-ocupados"):
            self.assertIn(key, self.candidates)
            self.assertNotIn(key, self.published)
            self.assertTrue(self.candidates[key]["en"]["definition"])
        site_data = json.loads((ROOT / "site/data/indicators.json").read_text(encoding="utf-8"))
        self.assertEqual(site_data["indicators"], list(self.published.values()))

    def test_unemployed_is_not_outside_labor_force(self):
        x = self.candidates["pessoas-desocupadas"]
        rows = self.raw_rows(x)
        self.assertEqual(selection(rows, x["evidence"]["row_selector"]), x["value"])
        common = {k:v for k,v in x["evidence"]["row_selector"].items() if k!="D4C"}
        labor = selection(rows, {**common,"D4C":"32386"})
        occupied = selection(rows, {**common,"D4C":"32387"})
        outside = selection(rows, {**common,"D4C":"32447"})
        self.assertEqual(labor - occupied, 8170)
        self.assertEqual(occupied, self.published["pessoas-ocupadas"]["value"])
        self.assertNotEqual(x["value"], outside)

    def test_social_security_ratio_uses_main_job(self):
        x = self.candidates["previdencia-ocupados"]
        rows = self.raw_rows(x)
        yes = selection(rows, x["evidence"]["numerator_selector"])
        all_occupied = selection(rows, x["evidence"]["denominator_selector"])
        no_selector = {**x["evidence"]["numerator_selector"],"D4C":"15351"}
        no = selection(rows, no_selector)
        self.assertEqual((yes, all_occupied, no), (103576, 132925, 29349))
        self.assertEqual(yes + no, all_occupied)
        self.assertEqual(all_occupied, self.published["pessoas-ocupadas"]["value"])
        share = (Decimal(yes) * 100 / Decimal(all_occupied)).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        self.assertEqual(share, Decimal(str(x["value"])))

    def test_rais_yearly_series_stays_annual_and_reconciled(self):
        series = self.review["historical_series"]
        self.assertEqual(series["reference_years"], [2023, 2024, 2025])
        raw = json.loads((ROOT / series["source_raw_path"]).read_text(encoding="utf-8"))
        for year, value in zip(series["reference_years"], series["values"]):
            sector_data = raw["yearly_values"][str(year)]
            self.assertEqual(value, sector_data["total"])
            self.assertEqual(value, sum(v for k,v in sector_data.items() if k!="total"))


if __name__ == "__main__":
    unittest.main()
