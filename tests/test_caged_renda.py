"""Validation of original IBGE incomes and official municipal CAGED report."""
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts import pipeline

ROOT = Path(__file__).resolve().parents[1]
REVIEW = ROOT / "data/review/caged_renda_pendentes.json"
CAGED = ROOT / "data/raw/caged_sumare_2026-08_boletim.json"
SIDRA = ROOT / "data/raw/sidra_10280_rendimentos_2022.json"


class CagedIncomeTests(unittest.TestCase):
    def setUp(self):
        self.caged = json.loads(CAGED.read_text(encoding="utf-8"))
        self.sidra = json.loads(SIDRA.read_text(encoding="utf-8"))
        self.proposal = json.loads(REVIEW.read_text(encoding="utf-8"))
        self.by_id = {r["id"]: r for r in self.proposal["indicators"]}

    def test_original_sidra_sha_and_income_line(self):
        self.assertEqual(hashlib.sha256(SIDRA.read_bytes()).hexdigest(),
                         "9c697390a5c529f297ee2297b2993b360175e1c8901a92c2c7f0b7ba7bbe1c35")
        self.assertEqual(len(self.sidra), 5)
        self.assertEqual({(row["D3C"], row["V"]) for row in self.sidra[1:]},
                         {("13535", "132465"), ("1013535", "100.00"),
                          ("13536", "2791.46"), ("13537", "2000.00")})
        self.assertEqual(self.by_id["renda-media-ocupados"]["value"], 2791.46)
        self.assertEqual(self.by_id["renda-mediana-ocupados-2022"]["value"], 2000)

    def test_caged_arithmetic_and_distinct_reference_periods(self):
        self.assertEqual(hashlib.sha256(CAGED.read_bytes()).hexdigest(),
                         "65280b527b5ea9007cab31d39ac459280d05b66abfdfd62ea8545f0b144e5b6b")
        months = self.caged["periods"]
        jan_aug = months["2026-01/2026-08"]
        aug = months["2026-08"]
        self.assertEqual(jan_aug["admissoes"] - jan_aug["desligamentos"], 3303)
        self.assertEqual(sum(jan_aug["saldo_setores"].values()), 3303)
        self.assertEqual(aug["admissoes"] - aug["desligamentos"], 374)
        self.assertEqual(sum(aug["estoque_setores"].values()), 67739)
        self.assertEqual(self.by_id["estoque-vinculos-formais"]["value"], 67739)
        self.assertEqual(self.by_id["saldo-vinculos-formais"]["value"], 3303)
        self.assertEqual(self.by_id["saldo-vinculos-formais-2026-08"]["value"], 374)

    def test_staged_records_do_not_change_production(self):
        original_site = pipeline.OUTPUT.read_bytes()
        original_input = pipeline.INPUT.read_bytes()
        self.assertIs(self.proposal["publication_allowed"], False)
        self.assertEqual(len(self.proposal["indicators"]), 5)
        self.assertTrue(all(r["status"] == "pending_review" for r in self.proposal["indicators"]))
        with tempfile.TemporaryDirectory() as tmp:
            f = Path(tmp) / "merged.json"
            current = json.loads(original_input)["indicators"]
            pending = self.proposal["indicators"]
            self.assertTrue(set(x["id"] for x in current).isdisjoint(
                            x["id"] for x in pending))
            merged = [dict(r, status="validated", reviewed_at="2026-10-23",
                           reviewed_by="Revisão técnica automatizada, sem publicação")
                      for r in pending]
            f.write_text(json.dumps({"indicators": current + merged}, ensure_ascii=False),
                         encoding="utf-8")
            with patch.object(pipeline, "INPUT", f):
                _, items = pipeline.validate()
                self.assertEqual(len(items), len(current) + 5)
        self.assertEqual(pipeline.OUTPUT.read_bytes(), original_site)
        self.assertEqual(pipeline.INPUT.read_bytes(), original_input)


if __name__ == "__main__":
    unittest.main()
