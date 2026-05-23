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

Com `NEXT_PUBLIC_USE_MOCKS=true`:

| E-mail | Senha | Perfil |
|--------|-------|--------|
| admin@tmtransportadora.com.br | Admin@123! | Admin (igual seed backend) |
| admin@demo.tm | demo1234 | Admin |
| operacional@demo.tm | demo1234 | Operacional |
| financeiro@demo.tm | demo1234 | Financeiro |

### Backend local (recomendado)

1. Suba `TM-TRANSPORTADORA-BACK` em `http://127.0.0.1:8000`
2. Configure `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_USE_MOCKS=false
```

3. Login seed do backend:

| E-mail | Senha |
|--------|-------|
| admin@tmtransportadora.com.br | Admin@123! |

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

- **[Referência API (backend)](docs/API-FRONTEND.md)** — contrato oficial espelhado de `TM-TRANSPORTADORA-BACK`
- **[Fluxo da aplicação](docs/FLUXO-APLICACAO.md)** — jornada do usuário, auth, fretes, RBAC
- [Contrato legado / planejamento](docs/BACKEND_API.md)
- [Diretrizes UX](docs/UX_GUIDELINES.md)
- [ADR Multi-tenant](docs/ADR-001-multi-tenant.md)

## Deploy Vercel

1. Importe o repositório na Vercel.
2. Configure `NEXT_PUBLIC_API_URL` apontando para o backend em produção.
3. `NEXT_PUBLIC_USE_MOCKS=false` em produção.
4. Build command: `npm run build`

## Backend

API FastAPI: **TM-THE-MONKEYS/TM-TRANSPORTADORA-BACK**  
Implemente/consulte rotas em [`docs/API-FRONTEND.md`](docs/API-FRONTEND.md).

## Estrutura

```
app/           # App Router
components/    # UI, layout, módulos
lib/api/       # Cliente HTTP + services + adapters
lib/mocks/     # Handlers mock (dev offline)
docs/          # Contratos e ADRs
```

## The Monkeys

Documentação de cofre: `Projetos/Documentacao/TheMonkeys-estruturas.md`  
Regras Cursor: `.cursor/rules/`
