"""Regressões offline: JSON SIDRA original e bloqueio de publicação."""
import copy
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts import pipeline


class SidraPipelineTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.raw_dir = self.root / "data" / "raw"
        self.raw_dir.mkdir(parents=True)
        self.raw_file = self.raw_dir / "sidra.json"
        self.catalog_file = self.root / "catalog.json"
        self.input_file = self.root / "input.json"
        self.output_file = self.root / "published.json"

        self.rows = [
            {"D1C": "Município", "D2C": "Ano", "D3C": "Variável",
             "D4C": "Posição", "D5C": "Sexo", "D6C": "Cor"},
            {"NC": "6", "MN": "Pessoas", "V": "32334", "D1C": "3552403",
             "D2C": "2022", "D3C": "4090", "D4C": "79378",
             "D5C": "6794", "D6C": "95251"}
        ]
        self.item = copy.deepcopy(pipeline.validate()[1][0])
        self.item.update({
            "id": "residentes-conta-propria-2022",
            "name": "Pessoas ocupadas por conta própria",
            "definition": "Residentes ocupados de 14 anos ou mais por conta própria",
            "topic": "trabalho",
            "source_institution": "IBGE",
            "source_dataset": "Censo 2022",
            "reference_period": "2022",
            "value": 32334,
            "source": {
                "institution": "IBGE", "dataset": "Censo 2022",
                "url": "https://apisidra.ibge.gov.br/values/t/10261/n6/3552403/p/2022/v/4090/c11913/all?formato=json",
                "query_id": "10261 v4090 c11913=79378"
            },
            "evidence": {
                "raw_path": "data/raw/sidra.json",
                "sha256": "",
                "capture_method": "arquivo_original_api_sidra",
                "original_file_preserved": True,
                "row_selector": {"D1C": "3552403", "D2C": "2022",
                                 "D3C": "4090", "D4C": "79378",
                                 "D5C": "6794", "D6C": "95251"},
                "value_multiplier": 1
            }
        })

    def write(self, *, recalculate_hash=True):
        raw = (json.dumps(self.rows, ensure_ascii=False) + "\n").encode("utf-8")
        self.raw_file.write_bytes(raw)
        if recalculate_hash:
            self.item["evidence"]["sha256"] = hashlib.sha256(raw).hexdigest()
        self.catalog_file.write_text(json.dumps({
            "municipality_code": "3552403",
            "indicators": [{key: self.item[key] for key in
                            ("id", "name", "definition", "topic", "unit",
                             "reference_period", "source_institution", "source_dataset")}]
        }), encoding="utf-8")
        self.input_file.write_text(json.dumps({"indicators": [self.item]}), encoding="utf-8")

    def validate(self):
        with (patch.object(pipeline, "ROOT", self.root),
              patch.object(pipeline, "RAW", self.raw_dir),
              patch.object(pipeline, "CATALOG", self.catalog_file),
              patch.object(pipeline, "INPUT", self.input_file),
              patch.object(pipeline, "OUTPUT", self.output_file)):
            return pipeline.validate()

    def test_original_sidra_row_is_accepted(self):
        self.write()
        _, items = self.validate()
        self.assertEqual(items[0]["value"], 32334)

    def test_original_sidra_pib_with_explicit_thousand_reais(self):
        self.rows = [
            {"D1C": "Município", "D2C": "Ano", "D3C": "Variável"},
            {"NC": "6", "MN": "Mil Reais", "V": "19026093",
             "D1C": "3552403", "D2C": "2023", "D3C": "37"}
        ]
        self.item.update({"id": "pib-municipal-2023", "value": 19026093000,
                          "unit": "R$", "reference_period": "2023"})
        self.item["source"]["url"] = "https://apisidra.ibge.gov.br/values/t/5938/n6/3552403/p/2023/v/37?formato=json"
        self.item["evidence"]["row_selector"] = {"D1C": "3552403",
                                                 "D2C": "2023", "D3C": "37"}
        self.item["evidence"]["value_multiplier"] = 1000
        self.write()
        self.validate()

    def test_wrong_category_and_incomplete_dimensions_are_blocked(self):
        for change in ("wrong_category", "missing_dimension", "wrong_period", "wrong_municipality"):
            with self.subTest(case=change):
                original = copy.deepcopy(self.item)
                if change == "wrong_category":
                    self.item["evidence"]["row_selector"]["D4C"] = "45937"
                elif change == "missing_dimension":
                    del self.item["evidence"]["row_selector"]["D6C"]
                elif change == "wrong_period":
                    self.item["evidence"]["row_selector"]["D2C"] = "2021"
                else:
                    self.item["evidence"]["row_selector"]["D1C"] = "3550308"
                self.write()
                with self.assertRaises(ValueError):
                    self.validate()
                self.item = original

    def test_invalid_numeric_unit_and_source_are_blocked(self):
        for change in ("wrong_value", "wrong_unit", "wrong_host", "wrong_url_variable", "duplicate_row"):
            with self.subTest(case=change):
                item, rows = copy.deepcopy(self.item), copy.deepcopy(self.rows)
                if change == "wrong_value":
                    self.item["value"] += 1
                elif change == "wrong_unit":
                    self.item["evidence"]["value_multiplier"] = 1000
                elif change == "wrong_host":
                    self.item["source"]["url"] = "https://example.com/values/t/10261/n6/3552403/p/2022/v/4090"
                elif change == "wrong_url_variable":
                    self.item["source"]["url"] = "https://apisidra.ibge.gov.br/values/t/10261/n6/3552403/p/2022/v/999"
                else:
                    self.rows.append(copy.deepcopy(self.rows[1]))
                self.write()
                with self.assertRaises(ValueError):
                    self.validate()
                self.item, self.rows = item, rows

    def test_pending_review_never_publishes(self):
        self.item["status"] = "pending_review"
        self.write()
        self.output_file.write_text("VERSAO_ANTERIOR", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "revisão pendente"):
            self.validate()
        self.assertEqual(self.output_file.read_text(encoding="utf-8"), "VERSAO_ANTERIOR")

    def test_tampered_raw_hash_is_blocked(self):
        self.write()
        self.item["evidence"]["sha256"] = "0" * 64
        self.write(recalculate_hash=False)
        with self.assertRaisesRegex(ValueError, "SHA-256 divergente"):
            self.validate()


if __name__ == "__main__":
    unittest.main()
