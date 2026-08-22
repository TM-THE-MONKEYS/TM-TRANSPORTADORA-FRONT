# TM Transportadora — Diretrizes de UX/UI

SaaS ERP logístico — The Monkeys.

## Princípios

1. **Operação primeiro** — telas otimizadas para despachantes e gestores, não marketing.
2. **Feedback imediato** — toasts (Sonner), skeletons, estados vazios com CTA.
3. **Consistência** — mesmo padrão de listagem, formulário e detalhe em todos os módulos.
4. **Responsivo** — sidebar fixa em `md+`; drawer (Sheet) no mobile.
5. **Acessível** — labels, foco visível, componentes Radix.

## Tipografia e densidade

| Papel | Classes |
|-------|---------|
| Título de listagem | `PageHeader` `density="default"` → `text-2xl font-bold` |
| Título de detalhe/form | `PageHeader` `density="compact"` → `text-xl font-semibold` |
| Título de card | `text-base` / `text-lg font-semibold` |
| Corpo | `text-sm` |
| Legenda / meta | `text-xs text-muted-foreground` |

Espaçamento de listagem: `ListPage` usa `space-y-6`; cards de item usam `p-4` / `py-4 pl-5`. Tabelas: `px-5 py-3`.

Microinteração de card clicável: `LIST_CARD_INTERACTIVE` / `ClickableListCard` — hover shadow + `-translate-y-px`, foco `ring-2 ring-ring`, teclado Enter/Espaço.

## Design system

- **Tema:** light/dark via `next-themes` (preferência do usuário; tokens em `:root` e `.dark`).
- **Tokens:** `app/globals.css` — primary azul logístico The Monkeys, superfícies frias com leve wash azul, accent verde operacional, destructive, chart-1..5.
- **Atmosfera:** wash radial sutil no `body` (primary ~5–8%); header com borda/sombra em tom primary; item ativo da sidebar com barra primary.
- **Status semânticos:** `--status-neutral|info|warning|progress|success|danger|caution` (nome por função, não por cor). Classes Tailwind: `bg-status-*`, `text-status-*`.
- **Mapa único de status:** `lib/ui/status-colors.ts` — tom por frete/caminhão/motorista/financeiro/manutenção/tracking. Badges, dots, barras e gráficos devem reutilizar este módulo (nunca hardcode `violet-*` / `emerald-*` etc.).
- **Semântica financeira:** `SEMANTIC.positive` / `SEMANTIC.negative` / superfícies `caution*` / `warning*` / `progress*`.
- **Tipografia:** Inter (sans), densidade confortável em tabelas e cards.
- **Ícones:** Lucide React.
- **Loading:** sempre `<Skeleton />` de `components/ui/skeleton.tsx` — inclusive linhas em `components/dados/data-table.tsx`. Não reimplementar com `animate-pulse` manual.

## Navegação

| Superfície | Componente | Comportamento |
|------------|------------|---------------|
| Desktop (`md+`) | `AppSidebar` em `DashboardShell` | Sidebar colapsável (hambúrguer no header + fechar na sidebar); preferência em `localStorage` |
| Mobile (`< md`) | `Sheet` + `AppSidebar` | Hambúrguer no header abre/fecha o drawer |
| Header | `AppHeader` | Hambúrguer (toggle), logo The Monkeys + `navbarBrand`, `CommandPalette`, menu do usuário |
| Command palette | `CommandPalette` | Ctrl/Cmd+K e botão “Buscar…” no header |
| Pós-login | `/dashboard/home` | Redirect permanente para `/dashboard` (não duplica menu) |

Rotas de menu vêm de `getAllowedNavRoutes` (RBAC). A rota `HOME_NAV_ROUTE` (`/dashboard/home`) é filtrada na sidebar — o item “Dashboard” cobre a landing.

## Padrões por tipo de tela

### Listagens

Template compartilhado (`components/shared/`):

| Peça | Arquivo |
|------|---------|
| Shell | `list-page.tsx` |
| Busca | `list-search-field.tsx` |
| Chips de status | `status-filter-chips.tsx` |
| Stat tiles | `list-stat-tile.tsx` |
| Card clicável | `clickable-list-card.tsx` (+ `LIST_CARD_INTERACTIVE`) |

Padrão:

- `PageHeader` com título, descrição e ação primária.
- Busca + chips de status quando fizer sentido.
- Stat tiles opcionais.
- `EmptyState` para lista vazia **e** para “sem resultado de filtro”.
- `Skeleton` durante loading (SWR).
- Cards com hover/foco unificado (`ClickableListCard`).
- Paginação: `ListPagination` (mesmo padrão de `DataTable`) com `page`/`pageSize` server-side em Fretes, Frota e Motoristas.

Módulos alinhados: Fretes, Frota, Motoristas. Financeiro/Abastecimento/Manutenção usam layouts próprios (tabelas/formulários) e reutilizam tokens/EmptyState onde couber.

### Formulários

- React Hook Form + Zod.
- Erros inline abaixo do campo.
- Botão submit `disabled` durante `isSubmitting`.
- Toast sucesso/erro após mutação.

### Detalhe

- Tabs: Dados | Documentação | Timeline | etc.
- Ações destrutivas com confirmação (AlertDialog).
- Timeline vertical com borda primária à esquerda.

## Componentes reutilizáveis

| Componente | Uso |
|------------|-----|
| `PageHeader` | Título de página |
| `EmptyState` | Lista vazia |
| `FreightStatusBadge` | Status de frete |
| `Skeleton` | Loading genérico |
| `AppSidebar` | Navegação de módulos |
| `CommandPalette` | Atalho Ctrl+K entre módulos |
| `SignaturePad` | Assinatura motorista |
| `DeliveryChecklist` | Checklist entrega |

## Atalhos

| Atalho | Ação |
|--------|------|
| `Ctrl+K` / `Cmd+K` | Abrir command palette |

## LGPD

Páginas `/termos` e `/privacidade` linkadas no rodapé da landing.

## Checklist de nova tela

- [ ] Permissão RBAC verificada
- [ ] Loading via `<Skeleton />`
- [ ] Empty state
- [ ] Cores de status via `lib/ui/status-colors.ts` / tokens `--status-*`
- [ ] Toast em mutações
- [ ] Responsivo testado (sidebar + drawer)
- [ ] Rota documentada em `BACKEND_API.md`
