#!/usr/bin/env python3
"""Coleta exploratoria do OES: apenas dados agregados oficiais, sem publicacao."""
import argparse
import csv
import hashlib
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

CITY = "3552403"
HOSTS = {"servicodados.ibge.gov.br", "apisidra.ibge.gov.br", "www.gov.br",
         "sumare.atende.net"}
TABLES = [
    (10061, "2022", 2667, "nível de instrução", "escolaridade e ensino medio"),
    (10261, "2022", 4090, "posição na ocupação", "autonomos e sem carteira"),
    (5938, "2021", None, "", "valor adicionado por setor"),
]
PAGES = [
    ("rais_2025", "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/estatisticas-trabalho/rais/rais-2025"),
    ("inep_sinopses", "https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/sinopses-estatisticas/educacao-basica"),
    ("sumare_servidores", "https://sumare.atende.net/transparencia/item/resumo-funcionario-por-regime"),
]
FIELDS = ["id", "url", "status", "collected_at_utc", "sha256",
          "raw_path", "bytes", "candidate_rows", "error"]

def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")

def get(url):
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in HOSTS or parsed.username or parsed.password:
        raise ValueError("Dominio nao autorizado")
    error = ""
    for attempt in range(2):
        try:
            with urlopen(Request(url, headers={"User-Agent": "OES/0.1 - Public Data Research",
                                                "Accept": "application/json,text/html,*/*"}),
                         timeout=17) as response:
                final = urlparse(response.geturl())
                if final.scheme != "https" or final.hostname not in HOSTS:
                    raise ValueError("Redirecionamento nao autorizado")
                if int(response.headers.get("Content-Length", "0")) > 10000000:
                    raise ValueError("Arquivo > 10MB")
                data = response.read(10000001)
                if len(data) > 10000000:
                    raise ValueError("Arquivo > 10MB")
                return data
        except (HTTPError, URLError, OSError, TimeoutError) as exc:
            error = "%s: %s" % (type(exc).__name__, str(exc)[:160])
            if attempt == 0:
                time.sleep(1)
    raise RuntimeError(error)

def capture(rows, directory, key, url, json_expected=True):
    row = dict(id=key, url=url, status="error", collected_at_utc=now(),
               sha256="", raw_path="", bytes=0, candidate_rows=0, error="")
    payload = None
    try:
        data = get(url)
        digest = hashlib.sha256(data).hexdigest()
        row.update(sha256=digest, bytes=len(data))
        if json_expected:
            payload = json.loads(data.decode("utf-8-sig"))
            if not isinstance(payload, (dict, list)) or (isinstance(payload, dict) and "error" in payload):
                raise ValueError("Retorno da API nao e JSON estatistico valido")
            raw_name = "raw/" + key + ".json"
            target = directory / raw_name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            row.update(raw_path=raw_name, status="downloaded_unverified")
        else:
            if not data.lstrip().startswith(b"<"):
                raise ValueError("Resposta inesperada: pagina nao e HTML")
            # Nunca arquivar paginas de servidores que possam conter dados pessoais.
            row["status"] = "landing_page_only"
    except (ValueError, RuntimeError, UnicodeError, json.JSONDecodeError) as exc:
        row["error"] = str(exc)[:250]
    rows.append(row)
    return payload, row

def extract(data, variable_id, table_id, output, key):
    if not isinstance(data, list):
        return 0
    extracted = []
    for var in data:
        if not isinstance(var, dict) or str(var.get("id")) != str(variable_id):
            continue
        for result in var.get("resultados", []):
            cl = result.get("classificacoes", [])
            for series in result.get("series", []):
                if str(series.get("localidade", {}).get("id")) != CITY:
                    continue
                for period, value in series.get("serie", {}).items():
                    extracted.append({
                        "table_id": table_id, "variable_id": variable_id,
                        "municipality_ibge": CITY, "period": period,
                        "value_as_received": value, "unit": var.get("unidade", ""),
                        "classifications_json": json.dumps(cl, ensure_ascii=False)})
    if extracted:
        path = output / "candidates" / (key + ".csv")
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=list(extracted[0]))
            writer.writeheader()
            writer.writerows(extracted)
    return len(extracted)

