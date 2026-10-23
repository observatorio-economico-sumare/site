# OES | Resultado da coleta primária de 23/10/2026

**Status:** dados extraídos do IBGE/SIDRA; aguardam revisão metodológica e
aprovação independente. Nenhuma alteração foi feita nos dados do site.

Execução: https://github.com/observatorio-economico-sumare/site/actions/runs/40035110098

## Observações recuperadas de Sumaré, IBGE 3552403

### Censo 2022 — tabela 10261

- Conta própria, sem empregados: **32.334 residentes ocupados**.
- Setor privado sem carteira (exclui domésticos): **9.095 residentes**.
- Trabalhadores domésticos sem carteira: **2.103 residentes**.
- Empregados no setor público: **8.257 residentes**, inclusive outros entes;
  **NÃO** equivale ao quadro de servidores da Prefeitura.

### Censo 2022 — tabela 10061

- População com 18+ anos: **213.430 pessoas**.
- Sem instrução/fundamental incompleto: **54.968 pessoas**.
- Fundamental completo/médio incompleto: **32.641 pessoas**.
- Médio completo/superior incompleto: **97.609 pessoas**.
- Superior completo: **28.211 pessoas**.
- Cálculo exploratório de pelo menos médio completo: 97.609+28.211 =
  **125.820 pessoas**, sujeito a auditoria. A soma dos grupos difere do
  total em 1 pessoa; tratar como possível arredondamento da amostra.

### PIB municipal — tabela 5938

- PIB total nominal 2023: **R$ 19.026.093 mil** (R$ 19,026093 bilhões).
- PIB total nominal 2021: R$ 16.179.892 mil.
- VAB total 2021: R$ 13.131.392 mil.
- VAB agropecuária 2021: R$ 328.222 mil.
- VAB indústria 2021: R$ 4.539.681 mil.
- VAB serviços privados 2021: R$ 7.114.201 mil.
- VAB administração e outros serviços públicos 2021: R$ 1.149.289 mil.
- Soma dos quatro setores excede o VAB total em R$ 1 mil; conferir
  arredondamento do dado divulgado antes de usar em indicadores derivados.

## Evidências brutas

| Tabela | URL da consulta oficial | SHA-256 dos bytes originais |
|---|---|---|
| 10061 (2022) | https://apisidra.ibge.gov.br/values/t/10061/n6/3552403/p/2022/v/2667/c1568/all?formato=json | 8a8ae482d8f8282a64a81178d0f6c33db9f7a5f5e99438e877cf6ba278fdbe45 |
| 10261 (2022) | https://apisidra.ibge.gov.br/values/t/10261/n6/3552403/p/2022/v/4090/c11913/all?formato=json | b645ee393a93aa9bcb6e14589c6d82d1d7f40400cd5dc1203c51ab8ac95a7c44 |
| 5938 (2021) | https://apisidra.ibge.gov.br/values/t/5938/n6/3552403/p/2021/v/all?formato=json | de5bda2863b736d4859c24f899cfbf7d718c56c9b711ba5c090c660f5dac2dae |
| 5938 (2023) | https://apisidra.ibge.gov.br/values/t/5938/n6/3552403/p/2023/v/37?formato=json | 64b19e9b71f4c0180aaee551567dd82030bb2feb82a99aed9fd591bb23ae99f5 |

Os quatro JSON brutos foram preservados no artifact da execução
(arquivos temporários do Actions: 14 dias) e em pacote de coleta entregue
separadamente. A branch não executa qualquer escrita em site/data ou
data/processed.

## Ainda pendente de extração primária municipal

1. Servidores da Prefeitura por vínculo (portal municipal).
2. Salários médios por setor (RAIS, ano-base 2025 ou posterior).
3. Matrículas de educação profissional (INEP, último ano disponível).

Nota: trabalhadores PJ únicos são uma lacuna metodológica separada. Os dados
censitários acima são **pessoas residentes**, não vínculos por estabelecimento.
