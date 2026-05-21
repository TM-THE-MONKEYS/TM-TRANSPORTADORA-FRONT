---
tags: [adr, arquitetura, multi-tenant, transportadora]
data_criacao: 2026-05-20
projeto: TM-TRANSPORTADORA
---

# ADR-001: Multi-tenant por tenant_id no JWT

## Status

Aceito (MVP)

## Contexto

SaaS B2B para múltiplas transportadoras. Dados devem ser isolados por tenant.

## Decisão

- `tenant_id` no JWT e header `X-Tenant-Id` em todas as requisições autenticadas.
- Row-level security no PostgreSQL (`WHERE tenant_id = :current`).
- Front: `TenantProvider` + seletor de filial (`branch_id`).
- Subdomínio por tenant: fase 2 (`{slug}.app.com`).

## Consequências

- Backend deve rejeitar mismatch entre JWT e header.
- Seeds por tenant no ambiente de demo.
- Testes de integração devem cobrir isolamento.

## Links

- [[BACKEND_API]]
- Repositório front: TM-TRANSPORTADORA-FRONT
