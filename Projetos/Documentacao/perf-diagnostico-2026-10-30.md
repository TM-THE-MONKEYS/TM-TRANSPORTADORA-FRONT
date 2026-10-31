---
tags: [desenvolvimento, performance, documentacao, auto-gerado]
data_criacao: 2026-10-30
projeto: TM-TRANSPORTADORA
---

# Diagnóstico de lentidão — 2026-10-30

## Método

- Análise estática do fan-out HTTP (front) + hotspots SQL/serviço (back).
- Logs Railway `duration_ms`: MCP Railway sem auth nesta sessão — pendente amostragem em prod.
- SQL echo local: não executado (docker); N+1 confirmado no código (`_enrich_read` em loop).

## Waterfall por tela (requests após auth)

| Tela | Requests típicos | Padrão | Culpado dominante |
|------|------------------|--------|-------------------|
| `/dashboard` | ~6–9 paralelos (kpis, freights-by-status, revenue, customers, cash-flow, recent freights, op×3) | Fan-out + KPIs sequenciais no back | **API KPIs** + **op-context 3×100** |
| `/dashboard/fretes` | list + summary + op×3 + **até 20× costs** | N+1 no client | **Front N+1 costs** |
| `/dashboard/financeiro` | cash-flow + entries + fixed + op×2 + prev month | Fan-out moderado | **API finance** + op-context |
| `/dashboard/motoristas` | list + summary + op×3 | Fan-out catálogo | **op-context 3×100** |

Auth: 1× `GET /api/auth/me` bloqueia layout antes de qualquer dado.

## Classificação

| Sintoma | Camada |
|---------|--------|
| Muitos requests na aba Fretes | Front |
| KPI dashboard lento mesmo com 1 request | Back (awaits sequenciais + alerts full) |
| Abastecimento/pedágio lista | Back N+1 enrich |
| Relatório competência | Back (load full + Python) |
| Refetch ao focar aba | Front SWR default |

## Decisão Fase 2 (confirmada pelo código)

1. SWRConfig + enxugar operation context + batch costs fretes  
2. KPIs parallel + COUNT alerts; fuel/tolls join; competência SQL  
3. Redis TTL curto KPIs/catálogo  
4. Warning `duration_ms` >500/1000 no middleware  
