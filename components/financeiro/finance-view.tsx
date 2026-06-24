"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import useSWR, { mutate as globalMutate } from "swr"
import { toast } from "sonner"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import {
  AlertTriangle,
  ArrowUpDown,
  BadgeDollarSign,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/shared/page-header"
import { useAuth } from "@/components/providers/auth-provider"
import {
  createFinanceEntry,
  deleteFinanceEntry,
  getCashFlow,
  invalidateFinanceCaches,
  listFinanceEntries,
  syncFinanceFromFreights,
  updateFinanceEntry,
} from "@/lib/api/services/finance"
import {
  FIXED_EXPENSE_CATEGORIES,
  FREQUENCY_LABELS,
  createFixedExpense,
  deleteFixedExpense,
  launchFixedExpense,
  listFixedExpenses,
  monthlyEquivalent,
  updateFixedExpense,
} from "@/lib/api/services/fixed-expenses"
import { formatBRL } from "@/lib/format/currency"
import { isAdminRole } from "@/lib/rbac/permissions"
import { cn } from "@/lib/utils"
import type { FinanceEntry, FinanceEntryStatus, FinanceEntryType, FixedExpense } from "@/types"

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<FinanceEntryStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente:  { label: "Pendente",  variant: "outline" },
  pago:      { label: "Pago",      variant: "secondary" },
  cancelado: { label: "Cancelado", variant: "destructive" },
  vencido:   { label: "Vencido",   variant: "destructive" },
}

const PIE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "oklch(0.65 0.15 145)",
]

function formatDate(d?: string) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

