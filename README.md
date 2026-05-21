# TM Transportadora — Frontend SaaS

Plataforma de gestão e operação logística para transportadoras de caminhão (The Monkeys).

## Stack

- Next.js 16 · React 19 · TypeScript · Tailwind CSS v4
- shadcn/ui (Radix) · SWR · Zod · React Hook Form · Recharts
- Multi-tenant · JWT + RBAC · Mocks para desenvolvimento

## Início rápido

```bash
npm install
cp .env.example .env.local
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Demo (mocks)

Com `NEXT_PUBLIC_USE_MOCKS=true` (padrão sem API):

| E-mail | Senha | Perfil |
|--------|-------|--------|
| admin@demo.tm | demo1234 | Admin |
| operacional@demo.tm | demo1234 | Operacional |
| financeiro@demo.tm | demo1234 | Financeiro |

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_API_URL` | URL do FastAPI (repo `TM-TRANSPORTADORA-API`) |
| `NEXT_PUBLIC_APP_URL` | URL pública do front |
| `NEXT_PUBLIC_USE_MOCKS` | `true` = dados mock quando API ausente |

## Módulos MVP

- Dashboard operacional (KPIs, gráficos, filtros)
- Gestão de fretes (CRUD, timeline, ocorrências, checklist)
- Gestão de frota (caminhões, implementos)
- Gestão de motoristas (CRUD, assinatura, uploads UI)

## Documentação

- **[Fluxo da aplicação](docs/FLUXO-APLICACAO.md)** — jornada do usuário, auth, fretes, RBAC e camada de dados
- [Contrato API para backend](docs/BACKEND_API.md)
- [Diretrizes UX](docs/UX_GUIDELINES.md)
- [ADR Multi-tenant](docs/ADR-001-multi-tenant.md)

## Deploy Vercel

1. Importe o repositório na Vercel.
2. Configure `NEXT_PUBLIC_API_URL` apontando para o backend em produção.
3. `NEXT_PUBLIC_USE_MOCKS=false` em produção.
4. Build command: `npm run build`

## Backend

API FastAPI em repositório separado: **TM-TRANSPORTADORA-API**.  
Implemente rotas conforme `docs/BACKEND_API.md`.

## Estrutura

```
app/           # App Router
components/    # UI, layout, módulos
lib/api/       # Cliente HTTP + services
lib/mocks/     # Handlers mock MVP
docs/          # Contratos e ADRs
```

## The Monkeys

Documentação de cofre: `Projetos/Documentacao/TheMonkeys-estruturas.md`  
Regras Cursor: `.cursor/rules/`
