#!/usr/bin/env python3
"""OES: publicação somente após validação. Sem dependências externas."""
import argparse
import hashlib
import json
import math
import os
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

if __package__:
    from .oes_coleta.validar_sidra import validate_sidra
else:
    from oes_coleta.validar_sidra import validate_sidra

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data/catalog.json"
INPUT = ROOT / "data/processed/indicators.json"
OUTPUT = ROOT / "site/data/indicators.json"
RAW = (ROOT / "data/raw").resolve()
REQUIRED = {"id", "name", "definition", "topic", "value", "unit",
            "reference_period", "source", "collected_at", "updated_at",
            "reviewed_at", "reviewed_by", "method", "limitations",
            "revisions", "municipality_code", "evidence", "status"}

def load(path):
    with path.open(encoding="utf-8") as file:
        return json.load(file)

def parse_date(raw, context):
    try:
        parsed = date.fromisoformat(raw)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{context}: data inválida") from exc
    if parsed > date.today():
        raise ValueError(f"{context}: data futura")
    return parsed

def validate():
    catalog, data = load(CATALOG), load(INPUT)
    if catalog.get("municipality_code") != "3552403":
        raise ValueError("Código IBGE de Sumaré divergente")
    definitions = catalog.get("indicators")
    if not isinstance(definitions, list) or not definitions:
        raise ValueError("Catálogo inválido")
    definitions_by_id = {d["id"]: d for d in definitions}
    if len(definitions_by_id) != len(definitions):
        raise ValueError("IDs repetidos no catálogo")
    items = data.get("indicators")
    if not isinstance(items, list):
        raise ValueError("Indicadores processados devem ser uma lista")
    seen = set()
    for item in items:
        if not isinstance(item, dict):
            raise ValueError("Indicador inválido")
        key = item.get("id", "(sem ID)")
        if key in seen:
            raise ValueError(f"{key}: ID duplicado")
        seen.add(key)
        missing = REQUIRED - item.keys()
        if missing:
            raise ValueError(f"{key}: campos ausentes: {sorted(missing)}")
        if key not in definitions_by_id:
            raise ValueError(f"{key}: ausente do catálogo")
        source_meta = definitions_by_id[key]
        for field in ("name","definition","topic","unit","reference_period"):
            if item[field] != source_meta[field]:
                raise ValueError(f"{key}: {field} não corresponde ao catálogo")
        if item["status"] != "validated":
            raise ValueError(f"{key}: revisão pendente")
        if item["municipality_code"] != "3552403":
            raise ValueError(f"{key}: município incorreto")
        value = item["value"]
        if type(value) not in (int, float) or not math.isfinite(value):
            raise ValueError(f"{key}: valor inválido")
        if value < 0 and key != "saldo-vinculos-formais":
            raise ValueError(f"{key}: valor negativo não permitido")
        for field in ("method","limitations","revisions","reviewed_by"):
            if not isinstance(item[field],str) or not item[field].strip():
                raise ValueError(f"{key}: {field} obrigatório")
        collection = parse_date(item["collected_at"], key)
        update = parse_date(item["updated_at"], key)
        review = parse_date(item["reviewed_at"], key)
        if update < collection or review < collection:
            raise ValueError(f"{key}: cronologia inconsistente")
        src = item["source"]
        if not isinstance(src,dict):
            raise ValueError(f"{key}: fonte inválida")
        for field in ("institution","dataset","url","query_id"):
            if not isinstance(src.get(field),str) or not src[field].strip():
                raise ValueError(f"{key}: fonte.{field} obrigatório")
        if src["institution"] != source_meta["source_institution"] or src["dataset"] != source_meta["source_dataset"]:
            raise ValueError(f"{key}: fonte divergente do catálogo")
        url = urlparse(src["url"])
        if url.scheme != "https" or not url.netloc or url.username or url.password:
            raise ValueError(f"{key}: URL de fonte inválida")
        ev = item["evidence"]
        if not isinstance(ev,dict) or not ev.get("raw_path") or not ev.get("sha256"):
            raise ValueError(f"{key}: prova de origem ausente")
        path = (ROOT / ev["raw_path"]).resolve()
        if not path.is_relative_to(RAW) or not path.is_file():
            raise ValueError(f"{key}: arquivo de origem ausente ou fora de data/raw")
        if hashlib.sha256(path.read_bytes()).hexdigest() != ev["sha256"]:
            raise ValueError(f"{key}: hash SHA-256 divergente")
        # Arquivo de evidência é uma transcrição documentada, não o download original.
        snapshot = load(path)
        if ev.get("capture_method") == "arquivo_original_api_sidra":
            validate_sidra(snapshot, item, src)
            continue
        if snapshot.get("capture_method") != ev.get("capture_method"):
            raise ValueError(f"{key}: método de captura da evidência divergente")
        if snapshot.get("municipality_code") != item["municipality_code"]:
            raise ValueError(f"{key}: município não corresponde à evidência")
        if snapshot.get("source_institution") != src["institution"]:
            raise ValueError(f"{key}: instituição não corresponde à evidência")
        if snapshot.get("source_url") != src["url"]:
            raise ValueError(f"{key}: URL de fonte não corresponde à evidência")
        if snapshot.get("original_file_preserved") is not False:
            raise ValueError(f"{key}: tipo de evidência não documentado")
        measures = [v for v in snapshot.get("measurements",[]) if v.get("id")==key]
        if len(measures) != 1:
            raise ValueError(f"{key}: medição não identificada unicamente na evidência")
        measurement = measures[0]
        if (measurement.get("value") != value or
                measurement.get("period") != item["reference_period"] or
                measurement.get("unit") != item["unit"]):
            raise ValueError(f"{key}: valor, período ou unidade divergem da evidência")
    return catalog, items

def build():
    _, items = validate()  # nunca substituir a última versão antes de validar tudo
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    tmp = OUTPUT.with_suffix(".json.tmp")
    try:
        tmp.write_text(json.dumps({"indicators":items},ensure_ascii=False,indent=2,allow_nan=False)+"\n",encoding="utf-8")
        os.replace(tmp, OUTPUT)
    finally:
        tmp.unlink(missing_ok=True)
    print(f"Publicação preparada: {len(items)} indicadores validados")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("command",choices=["validate","build"])
    args = parser.parse_args()
    try:
        if args.command == "validate":
            _, items = validate()
            print(f"Verificação concluída: {len(items)} indicadores validados")
        else:
            build()
    except (ValueError,KeyError,TypeError,OSError,json.JSONDecodeError) as exc:
        print(f"PUBLICAÇÃO BLOQUEADA: {exc}",file=sys.stderr)
        sys.exit(1)
