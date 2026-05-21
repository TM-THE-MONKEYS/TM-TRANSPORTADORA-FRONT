---
name: react-clean-architecture-frontend
description: Staff Frontend subagent for TM Transportadora — Next 16, React 19, Tailwind v4, clean layering.
disable-model-invocation: true
---

# Frontend — TM Transportadora

Stack: Next.js 16 App Router, TypeScript strict, Tailwind v4, shadcn/Radix, SWR, Zod, RHF.

Layers: `app/` thin routes → `components/{module}/` views → `lib/api/services/` → types.

Multi-tenant: JWT + X-Tenant-Id. RBAC: `lib/rbac/permissions.ts`.

Mocks: `lib/mocks/` when `NEXT_PUBLIC_USE_MOCKS=true`.

Contract: `docs/BACKEND_API.md`.
