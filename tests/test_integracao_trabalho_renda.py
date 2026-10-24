"""Cross-source checks for the consolidated municipal indicators release."""
import hashlib
import json
import unittest
from pathlib import Path

from scripts import pipeline

ROOT = Path(__file__).resolve().parents[1]


class ConsolidatedIndicatorsTests(unittest.TestCase):
    def test_2022_census_income_and_labor_are_distinct(self):
        values = {x["id"]: x for x in pipeline.validate()[1]}
        self.assertEqual(values["pessoas-ocupadas"]["value"], 132925)
        self.assertEqual(values["renda-media-ocupados"]["value"], 2791.46)
        self.assertEqual(values["renda-mediana-ocupados-2022"]["value"], 2000)
        self.assertEqual(values["renda-media-ocupados"]["reference_period"], "2022")
        self.assertEqual(values["renda-media-ocupados"]["evidence"]["sha256"],
                         "9c697390a5c529f297ee2297b2993b360175e1c8901a92c2c7f0b7ba7bbe1c35")
        raw = ROOT / "data/raw/sidra_10280_rendimentos_2022.json"
        self.assertEqual(hashlib.sha256(raw.read_bytes()).hexdigest(),
                         values["renda-media-ocupados"]["evidence"]["sha256"])
        rows = json.loads(raw.read_text(encoding="utf-8"))
        self.assertEqual(next(x["V"] for x in rows if x.get("D3C") == "13535"), "132465")
        self.assertNotEqual(132465, 132925)  # workers with income differ from all employed

    def test_2022_education_rounding_and_2025_rais_sector_total(self):
        v = {x["id"]: x["value"] for x in pipeline.validate()[1]}
        education = (
            "escolaridade-sem-instrucao-fundamental-incompleto-2022",
            "escolaridade-fundamental-completo-medio-incompleto-2022",
            "escolaridade-medio-completo-superior-incompleto-2022",
            "escolaridade-superior-completo-2022"
        )
        self.assertEqual(sum(v[x] for x in education), 213429)
        sectors = ("agropecuaria", "industria", "construcao", "comercio", "servicos")
        self.assertEqual(sum(v["rais-vinculos-" + x + "-2025"] for x in sectors),
                         v["rais-vinculos-formais-2025"])
        self.assertEqual(v["rais-vinculos-formais-2025"], 75421)

    def test_2026_caged_uses_secondary_official_source(self):
        v = {x["id"]: x for x in pipeline.validate()[1]}
        self.assertEqual(v["saldo-vinculos-formais"]["value"], 3303)
        self.assertEqual(v["estoque-vinculos-formais"]["value"], 67739)
        self.assertEqual(v["saldo-vinculos-formais-2026-08"]["value"], 374)
        self.assertNotEqual(v["estoque-vinculos-formais"]["value"],
                            v["rais-vinculos-formais-2025"]["value"])
        for key in ("saldo-vinculos-formais", "estoque-vinculos-formais",
                    "saldo-vinculos-formais-2026-08"):
            entry = v[key]
            self.assertEqual(entry["source"]["institution"],
                             "Prefeitura Municipal de Sumaré (compilação MTE)")
            self.assertIs(entry["evidence"]["original_file_preserved"], False)
        evidence = json.loads((ROOT / "data/raw/caged_sumare_2026-08_boletim.json").read_text())
        self.assertEqual(sum(evidence["periods"]["2026-08"]["estoque_setores"].values()), 67739)
        self.assertEqual(sum(evidence["periods"]["2026-01/2026-08"]["saldo_setores"].values()), 3303)

    def test_compact_catalog_and_unchanged_base_indicators(self):
        catalog, rows = pipeline.validate()
        self.assertEqual(len(rows), 34)
        self.assertEqual(len(catalog["indicators"]), 34)
        values = {x["id"]: x["value"] for x in rows}
        self.assertEqual(values["populacao-censo-2022"], 279545)
        self.assertEqual(values["pib-municipal-2023"], 19026093000)
        self.assertEqual(values["residentes-conta-propria-2022"], 32334)
        self.assertEqual(values["escolarizacao-6-14-anos-2022"], 98.62)


if __name__ == "__main__":
    unittest.main()
