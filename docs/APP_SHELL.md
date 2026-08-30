# App Shell — Guia de Reuso

Layout padrão da The Monkeys: dois componentes de header empilhados, faixa de navegação horizontal, conteúdo principal e footer.

## Estrutura de arquivos

```
components/layout/
  app-header.tsx       # Row 1 — logo + marca + ações do usuário
  app-nav-strip.tsx    # Row 2 — faixa de módulos (scroll horizontal no mobile)
  app-footer.tsx       # Footer — copyright dinâmico
  dashboard-shell.tsx  # Wrapper: empilha os 4 blocos acima

components/dashboard/
  home-hub.tsx         # Landing pós-login: saudação + grid de módulos
  home-hub-card.tsx    # Card individual, sem lógica de domínio

hooks/
  use-active-route.ts  # Comparação de rota ativa (href exato ou prefixo)
```

## O que MUDA ao portar para outra aplicação

| Arquivo | O que trocar |
|---|---|
| `lib/site-config.ts` | `name`, `company`, `navbarBrand`, `supportEmail`, logos |
| `lib/rbac/permissions.ts` | `DASHBOARD_MODULE_ROUTES` (adicionar/remover módulos) |
| `lib/navigation/nav-icons.ts` | Mapear ícones para as novas rotas |
| `app/globals.css` | Tokens de cor (`--primary`, `--chart-*`, `--status-*`) |

## O que NÃO muda

- `AppHeader`, `AppNavStrip`, `AppFooter`, `DashboardShell` — nenhuma string de marca ou rota hardcoded
- `HomeHub` e `HomeHubCard` — agnósticos de domínio; recebem tudo via props

## Checklist de customização para um novo app

- [ ] Atualizar `lib/site-config.ts` (nome, empresa, logos)
- [ ] Definir `DASHBOARD_MODULE_ROUTES` com as rotas do novo domínio
- [ ] Mapear ícones em `lib/navigation/nav-icons.ts`
- [ ] Ajustar tokens de cor em `app/globals.css` se a identidade visual mudar
- [ ] Revisar `MODULE_COLOR_VARS` em `components/dashboard/home-hub.tsx` para os novos hrefs

## Fluxo de dados

```
siteConfig (lib/site-config.ts)
  └─► AppHeader (logo, marca, homeRoute)
  └─► AppFooter (companyName)

DASHBOARD_MODULE_ROUTES → getAllowedNavRoutes(role, permissions)
  └─► AppNavStrip (faixa horizontal, estado ativo via useActiveRoute)
  └─► HomeHub → HomeHubCard[] (grid da landing)
```

## Adicionando subtítulo com dados reais a um card

O `HomeHubCard` aceita `subtitle?: string`. Para popular:

1. Chame o serviço correspondente (`lib/api/services/freight.ts`, etc.) dentro do `HomeHub` usando SWR.
2. Passe o resultado como `subtitle` ao `HomeHubCard` — o card em si nunca faz fetch.

```tsx
// Exemplo dentro de HomeHub
const { data } = useSWR("fretes-ativos", getActiveFreightsCount)
// ...
<HomeHubCard subtitle={data ? `${data} em andamento` : undefined} ... />
```