function effectiveStatus(entry: { status: FinanceEntryStatus; data_vencimento?: string | null }): FinanceEntryStatus {
  if (
    entry.status === "pendente" &&
    entry.data_vencimento &&
    new Date(entry.data_vencimento) < new Date(new Date().toDateString())
  ) {
    return "vencido"
  }
  return entry.status
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function FinanceView() {
  const { user } = useAuth()
  const canAdmin = isAdminRole(user?.role) || user?.role === "financeiro"

  const [syncing, setSyncing] = useState(false)
  const [filterType, setFilterType] = useState<FinanceEntryType | "all">("all")
  const [filterStatus, setFilterStatus] = useState<FinanceEntryStatus | "all">("all")
  const [entryDialog, setEntryDialog] = useState<{ open: boolean; entry?: FinanceEntry }>({ open: false })
  const [fixedDialog, setFixedDialog] = useState<{ open: boolean; item?: FixedExpense }>({ open: false })
  const [launchDialog, setLaunchDialog] = useState<{ open: boolean; item?: FixedExpense; date: string }>({
    open: false,
    date: new Date().toISOString().slice(0, 10),
  })
  const [deleteFixedId, setDeleteFixedId] = useState<string | null>(null)
  const [deleteEntry, setDeleteEntry] = useState<FinanceEntry | null>(null)

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: cashFlow, isLoading: loadingCash, mutate: refreshCash } = useSWR(
    "cash-flow",
    getCashFlow,
  )

  const swrEntriesKey = ["finance-entries", filterType, filterStatus]
  const { data: entriesPage, isLoading: loadingEntries, mutate: refreshEntries } = useSWR(
    swrEntriesKey,
    () =>
      listFinanceEntries(
        1,
        100,
        filterType === "all" ? undefined : filterType,
        filterStatus === "all" ? undefined : filterStatus,
      ),
  )
  const entries = entriesPage?.items ?? []

  const { data: fixedExpenses, mutate: refreshFixed } = useSWR("fixed-expenses", listFixedExpenses)

  // ── Derived ───────────────────────────────────────────────────────────────

  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of entries) {
      if (e.tipo === "despesa") {
        map[e.categoria] = (map[e.categoria] ?? 0) + e.valor
      }
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [entries])

  const activeFixed = useMemo(() => (fixedExpenses ?? []).filter((f) => f.ativo), [fixedExpenses])
  const fixedMonthlyTotal = useMemo(
    () => activeFixed.reduce((s, f) => s + monthlyEquivalent(f), 0),
    [activeFixed],
  )

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleSync() {
    setSyncing(true)
    try {
      const stats = await syncFinanceFromFreights()
      invalidateFinanceCaches()
      await refreshEntries()
      await refreshCash()
      toast.success(`Sincronizado: ${stats.receitas} receita(s) e ${stats.despesas} despesa(s).`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao sincronizar")
    } finally {
      setSyncing(false)
    }
  }

  async function handleMarkPaid(entry: FinanceEntry) {
    try {
      await updateFinanceEntry(entry.id, { status: "pago" })
      invalidateFinanceCaches()
      await refreshEntries()
      await refreshCash()
      toast.success("Lançamento marcado como pago")
    } catch {
      toast.error("Erro ao atualizar lançamento")
    }
  }

  async function handleLaunchFixed() {
    if (!launchDialog.item) return
    try {
      await launchFixedExpense(launchDialog.item.id, launchDialog.date || undefined)
      invalidateFinanceCaches()
      await refreshEntries()
      await refreshCash()
      setLaunchDialog({ open: false, date: new Date().toISOString().slice(0, 10) })
      toast.success(`"${launchDialog.item.nome}" lançado como despesa pendente`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao lançar despesa")
    }
  }

  async function handleDeleteFixed() {
    if (!deleteFixedId) return
    try {
      await deleteFixedExpense(deleteFixedId)
      await refreshFixed()
      setDeleteFixedId(null)
      toast.success("Gasto fixo removido")
    } catch {
      toast.error("Erro ao remover gasto fixo")
    }
  }

  async function handleDeleteEntry() {
    if (!deleteEntry) return
    try {
      await deleteFinanceEntry(deleteEntry.id)
      invalidateFinanceCaches()
      await refreshEntries()
      await refreshCash()
      setDeleteEntry(null)
      toast.success("Lançamento removido")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover lançamento")
    }
  }

  const margin = (cashFlow?.total_receitas ?? 0) - (cashFlow?.total_despesas ?? 0)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Controle financeiro"
        description="Receitas, despesas, gastos fixos e fluxo de caixa"
        actions={
          <div className="flex gap-2">
            {canAdmin && (
              <>
                <Button size="sm" onClick={() => setEntryDialog({ open: true })}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Novo lançamento
                </Button>
                <Button variant="outline" size="sm" disabled={syncing} onClick={handleSync}>
                  <RefreshCcw className={cn("mr-1.5 h-4 w-4", syncing && "animate-spin")} />
                  {syncing ? "Atualizando..." : "Atualizar valores"}
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* ── KPIs ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FinKpiCard
          label="Receita total"
          value={formatBRL(cashFlow?.total_receitas ?? 0)}
          icon={TrendingUp}
          tone="success"
          loading={loadingCash}
          hint={`${formatBRL(cashFlow?.receitas_pagas ?? 0)} já recebido`}
        />
        <FinKpiCard
          label="Despesas totais"
          value={formatBRL(cashFlow?.total_despesas ?? 0)}
          icon={TrendingDown}
          tone="danger"
          loading={loadingCash}
          hint={`${formatBRL(cashFlow?.despesas_pagas ?? 0)} já pago`}
        />
        <FinKpiCard
          label="Saldo líquido"
          value={formatBRL(cashFlow?.saldo ?? 0)}
          icon={CircleDollarSign}
          tone={margin >= 0 ? "success" : "danger"}
          loading={loadingCash}
          hint="Receita − despesas"
        />
        <FinKpiCard
          label="Gastos fixos/mês"
          value={formatBRL(fixedMonthlyTotal)}
          icon={Building2}
          tone="warning"
          hint={`${activeFixed.length} item(s) ativo(s)`}
        />
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue={canAdmin ? "fixed" : "entries"}>
        <TabsList className="mb-1">
          {canAdmin && (
            <TabsTrigger value="fixed">
              <Building2 className="mr-1.5 h-4 w-4" />
              Gastos fixos
              {activeFixed.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                  {activeFixed.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="entries">
            <Wallet className="mr-1.5 h-4 w-4" />
            Lançamentos
          </TabsTrigger>
          <TabsTrigger value="overview">
            <BadgeDollarSign className="mr-1.5 h-4 w-4" />
            Visão geral
          </TabsTrigger>
        </TabsList>

        {/* ── GASTOS FIXOS ── */}
        {canAdmin && (
          <TabsContent value="fixed" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Total mensal estimado:{" "}
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {formatBRL(fixedMonthlyTotal)}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {activeFixed.length} gasto(s) fixo(s) ativo(s) de {(fixedExpenses ?? []).length} cadastrado(s)
                </p>
              </div>
              <Button size="sm" onClick={() => setFixedDialog({ open: true })}>
                <Plus className="mr-1.5 h-4 w-4" />
                Novo gasto fixo
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(fixedExpenses ?? []).map((fx) => (
                <FixedExpenseCard
                  key={fx.id}
                  item={fx}
                  onEdit={() => setFixedDialog({ open: true, item: fx })}
                  onDelete={() => setDeleteFixedId(fx.id)}
                  onLaunch={() =>
                    setLaunchDialog({
                      open: true,
                      item: fx,
                      date: new Date().toISOString().slice(0, 10),
                    })
                  }
                />
              ))}
              {(fixedExpenses ?? []).length === 0 && (
                <div className="col-span-full flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
                  <Building2 className="h-10 w-10 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum gasto fixo cadastrado.
                    <br />
                    Clique em "Novo gasto fixo" para começar.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {/* ── LANÇAMENTOS ── */}
        <TabsContent value="entries" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Lançamentos</CardTitle>
                  <CardDescription>
                    {entries.length} registro(s) com os filtros aplicados
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={filterType} onValueChange={(v) => setFilterType(v as FinanceEntryType | "all")}>
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos tipos</SelectItem>
                      <SelectItem value="receita">Receitas</SelectItem>
                      <SelectItem value="despesa">Despesas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FinanceEntryStatus | "all")}>
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos status</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoria</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descrição</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Frete</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        <span className="flex items-center justify-end gap-1">
                          Valor <ArrowUpDown className="h-3 w-3" />
                        </span>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vencimento</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      {canAdmin && (
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingEntries ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b">
                          {Array.from({ length: canAdmin ? 8 : 7 }).map((_, j) => (
                            <td key={j} className="px-4 py-3">
                              <div className="h-4 animate-pulse rounded bg-muted" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : entries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={canAdmin ? 8 : 7}
                          className="px-4 py-10 text-center text-muted-foreground"
                        >
                          Nenhum lançamento encontrado.{" "}
                          {canAdmin ? 'Clique em "Novo lançamento" ou "Atualizar valores".' : ""}
                        </td>
                      </tr>
                    ) : (
                      entries.map((entry) => {
                        const effStatus = effectiveStatus(entry)
                        const statusInfo = STATUS_BADGE[effStatus]
                        return (
                          <tr
                            key={entry.id}
                            className="border-b transition-colors last:border-0 hover:bg-muted/30"
                          >
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 text-xs font-semibold",
                                  entry.tipo === "receita"
                                    ? "text-green-700 dark:text-green-400"
                                    : "text-destructive",
                                )}
                              >
                                {entry.tipo === "receita" ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {entry.tipo === "receita" ? "Receita" : "Despesa"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs font-medium">{entry.categoria}</td>
                            <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                              {entry.descricao ?? "—"}
                            </td>
                            <td className="px-4 py-3">
                              {entry.freight_id ? (
                                <Link
                                  href={`/dashboard/fretes/${entry.freight_id}`}
                                  className="text-xs text-primary hover:underline"
                                >
                                  Ver frete
                                </Link>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td
                              className={cn(
                                "px-4 py-3 text-right font-semibold tabular-nums",
                                entry.tipo === "receita"
                                  ? "text-green-700 dark:text-green-400"
                                  : "text-destructive",
                              )}
                            >
                              {entry.tipo === "despesa" ? "−" : "+"}
                              {formatBRL(entry.valor)}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {formatDate(entry.data_vencimento)}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={statusInfo.variant} className="text-xs">
                                {statusInfo.label}
                              </Badge>
                            </td>
                            {canAdmin && (
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {(effStatus === "pendente" || effStatus === "vencido") && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={cn(
                                        "h-7 px-2 text-xs",
                                        effStatus === "vencido"
                                          ? "text-destructive hover:text-destructive"
                                          : "text-green-700",
                                      )}
                                      onClick={() => handleMarkPaid(entry)}
                                    >
                                      <CheckCircle2 className="mr-1 h-3 w-3" />
                                      Pagar
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setEntryDialog({ open: true, entry })}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => setDeleteEntry(entry)}
                                    title="Excluir lançamento"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            )}
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── VISÃO GERAL ── */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Receitas vs despesas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resumo financeiro</CardTitle>
                <CardDescription>Entradas e saídas consolidadas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <OverviewRow
                  label="Receitas pagas"
                  value={formatBRL(cashFlow?.receitas_pagas ?? 0)}
                  tone="success"
                />
                <OverviewRow
                  label="Receitas pendentes"
                  value={formatBRL(cashFlow?.receitas_pendentes ?? 0)}
                  tone="warning"
                />
                <Separator />
                <OverviewRow
                  label="Despesas pagas"
                  value={formatBRL(cashFlow?.despesas_pagas ?? 0)}
                  tone="danger"
                />
                <OverviewRow
                  label="Despesas pendentes"
                  value={formatBRL(cashFlow?.despesas_pendentes ?? 0)}
                  tone="warning"
                />
                <Separator />
                <OverviewRow
                  label="Saldo líquido"
                  value={formatBRL(cashFlow?.saldo ?? 0)}
                  tone={(cashFlow?.saldo ?? 0) >= 0 ? "success" : "danger"}
                  bold
                />
                <OverviewRow
                  label="Custo fixo mensal estimado"
                  value={formatBRL(fixedMonthlyTotal)}
                  tone="warning"
                />
              </CardContent>
            </Card>

            {/* Despesas por categoria */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Despesas por categoria</CardTitle>
                <CardDescription>
                  Baseado nos lançamentos{filterType !== "all" ? " filtrados" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {expensesByCategory.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                    Sem despesas registradas
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="h-[180px] w-full sm:w-[180px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expensesByCategory}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="55%"
                            outerRadius="80%"
                            paddingAngle={2}
                          >
                            {expensesByCategory.map((_, i) => (
                              <Cell
                                key={i}
                                fill={PIE_COLORS[i % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(v: number) => [formatBRL(v), "Total"]}
                            contentStyle={{ fontSize: 12, borderRadius: 8 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2">
                      {expensesByCategory.slice(0, 6).map((cat, i) => {
                        const total = expensesByCategory.reduce((s, c) => s + c.value, 0)
                        const pct = total > 0 ? Math.round((cat.value / total) * 100) : 0
                        return (
                          <div key={cat.name}>
                            <div className="mb-0.5 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="h-2 w-2 shrink-0 rounded-full"
                                  style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                                />
                                <span className="truncate text-xs">{cat.name}</span>
                              </div>
                              <span className="shrink-0 text-xs font-semibold tabular-nums">
                                {pct}%
                              </span>
                            </div>
                            <div className="h-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gastos fixos resumo */}
            {canAdmin && (
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Gastos fixos ativos</CardTitle>
                      <CardDescription>
                        Total estimado: {formatBRL(fixedMonthlyTotal)}/mês
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {activeFixed.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum gasto fixo ativo. Configure na aba "Gastos fixos".
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {activeFixed.map((fx) => (
                        <div
                          key={fx.id}
                          className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2.5"
                        >
                          <Building2 className="h-4 w-4 shrink-0 text-amber-500" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{fx.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatBRL(monthlyEquivalent(fx))}/mês
                              {" · "}{FREQUENCY_LABELS[fx.frequencia]}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

      </Tabs>

      {/* ── Dialogs ── */}

      <EntryDialog
        open={entryDialog.open}
        entry={entryDialog.entry}
        onOpenChange={(open) => setEntryDialog({ open })}
        onSave={async () => {
          invalidateFinanceCaches()
          await refreshEntries()
          await refreshCash()
        }}
      />

      <FixedExpenseDialog
        open={fixedDialog.open}
        item={fixedDialog.item}
        onOpenChange={(open) => setFixedDialog({ open })}
        onSave={async () => {
          await refreshFixed()
          await globalMutate("fixed-expenses")
        }}
      />

      {/* Launch confirm */}
      <Dialog
        open={launchDialog.open}
        onOpenChange={(open) => setLaunchDialog((s) => ({ ...s, open }))}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Lançar despesa</DialogTitle>
            <DialogDescription>
              Cria um lançamento pendente de{" "}
              <strong>{formatBRL(launchDialog.item?.valor ?? 0)}</strong> para{" "}
              <strong>{launchDialog.item?.nome}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Data de vencimento</Label>
            <Input
              type="date"
              value={launchDialog.date}
              onChange={(e) => setLaunchDialog((s) => ({ ...s, date: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLaunchDialog((s) => ({ ...s, open: false }))}
            >
              Cancelar
            </Button>
            <Button onClick={handleLaunchFixed}>Confirmar lançamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete fixed expense confirm */}
      <Dialog open={Boolean(deleteFixedId)} onOpenChange={() => setDeleteFixedId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover gasto fixo</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O gasto fixo será removido permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFixedId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteFixed}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete finance entry confirm */}
      <Dialog open={Boolean(deleteEntry)} onOpenChange={() => setDeleteEntry(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir lançamento</DialogTitle>
            <DialogDescription>
              {deleteEntry ? (
                <>
                  Remover permanentemente{" "}
                  <strong>
                    {deleteEntry.tipo === "receita" ? "receita" : "despesa"} de{" "}
                    {formatBRL(deleteEntry.valor)}
                  </strong>
                  {deleteEntry.descricao ? (
                    <>
                      {" "}
                      ({deleteEntry.descricao})
                    </>
                  ) : null}
                  ? Esta ação não pode ser desfeita.
                </>
              ) : (
                "Esta ação não pode ser desfeita."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteEntry(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteEntry}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FinKpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  loading,
}: {
  label: string
  value: string
  hint?: string
  icon: React.ElementType
  tone?: "default" | "success" | "danger" | "warning"
  loading?: boolean
}) {
  const accent = {
    default: "before:bg-border",
    success: "before:bg-green-500",
    danger:  "before:bg-destructive",
    warning: "before:bg-amber-500",
  }[tone]

  const iconCn = {
    default: "text-muted-foreground",
    success: "text-green-500",
    danger:  "text-destructive",
    warning: "text-amber-500",
  }[tone]

  const valueCn = {
    default: "",
    success: "text-green-700 dark:text-green-400",
    danger:  "text-destructive",
    warning: "text-amber-700 dark:text-amber-400",
  }[tone]

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5",
        "before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-xl",
        accent,
      )}
    >
      <Icon
        className={cn("absolute right-4 top-4 h-14 w-14 opacity-[0.06]", iconCn)}
        aria-hidden
      />
      <div className="relative space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        {loading ? (
          <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
        ) : (
          <p className={cn("text-3xl font-bold tracking-tight tabular-nums", valueCn)}>{value}</p>
        )}
        {hint && !loading && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}

function OverviewRow({
  label,
  value,
  tone = "default",
  bold,
}: {
  label: string
  value: string
  tone?: "default" | "success" | "danger" | "warning"
  bold?: boolean
}) {
  const valueCn = {
    default: "",
    success: "text-green-700 dark:text-green-400",
    danger:  "text-destructive",
    warning: "text-amber-600 dark:text-amber-400",
  }[tone]

  return (
    <div className="flex items-center justify-between gap-2">
      <span className={cn("text-sm text-muted-foreground", bold && "font-medium text-foreground")}>
        {label}
      </span>
      <span className={cn("tabular-nums", bold ? "text-base font-bold" : "text-sm font-medium", valueCn)}>
        {value}
      </span>
    </div>
  )
}

function FixedExpenseCard({
  item,
  onEdit,
  onDelete,
  onLaunch,
}: {
  item: FixedExpense
  onEdit: () => void
  onDelete: () => void
  onLaunch: () => void
}) {
  return (
    <Card className={cn("transition-all", !item.ativo && "opacity-60")}>
      <CardContent className="pt-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-semibold">{item.nome}</p>
              {!item.ativo && (
                <Badge variant="outline" className="shrink-0 text-xs">Inativo</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{item.categoria}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mb-3 space-y-1">
          <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
            {formatBRL(item.valor)}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="h-3 w-3" />
            {FREQUENCY_LABELS[item.frequencia]}
            {item.dia_vencimento ? ` · todo dia ${item.dia_vencimento}` : ""}
          </div>
          {item.frequencia !== "mensal" && (
            <p className="text-xs text-muted-foreground">
              ≈ {formatBRL(monthlyEquivalent(item))}/mês
            </p>
          )}
        </div>

        {item.observacao && (
          <p className="mb-3 text-xs text-muted-foreground line-clamp-2">{item.observacao}</p>
        )}

        {item.ativo && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={onLaunch}
          >
            <ChevronDown className="mr-1.5 h-3.5 w-3.5" />
            Lançar como despesa
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// ── Entry Dialog ──────────────────────────────────────────────────────────────

type EntryForm = {
  tipo: FinanceEntryType
  categoria: string
  descricao: string
  valor: string
  status: FinanceEntryStatus
  data_vencimento: string
}

const ENTRY_DEFAULTS: EntryForm = {
  tipo: "despesa",
  categoria: "",
  descricao: "",
  valor: "",
  status: "pendente",
  data_vencimento: "",
}

function EntryDialog({
  open,
  entry,
  onOpenChange,
  onSave,
}: {
  open: boolean
  entry?: FinanceEntry
  onOpenChange: (o: boolean) => void
  onSave: () => Promise<void>
}) {
  const isEdit = Boolean(entry)
  const [form, setForm] = useState<EntryForm>(ENTRY_DEFAULTS)
  const [saving, setSaving] = useState(false)

  function handleOpen(o: boolean) {
    if (o) {
      setForm(
        entry
          ? {
              tipo: entry.tipo,
              categoria: entry.categoria,
              descricao: entry.descricao ?? "",
              valor: String(entry.valor),
              status: entry.status,
              data_vencimento: entry.data_vencimento ?? "",
            }
          : ENTRY_DEFAULTS,
      )
    }
    onOpenChange(o)
  }

  function set<K extends keyof EntryForm>(k: K, v: EntryForm[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    if (!form.categoria.trim()) { toast.error("Informe a categoria"); return }
    const valor = parseFloat(form.valor.replace(",", "."))
    if (!valor || valor <= 0) { toast.error("Valor inválido"); return }

    setSaving(true)
    try {
      const payload = {
        tipo: form.tipo,
        categoria: form.categoria.trim(),
        descricao: form.descricao.trim() || undefined,
        valor,
        status: form.status,
        data_vencimento: form.data_vencimento || undefined,
      }
      if (isEdit && entry) {
        await updateFinanceEntry(entry.id, payload)
        toast.success("Lançamento atualizado")
      } else {
        await createFinanceEntry(payload as Parameters<typeof createFinanceEntry>[0])
        toast.success("Lançamento criado")
      }
      await onSave()
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Altere os dados do lançamento financeiro." : "Registre uma receita ou despesa manualmente."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => set("tipo", v as FinanceEntryType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as FinanceEntryStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Categoria *</Label>
            <Input
              placeholder="Ex: Combustível, Manutenção, Frete..."
              value={form.categoria}
              onChange={(e) => set("categoria", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input
              placeholder="Descrição opcional"
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="0,00"
                value={form.valor}
                onChange={(e) => set("valor", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Vencimento</Label>
              <Input
                type="date"
                value={form.data_vencimento}
                onChange={(e) => set("data_vencimento", e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={saving} onClick={handleSave}>
            {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar lançamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── FixedExpense Dialog ───────────────────────────────────────────────────────

type FxForm = {
  nome: string
  categoria: string
  valor: string
  frequencia: string
  dia_vencimento: string
  ativo: boolean
  observacao: string
}

const FX_DEFAULTS: FxForm = {
  nome: "",
  categoria: "Outros",
  valor: "",
  frequencia: "mensal",
  dia_vencimento: "",
  ativo: true,
  observacao: "",
}

function FixedExpenseDialog({
  open,
  item,
  onOpenChange,
  onSave,
}: {
  open: boolean
  item?: FixedExpense
  onOpenChange: (o: boolean) => void
  onSave: () => Promise<void>
}) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState<FxForm>(FX_DEFAULTS)
  const [saving, setSaving] = useState(false)

  function handleOpen(o: boolean) {
    if (o) {
      setForm(
        item
          ? {
              nome: item.nome,
              categoria: item.categoria,
              valor: String(item.valor),
              frequencia: item.frequencia,
              dia_vencimento: item.dia_vencimento ? String(item.dia_vencimento) : "",
              ativo: item.ativo,
              observacao: item.observacao ?? "",
            }
          : FX_DEFAULTS,
      )
    }
    onOpenChange(o)
  }

  function set<K extends keyof FxForm>(k: K, v: FxForm[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    if (!form.nome.trim()) { toast.error("Informe o nome"); return }
    const valor = parseFloat(form.valor.replace(",", "."))
    if (!valor || valor <= 0) { toast.error("Valor inválido"); return }

    setSaving(true)
    try {
      const payload = {
        nome: form.nome.trim(),
        categoria: form.categoria,
        valor,
        frequencia: form.frequencia as FixedExpense["frequencia"],
        dia_vencimento: form.dia_vencimento ? Number(form.dia_vencimento) : undefined,
        ativo: form.ativo,
        observacao: form.observacao.trim() || undefined,
      }
      if (isEdit && item) {
        await updateFixedExpense(item.id, payload)
        toast.success("Gasto fixo atualizado")
      } else {
        await createFixedExpense(payload)
        toast.success("Gasto fixo criado")
      }
      await onSave()
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar gasto fixo" : "Novo gasto fixo"}</DialogTitle>
          <DialogDescription>
            Gastos fixos representam despesas recorrentes da empresa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input
              placeholder="Ex: Aluguel do galpão"
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => set("categoria", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIXED_EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Recorrência</Label>
              <Select value={form.frequencia} onValueChange={(v) => set("frequencia", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCY_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="0,00"
                value={form.valor}
                onChange={(e) => set("valor", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Dia de vencimento</Label>
              <Input
                type="number"
                min={1}
                max={31}
                placeholder="Ex: 10"
                value={form.dia_vencimento}
                onChange={(e) => set("dia_vencimento", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Observação</Label>
            <Textarea
              placeholder="Notas adicionais (opcional)"
              value={form.observacao}
              onChange={(e) => set("observacao", e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
            <input
              id="fx-ativo"
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={form.ativo}
              onChange={(e) => set("ativo", e.target.checked)}
            />
            <Label htmlFor="fx-ativo" className="cursor-pointer font-normal">
              Gasto ativo (aparece nos totais e pode ser lançado)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={saving} onClick={handleSave}>
            {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar gasto fixo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
