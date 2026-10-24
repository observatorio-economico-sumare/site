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

def main():
    OUT.mkdir(exist_ok=True)
    ibge()
    for kind, url in SOURCES.items():
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
