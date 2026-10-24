#!/usr/bin/env python3
"""Coleta isolada de tabelas públicas agregadas; não publica indicadores."""
import csv
import hashlib
import io
import json
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlparse

BASE = "https://repositorio.seade.gov.br/dataset/740944ff-eae7-4be8-bf07-661cbb79771d/resource/"
SOURCES = {
    "empresas": BASE + "639a1a91-91f0-4885-b894-5f75e7e1184d/download/repositorio_seade_agosto.csv",
    "dicionario": BASE + "df518a90-80b2-46c5-bffe-abaa1f034a30/download/dicionario_variaveis_painel_empresas.csv",
}
OUT = Path("auditoria-empresas")


def ibge():
    url = "https://apisidra.ibge.gov.br/values/t/9528/n6/3552403/p/2024/v/all?formato=json"
    print("RECURSO ibge_cempre_9528",url,flush=True)
    try:
        with urlopen(Request(url,headers={"User-Agent":"OES/1.0","Accept":"application/json"}),timeout=35) as response:
            data=response.read(5_000_001)
            if len(data)>5_000_000: raise ValueError("Resposta maior que 5 MB")
            if urlparse(response.geturl()).hostname!="apisidra.ibge.gov.br": raise ValueError("Host incorreto")
        payload=json.loads(data.decode("utf-8-sig"))
        if not isinstance(payload,list) or len(payload)<2: raise ValueError("Tabela vazia ou inesperada")
        digest=hashlib.sha256(data).hexdigest()
        (OUT/"ibge_cempre_9528_original.json").write_bytes(data)
        print("IBGE_HASH",digest,"IBGE_ROWS",len(payload)-1,flush=True)
        print("IBGE_HEADER",json.dumps(payload[0],ensure_ascii=False),flush=True)
        for i,row in enumerate(payload[1:]):
            if i<85:print("IBGE_ROW",i+1,json.dumps(row,ensure_ascii=False)[:1700],flush=True)
    except Exception as exc:
        print("ERRO ibge",type(exc).__name__,str(exc)[:350],flush=True)


def setores_ibge():
    codes = [
        116830,116880,116910,117296,117307,117329,117363,117484,
        117543,117555,117608,117666,117673,117714,117774,117788,
        117810,117838,117861,117888,117892
    ]
    url = ("https://apisidra.ibge.gov.br/values/t/9528/n6/3552403/"
           "p/2024/v/706/c12762/" + ",".join(map(str,codes)) + "?formato=json")
    print("RECURSO IBGE_SETORES", url, flush=True)
    try:
        with urlopen(Request(url,headers={"User-Agent":"OES/1.0","Accept":"application/json"}),timeout=25) as response:
            raw=response.read(1_000_001)
            if len(raw)>1_000_000:raise ValueError("Mais de 1MB")
        payload=json.loads(raw.decode("utf-8-sig"))
        data=payload[1:]
        if len(data)!=len(codes) or {int(row["D4C"]) for row in data}!=set(codes):
            raise ValueError("Cobertura incompleta das 21 seções CNAE")
        invalid=[row for row in data if not (str(row["V"]).isdigit() or str(row["V"])=="-")]
        if invalid: raise ValueError("Seções com valores não numéricos: "+str(invalid))
        groups={"Agropecuária": codes[:1], "Indústria": codes[1:5],
                "Construção": codes[5:6], "Comércio": codes[6:7],
                "Serviços": codes[7:]}
        totals={k:sum(0 if row["V"]=="-" else int(row["V"]) for row in data if int(row["D4C"]) in vals)
                for k,vals in groups.items()}
        print("IBGE_2024_GRUPOS",json.dumps(totals,ensure_ascii=False), "SOMA",sum(totals.values()),flush=True)
        if sum(totals.values())!=12746:raise ValueError("Soma setorial diferente do total 12.746")
        digest=hashlib.sha256(raw).hexdigest()
        (OUT/"ibge_2024_setores_original.json").write_bytes(raw)
        print("IBGE_SETORES_HASH",digest,flush=True)
        for row in data:print("IBGE_SETOR",json.dumps(row,ensure_ascii=False),flush=True)
    except Exception as exc:
        print("ERRO ibge_setores",type(exc).__name__,str(exc)[:500],flush=True)

def main():
    OUT.mkdir(exist_ok=True)
    ibge()
    setores_ibge()
    for kind, url in {}.items():  # Downloads Seade: falharam em duas tentativas; evidência nos logs anteriores.
        print("RECURSO", kind, url, flush=True)
        try:
            with urlopen(Request(url, headers={"User-Agent": "OES/1.0", "Accept": "text/csv,*/*"}), timeout=8) as response:
                if urlparse(response.geturl()).hostname != "repositorio.seade.gov.br":
                    raise ValueError("Redirecionamento não oficial")
                content = response.read(18_000_001)
                if len(content) > 18_000_000:
                    raise ValueError("Arquivo excede 18 MB")
            digest = hashlib.sha256(content).hexdigest()
            (OUT / (kind + "_original.csv")).write_bytes(content)
            print("ARQUIVO", kind, "BYTES", len(content), "SHA256", digest, flush=True)
            try:
                decoded = content.decode("utf-8-sig")
            except UnicodeDecodeError:
                decoded = content.decode("cp1252")
            try:
                delimiter = csv.Sniffer().sniff(decoded[:3000], delimiters=";,|\t").delimiter
            except csv.Error:
                delimiter = ";"
            reader = csv.DictReader(io.StringIO(decoded), delimiter=delimiter)
            print("COLUNAS", kind, json.dumps(reader.fieldnames, ensure_ascii=False), "SEPARADOR", repr(delimiter), flush=True)
            count, matching = 0, []
            for row in reader:
                count += 1
                if kind == "dicionario" or any("sumar" in str(v).casefold() or str(v).strip() in ("3552403", "7149") for v in row.values()):
                    if len(matching) < 50:
                        matching.append(row)
            print("CONTAGEM", kind, count, "AMOSTRA", len(matching), flush=True)
            for i, row in enumerate(matching):
                print("LINHA", kind, i + 1, json.dumps(row, ensure_ascii=False)[:1300], flush=True)
            (OUT / (kind + "_auditoria.json")).write_text(json.dumps({
                "url": url, "sha256": digest, "bytes": len(content),
                "rows": count, "columns": reader.fieldnames, "sample": matching
            }, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception as exc:
            print("ERRO", kind, type(exc).__name__, str(exc)[:280], flush=True)

if __name__ == "__main__":
    main()
