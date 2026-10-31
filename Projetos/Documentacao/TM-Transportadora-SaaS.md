---
tags: [desenvolvimento, documentacao, transportadora, saas, frontend]
data_criacao: 2026-05-20
data_atualizacao: 2026-10-30
projeto: TM-TRANSPORTADORA
---

# TM Transportadora — SaaS Frontend

## Objetivo

Frontend multi-tenant para gestão de transportadoras (frota, fretes, motoristas, dashboard). Cliente: **TSV Transportes**.

## Repositórios

- Front: `TM-THE-MONKEYS/TM-TRANSPORTADORA-front` — branch diária `devl`
- Back: `TM-THE-MONKEYS/TM-TRANSPORTADORA-BACK` — branch diária `devl`
- Prod: merge `devl → main` (GitHub); Vercel + Railway

## Conta de acesso do motorista (2026-10-30)

Conta **opcional**, só admin:

| Ação | Onde |
|------|------|
| Cadastro operacional | `/dashboard/motoristas/novo` — sem conta |
| Criar conta | Ficha → **Criar conta** → `POST /drivers/{id}/account` |
| Redefinir senha | Ficha → **Redefinir senha** (admin) |
| Remover conta | Ficha → **Remover conta** (mantém motorista) |
| Senha própria | `/dashboard/conta/alterar-senha` (motorista + staff) |
| Login motorista | CPF + senha |

Detalhe no vault RAG: `05-Projetos/TM Transportadora - Conta Motorista.md`.

## Links

- Contrato API: `docs/API-FRONTEND.md` / back `docs/`
- ADR tenant: `docs/ADR-001-multi-tenant.md`
- UX: `docs/UX_GUIDELINES.md`
- Vault: [[TM Transportadora]]

## Status

Feature conta motorista opcional implementada em `devl` (front + back). Aguardando merge/deploy.
