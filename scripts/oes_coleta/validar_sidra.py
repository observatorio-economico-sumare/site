"""Validação estrita de uma medida reproduzível em JSON original do SIDRA."""
import re
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from urllib.parse import urlparse



def _validate_sidra_ratio(rows, indicator, source):
    """Reproduz percentual calculado a partir de duas linhas originais da mesma tabela."""
    evidence = indicator["evidence"]
    url = urlparse(source["url"])
    segments = url.path.strip("/").split("/")
    if (source["institution"] != "IBGE" or url.hostname != "apisidra.ibge.gov.br" or
            segments[:2] != ["values", "t"] or len(segments) < 9 or
            evidence.get("original_file_preserved") is not True or indicator["unit"] != "%"):
        raise ValueError("SIDRA: origem ou unidade da razão inválida")
    if not isinstance(rows, list) or len(rows) < 3 or not isinstance(rows[0], dict):
        raise ValueError("SIDRA: tabela da razão inválida")
    dims = {k for k in rows[0] if re.fullmatch(r"D[1-9][0-9]*C", k)}
    selectors = [evidence.get("numerator_selector"), evidence.get("denominator_selector")]
    for sel in selectors:
        if (not isinstance(sel, dict) or set(sel) != dims or
                not {"D1C", "D2C", "D3C", "D4C"} <= dims or
                any(not isinstance(v, str) or not v for v in sel.values()) or
                sel["D1C"] != indicator["municipality_code"] or
                sel["D2C"] != indicator["reference_period"]):
            raise ValueError("SIDRA: seleção integral da razão é obrigatória")
        try:
            if (segments[3:5] != ["n6", sel["D1C"]] or
                    segments[segments.index("p") + 1] != sel["D2C"] or
                    segments[segments.index("v") + 1] not in (sel["D3C"], "all")):
                raise ValueError("SIDRA: URL não corresponde à razão")
        except (ValueError, IndexError) as exc:
            raise ValueError("SIDRA: URL da razão incompleta") from exc
    numerator_sel, denominator_sel = selectors
    if ({k: v for k, v in numerator_sel.items() if k != "D4C"} !=
            {k: v for k, v in denominator_sel.items() if k != "D4C"} or
            numerator_sel["D4C"] != "15350" or denominator_sel["D4C"] != "15349"):
        raise ValueError("SIDRA: categorias de previdência incompatíveis")

    selected = []
    for sel in selectors:
        matches = [r for r in rows[1:] if isinstance(r, dict) and r.get("NC") == "6" and
                   all(r.get(k) == v for k, v in sel.items())]
        if len(matches) != 1 or matches[0].get("MN") != "Pessoas":
            raise ValueError("SIDRA: componentes da razão ausentes ou incompatíveis")
        selected.append(matches[0])
    if selected[0].get("D4N") != "Contribuintes" or selected[1].get("D4N") != "Total":
        raise ValueError("SIDRA: descrições das categorias não correspondem")

    try:
        n, d = [Decimal(str(r["V"]).replace(",", ".")) for r in selected]
        precision = evidence.get("round_digits")
        if type(precision) is not int or precision != 2 or d <= 0 or not 0 <= n <= d:
            raise ValueError("SIDRA: base ou arredondamento da razão inválidos")
        value = (n * 100 / d).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        observed = Decimal(str(indicator["value"]))
    except (InvalidOperation, KeyError, TypeError, ZeroDivisionError) as exc:
        raise ValueError("SIDRA: razão não numérica") from exc
    if not value.is_finite() or value != observed:
        raise ValueError("SIDRA: razão não corresponde às linhas originais")


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

    if "numerator_selector" in evidence or "denominator_selector" in evidence:
        return _validate_sidra_ratio(rows, indicator, source)

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
                segments[segments.index("v") + 1] not in (selector["D3C"], "all")):
            raise ValueError("SIDRA: URL não corresponde à seleção")
    except (ValueError, IndexError) as exc:
        raise ValueError("SIDRA: consulta incompleta") from exc

    expected = {("Pessoas", "pessoas"): 1, ("Mil Reais", "R$"): 1000, ("Reais", "R$"): 1, ("%", "%"): 1}
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
