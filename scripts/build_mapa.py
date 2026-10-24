#!/usr/bin/env python3
"""Generate the OES regional population map from IBGE 2022 official exports.

Build-only dependency: pyshp (pip install pyshp==2.3.1).
No library is required to serve or interact with the published map.
"""
import csv
import hashlib
import io
import json
import urllib.request
import zipfile
from pathlib import Path

import shapefile

MUNICIPIO = "3552403"
CENSO_MUNICIPIO = 279545
BASE_CSV = "https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/Agregados_por_Bairro_csv/Agregados_por_bairros_basico_BR_20260520.zip"
BASE_SHP = "https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_de_setores_censitarios__divisoes_intramunicipais/censo_2022/bairros/shp/UF/SP_bairros_CD2022.zip"
SHORT_NAMES = {
    "3552403001": "Centro",
    "3552403002": "Nova Veneza",
    "3552403003": "Matão",
    "3552403004": "Área Cura",
    "3552403005": "Maria Antônia",
    "3552403006": "Picerno",
}


def download(url):
    with urllib.request.urlopen(url, timeout=90) as response:
        return response.read()


def build(target):
    csv_bytes = download(BASE_CSV)
    shp_bytes = download(BASE_SHP)
    tab = zipfile.ZipFile(io.BytesIO(csv_bytes))
    with tab.open("Agregados_por_bairros_basico_BR.csv") as handle:
        rows = csv.DictReader(io.TextIOWrapper(handle, encoding="cp1252"), delimiter=";")
        population = {row["CD_BAIRRO"]: row for row in rows if row["CD_MUN"] == MUNICIPIO}
    assert set(population) == set(SHORT_NAMES), "IBGE bairro codes changed; review required"

    archive = zipfile.ZipFile(io.BytesIO(shp_bytes))
    prefix = "SP_bairros_CD2022."
    reader = shapefile.Reader(
        shp=io.BytesIO(archive.read(prefix+"shp")),
        shx=io.BytesIO(archive.read(prefix+"shx")),
        dbf=io.BytesIO(archive.read(prefix+"dbf")),
        encoding="utf8",
    )
    shapes = {}
    for record in reader.iterShapeRecords():
        if record.record.as_dict().get("CD_MUN") == MUNICIPIO:
            shapes[record.record.as_dict()["CD_BAIRRO"]] = record
    assert set(shapes) == set(population), "Geography does not match population table"

    features = []
    for code in sorted(population):
        row, shape = population[code], shapes[code]
        assert row["NM_BAIRRO"] == shape.record.as_dict()["NM_BAIRRO"], code
        assert row["v0001"].isdigit(), "Unpublished or suppressed population"
        geometry = shape.shape.__geo_interface__
        # Coordinate rounding is < 0.12 m; no feature, hole or vertex is removed.
        def rounded(value):
            if isinstance(value, (list, tuple)):
                return [rounded(item) for item in value]
            return round(value, 6)
        features.append({
            "type": "Feature",
            "properties": {
                "id": code,
                "name": SHORT_NAMES[code],
                "officialName": row["NM_BAIRRO"],
                "population": int(row["v0001"]),
                "year": 2022
            },
            "geometry": {"type": geometry["type"], "coordinates": rounded(geometry["coordinates"])}
        })
    total = sum(f["properties"]["population"] for f in features)
    assert total == 276846 and CENSO_MUNICIPIO-total == 2699, "Totals differ; source recheck required"

    export = {
        "type": "FeatureCollection",
        "metadata": {
            "municipalityCode": MUNICIPIO,
            "municipality": "Sumaré (SP)",
            "year": 2022,
            "classification": "Bairros (seis regiões administrativas reconhecidas pelo IBGE)",
            "field": "v0001: total de pessoas",
            "source": "IBGE · Censo Demográfico 2022 · Agregados por bairros e malha de bairros",
            "dataVersion": "2026-05-20",
            "csvUrl": BASE_CSV,
            "csvSha256": hashlib.sha256(csv_bytes).hexdigest(),
            "geographyUrl": BASE_SHP,
            "geographySha256": hashlib.sha256(shp_bytes).hexdigest(),
            "featureCount": len(features),
            "populationInAreas": total,
            "municipalityTotal": CENSO_MUNICIPIO,
            "difference": CENSO_MUNICIPIO-total,
            "geometryPrecision": "6 decimal places, no vertex simplification"
        },
        "features": features
    }
    Path(target).parent.mkdir(parents=True, exist_ok=True)
    Path(target).write_text(json.dumps(export, ensure_ascii=False, separators=(",", ":"))+"\n", encoding="utf8")
    print("features",len(features),"total",total,"difference",CENSO_MUNICIPIO-total,"bytes",Path(target).stat().st_size)
    print("csv_sha256",export["metadata"]["csvSha256"])
    print("shp_sha256",export["metadata"]["geographySha256"])
    print("geojson_sha256",hashlib.sha256(Path(target).read_bytes()).hexdigest())


if __name__ == "__main__":
    build("site/data/mapa-regioes-2022.json")
