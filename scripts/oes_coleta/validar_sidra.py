"""Validação estrita de uma medida reproduzível em JSON original do SIDRA."""
import re
from decimal import Decimal, InvalidOperation
from urllib.parse import urlparse


def validate_sidra(rows, indicator, source):
    evidence = indicator["evidence"]
    if evidence.get("original_file_preserved") is not True:
        raise ValueError("SIDRA: arquivo original não identificado")
    url = urlparse(source["url"])
    segments = url.path.strip("/").split("/")
    if (source["institution"] != "IBGE" or
            url.hostname != "apisidra.ibge.gov.br" or
            len(segments) < 9 or segments[:2] != ["values", "t"]):
        raise ValueError("SIDRA: origem não reconhecida")

    selector = evidence.get("row_selector")
    if not isinstance(rows, list) or len(rows) < 2 or not isinstance(rows[0], dict):
        raise ValueError("SIDRA: JSON original inválido")
    dimensions = {key for key in rows[0] if re.fullmatch(r"D[1-9][0-9]*C", key)}
    if (not isinstance(selector, dict) or
            set(selector) != dimensions or
            not {"D1C", "D2C", "D3C"} <= dimensions or
            not all(isinstance(v, str) and v for v in selector.values())):
        raise ValueError("SIDRA: dimensões devem ser identificadas integralmente")
    if (selector["D1C"] != indicator["municipality_code"] or
            selector["D2C"] != indicator["reference_period"]):
        raise ValueError("SIDRA: município ou período divergente")

    try:
        if (segments[3:5] != ["n6", selector["D1C"]] or
                segments[segments.index("p") + 1] != selector["D2C"] or
                segments[segments.index("v") + 1] != selector["D3C"]):
            raise ValueError("SIDRA: URL não corresponde à seleção")
    except (ValueError, IndexError) as exc:
        raise ValueError("SIDRA: consulta incompleta") from exc

    expected = {("Pessoas", "pessoas"): 1, ("Mil Reais", "R$"): 1000, ("Reais", "R$"): 1}
    matches = [row for row in rows[1:] if isinstance(row, dict) and
               row.get("NC") == "6" and
               all(row.get(key) == value for key, value in selector.items())]
    if len(matches) != 1:
        raise ValueError("SIDRA: seleção não identifica uma linha única")
    row = matches[0]
    factor = expected.get((row.get("MN"), indicator["unit"]))
    if factor is None or evidence.get("value_multiplier") != factor:
        raise ValueError("SIDRA: unidade ou conversão incompatível")
    try:
        value = Decimal(str(row["V"]).replace(",", ".")) * factor
        observed = Decimal(str(indicator["value"]))
    except (InvalidOperation, KeyError, TypeError) as exc:
        raise ValueError("SIDRA: valor não numérico") from exc
    if not value.is_finite() or value != observed:
        raise ValueError("SIDRA: valor não corresponde ao arquivo original")
