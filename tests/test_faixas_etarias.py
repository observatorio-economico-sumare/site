"""Reproduz as sete faixas diretamente do JSON original IBGE/SIDRA, sem proporções."""
import hashlib
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "site/data/faixas-etarias-2022.json"


class AgeGroupsCensusTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads(PATH.read_text(encoding="utf-8"))
        ev = cls.data["evidence"]
        raw_path = (ROOT / ev["raw_path"]).resolve()
        if not raw_path.is_relative_to((ROOT / "data/raw").resolve()):
            raise AssertionError("Arquivo original fora do diretório de evidências")
        raw = raw_path.read_bytes()
        assert hashlib.sha256(raw).hexdigest() == ev["sha256"], "SHA-256 original divergente"
        cls.rows = json.loads(raw)

    def test_official_source_and_total(self):
        d = self.data
        self.assertEqual((d["municipality_code"], d["reference_year"], d["total"]),
                         ("3552403", 2022, 279545))
        self.assertEqual(d["evidence"]["sha256"],
                         "e9bda4de02448cad2f3bc877c6dc5231e6c3393a53db6e96ffaf89027f7bf1c0")
        self.assertEqual(d["source"]["table"], "SIDRA 9514")
        self.assertEqual(d["source"]["url"],
                         "https://apisidra.ibge.gov.br/values/t/9514/n6/3552403/p/2022/v/93/c2/6794/c287/all/c286/113635?formato=json")
        valid = [r for r in self.rows[1:] if r.get("NC") == "6" and
                 r.get("MN") == "Pessoas" and r.get("D1C") == "3552403" and
                 r.get("D2C") == "2022" and r.get("D3C") == "93" and
                 r.get("D4C") == "6794" and r.get("D6C") == "113635"]
        self.assertEqual(len(valid), len(self.rows) - 1)
        total = [r for r in valid if r["D5N"] == "Total"]
        self.assertEqual(len(total), 1)
        self.assertEqual(int(total[0]["V"]), d["total"])
        published = json.loads((ROOT / "data/processed/indicators.json").read_text(encoding="utf-8"))
        census = next(x for x in published["indicators"] if x["id"] == "populacao-censo-2022")
        self.assertEqual(census["value"], d["total"])

    def test_seven_groups_use_all_official_quinquennial_categories_once(self):
        source = {r["D5C"]: r for r in self.rows[1:] if
                  re.fullmatch(r"\d+ a \d+ anos|100 anos ou mais", r.get("D5N", ""))}
        # Registros de cinco anos (inclusive a categoria final 100+).
        self.assertEqual(len(source), 21)
        expected = [("0-14", 54771), ("15-24", 39333),
                    ("25-34", 44718), ("35-44", 49496),
                    ("45-54", 37502), ("55-64", 28387),
                    ("65+", 25338)]
        bands = self.data["bands"]
        self.assertEqual([(x["label"], x["value"]) for x in bands], expected)
        used = []
        for band in bands:
            codes = band["sidra_age_codes"]
            self.assertTrue(codes)
            self.assertEqual(sum(int(source[code]["V"]) for code in codes), band["value"])
            used.extend(codes)
        self.assertEqual(len(used), len(set(used)), "Grupo de idade contado duas vezes")
        self.assertEqual(set(used), set(source), "Categorias originais omitidas")
        self.assertEqual(sum(x["value"] for x in bands), 279545)

    def test_individual_ages_five_to_seven_are_not_estimated(self):
        ages = {r["D5N"]: int(r["V"]) for r in self.rows[1:]
                if r.get("D5N") in ("5 anos", "6 anos", "7 anos")}
        self.assertEqual(ages, {"5 anos": 3859, "6 anos": 3741, "7 anos": 3780})
        self.assertEqual(sum(ages.values()), 11380)


if __name__ == "__main__":
    unittest.main()
