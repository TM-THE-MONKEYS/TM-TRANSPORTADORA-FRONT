# TM Transportadora — Diretrizes de UX/UI

SaaS ERP logístico — The Monkeys.

## Princípios

1. **Operação primeiro** — telas otimizadas para despachantes e gestores, não marketing.
2. **Feedback imediato** — toasts (Sonner), skeletons, estados vazios com CTA.
3. **Consistência** — mesmo padrão de listagem, formulário e detalhe em todos os módulos.
4. **Responsivo** — sidebar vira drawer em `< md`; listas viram cards no mobile.
5. **Acessível** — labels, foco visível, componentes Radix.

## Design system

- **Tema:** light/dark via `next-themes` (default dark no painel).
- **Tokens:** `app/globals.css` — primary azul logístico, accent verde operacional.
- **Tipografia:** Inter (sans), densidade confortável em tabelas e cards.
- **Ícones:** Lucide React.

## Padrões por tipo de tela

### Listagens

- `PageHeader` com título, descrição e ação primária à direita.
- Filtros rápidos no topo (Select, período).
- Cards ou tabela com badge de status.
- `EmptyState` quando `items.length === 0`.
- `Skeleton` durante loading (SWR).

### Formulários

- React Hook Form + Zod.
- Erros inline abaixo do campo.
- Botão submit `disabled` durante `isSubmitting`.
- Toast sucesso/erro após mutação.

### Detalhe

- Tabs: Dados | Documentação | Timeline | etc.
- Ações destrutivas com confirmação (AlertDialog — fase 2).
- Timeline vertical com borda primária à esquerda.

## Componentes reutilizáveis

| Componente | Uso |
|------------|-----|
| `PageHeader` | Título de página |
| `EmptyState` | Lista vazia |
| `FreightStatusBadge` | Status de frete |
| `CommandPalette` | Ctrl+K navegação |
| `SignaturePad` | Assinatura motorista |
| `DeliveryChecklist` | Checklist entrega |

## Atalhos

| Atalho | Ação |
|--------|------|
| `Ctrl+K` | Command palette (módulos) |

## Módulos "Em breve"

Itens futuros no menu com badge cinza — não navegáveis: Financeiro, Abastecimento, Manutenção, Rastreamento, Relatórios.

## LGPD

Páginas `/termos` e `/privacidade` linkadas no rodapé da landing.

## Checklist de nova tela

- [ ] Permissão RBAC verificada
- [ ] Loading skeleton
- [ ] Empty state
- [ ] Toast em mutações
- [ ] Responsivo testado
- [ ] Rota documentada em `BACKEND_API.md`