def collect(out):
    out.mkdir(parents=True, exist_ok=True)
    rows = []
    _, ibge_ping = capture(rows, out, "ibge_localidade", "https://servicodados.ibge.gov.br/api/v1/localidades/municipios/" + CITY)
    for table, period, target, label, purpose in TABLES:
        if ibge_ping["status"] == "error" and "timed out" in ibge_ping.get("error", "").lower():
            rows.append(dict(id="sidra_%s_metadados" % table, url="https://servicodados.ibge.gov.br/api/v3/agregados/%s/metadados" % table,
                             status="skipped_host_timeout", collected_at_utc=now(), sha256="", raw_path="",
                             bytes=0, candidate_rows=0, error="Host IBGE expirou no teste de conectividade"))
            continue
        metadata, _ = capture(rows, out, "sidra_%s_metadados" % table,
                              "https://servicodados.ibge.gov.br/api/v3/agregados/%s/metadados" % table)
        if not isinstance(metadata, dict):
            continue
        options = {str(v["id"]): v for v in metadata.get("variaveis", [])
                   if isinstance(v, dict) and "id" in v}
        if target is not None and str(target) not in options:
            rows.append(dict(id="sidra_%s_variable" % table, url="", status="metadata_mismatch",
                             collected_at_utc=now(), sha256="", raw_path="", bytes=0,
                             candidate_rows=0, error="Variavel %s ausente" % target))
            continue
        variables = [target] if target is not None else [int(x) for x in options][:16]
        selected = next((str(c["id"]) for c in metadata.get("classificacoes", [])
                         if label and label in c.get("nome", "").casefold()), None)
        for var in variables:
            query = {"localidades": "N6[%s]" % CITY}
            if selected:
                query["classificacao"] = "%s[all]" % selected
            url = "https://servicodados.ibge.gov.br/api/v3/agregados/%s/periodos/%s/variaveis/%s?%s" % (
                table, period, var, urlencode(query))
            key = "sidra_%s_v%s_%s_sumare" % (table, var, period)
            payload, row = capture(rows, out, key, url)
            if payload is not None:
                row["candidate_rows"] = extract(payload, var, table, out, key)
                if row["candidate_rows"] == 0:
                    row["status"] = "no_municipal_rows"
                    row["error"] = "Nenhuma serie N6 3552403; conferir recorte e metadados"
    # Endpoint alternativo OFICIAL do SIDRA; independente de servicodados.ibge.gov.br
    direct_queries = [
        ("sidra_direto_10061", "https://apisidra.ibge.gov.br/values/t/10061/n6/3552403/p/2022/v/2667/c1568/all?formato=json"),
        ("sidra_direto_10261", "https://apisidra.ibge.gov.br/values/t/10261/n6/3552403/p/2022/v/4090/c11913/all?formato=json"),
        ("sidra_direto_5938_2021", "https://apisidra.ibge.gov.br/values/t/5938/n6/3552403/p/2021/v/all?formato=json"),
        ("sidra_direto_5938_pib_2023", "https://apisidra.ibge.gov.br/values/t/5938/n6/3552403/p/2023/v/37?formato=json"),
    ]
    for key, url in direct_queries:
        payload, row = capture(rows, out, key, url)
        if isinstance(payload, list):
            filtered = [x for x in payload if isinstance(x, dict) and
                        str(x.get("D1C")) == CITY and "V" in x]
            row["candidate_rows"] = len(filtered)
            if filtered:
                target = out / "candidates" / (key + ".csv")
                target.parent.mkdir(parents=True, exist_ok=True)
                fields = list(dict.fromkeys(k for x in filtered for k in x))
                with target.open("w", encoding="utf-8", newline="") as fp:
                    writer = csv.DictWriter(fp, fieldnames=fields)
                    writer.writeheader()
                    writer.writerows(filtered)
            else:
                row["status"] = "no_municipal_rows"
                row["error"] = "Dados retornaram sem observacoes D1C=3552403"
    for name, url in PAGES:
        capture(rows, out, name, url, json_expected=False)
    with (out / "consultas.csv").open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    result = {
        "municipality_ibge": CITY, "generated_at_utc": now(),
        "validated": False, "publication_allowed": False,
        "requests": len(rows),
        "downloaded_json": sum(x["status"] == "downloaded_unverified" for x in rows),
        "candidate_rows": sum(int(x["candidate_rows"]) for x in rows),
        "status_counts": {s: sum(x["status"] == s for x in rows)
                          for s in sorted({x["status"] for x in rows})},
        "queries": rows,
    }
    (out / "relatorio.json").write_text(
        json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return result

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--output", required=True, type=Path)
    summary = collect(p.parse_args().output)
    print(json.dumps({k: summary[k] for k in
                      ("requests", "downloaded_json", "candidate_rows", "status_counts")},
                     ensure_ascii=False))
