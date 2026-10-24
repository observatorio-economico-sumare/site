"""Validação offline dos sete candidatos adicionais do Censo 2022."""
import hashlib
import json
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts import pipeline
from scripts.oes_coleta.validar_sidra import validate_sidra

ROOT = Path(__file__).resolve().parents[1]
STAGED = ROOT / "data/review/indicadores_censo_2022_pendentes.json"


class CensusCandidateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.proposal = json.loads(STAGED.read_text(encoding="utf-8"))
        cls.rows = cls.proposal["candidates"]
        cls.by_id = {x["id"]: x for x in cls.rows}

    def test_original_hashes_and_every_sidra_row(self):
        expected = {
            "sidra_10261_ocupacao_2022.json": "b645ee393a93aa9bcb6e14589c6d82d1d7f40400cd5dc1203c51ab8ac95a7c44",
            "sidra_10061_escolaridade_2022.json": "8a8ae482d8f8282a64a81178d0f6c33db9f7a5f5e99438e877cf6ba278fdbe45"
        }
        for record in self.rows:
            with self.subTest(indicator=record["id"]):
                evidence = record["evidence"]
                path = ROOT / evidence["raw_path"]
                raw = path.read_bytes()
                self.assertEqual(hashlib.sha256(raw).hexdigest(), evidence["sha256"])
                self.assertEqual(evidence["sha256"], expected[path.name])
                validate_sidra(json.loads(raw), record, record["source"])

    def test_schooling_categories_and_one_person_rounding_difference(self):
        expected = {
            "escolaridade-sem-instrucao-fundamental-incompleto-2022": 54968,
            "escolaridade-fundamental-completo-medio-incompleto-2022": 32641,
            "escolaridade-medio-completo-superior-incompleto-2022": 97609,
            "escolaridade-superior-completo-2022": 28211,
        }
        for key, value in expected.items():
            self.assertEqual(self.by_id[key]["value"], value)
        self.assertEqual(213430 - sum(expected.values()), 1)

    def test_work_groups_are_distinct_not_total_informality(self):
        self.assertEqual(self.by_id["pessoas-ocupadas"]["value"], 132925)
        self.assertEqual(self.by_id["empregados-privados-sem-carteira-2022"]["value"], 9095)
        self.assertEqual(self.by_id["trabalhadores-domesticos-sem-carteira-2022"]["value"], 2103)
        self.assertEqual(
            len({self.by_id[key]["evidence"]["row_selector"]["D4C"] for key in
                 ("pessoas-ocupadas", "empregados-privados-sem-carteira-2022",
                  "trabalhadores-domesticos-sem-carteira-2022")}), 3)

    def test_pending_proposal_cannot_appear_in_publication(self):
        self.assertFalse(self.proposal["publication_allowed"])
        self.assertEqual(len(self.rows), 7)
        self.assertEqual(len(self.by_id), 7)
        self.assertTrue(all(x["status"] == "pending_review" and x["reviewed_at"] is None
                            for x in self.rows))
        current = pipeline.load(pipeline.INPUT)
        current_ids = {x["id"] for x in current["indicators"]}
        self.assertEqual(len(current_ids), 13)
        self.assertTrue(current_ids.isdisjoint(self.by_id))
        with patch.object(pipeline, "INPUT", STAGED):
            with self.assertRaises(ValueError):
                pipeline.validate()

    def test_staging_can_be_validated_without_editing_published_data(self):
        import tempfile
        original = pipeline.INPUT.read_bytes()
        current = pipeline.load(pipeline.INPUT)["indicators"]
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / "stage.json"
            prepared = []
            for x in self.rows:
                record = dict(x)
                record["status"] = "validated"
                record["reviewed_at"] = "2026-10-23"
                record["reviewed_by"] = "Verificação técnica automatizada (sem aprovação de publicação)"
                prepared.append(record)
            target.write_text(json.dumps({"indicators": current + prepared}, ensure_ascii=False), encoding="utf-8")
            with patch.object(pipeline, "INPUT", target):
                _, validated = pipeline.validate()
                self.assertEqual(len(validated), 20)
        self.assertEqual(original, pipeline.INPUT.read_bytes())


if __name__ == "__main__":
    unittest.main()
