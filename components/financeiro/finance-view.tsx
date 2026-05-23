"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR, { mutate } from "swr"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import {
  getCashFlow,
  invalidateFinanceCaches,
  listFinanceEntries,
  syncFinanceFromFreights,
} from "@/lib/api/services/finance"
import { isAdminRole } from "@/lib/rbac/permissions"
import type { FinanceEntryType } from "@/types"

const TYPE_LABELS: Record<string, string> = {
  receita: "Receita",
  despesa: "Despesa",
}

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  cancelado: "Cancelado",
  vencido: "Vencido",
}

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-700",
  pago: "bg-green-100 text-green-700",
  cancelado: "bg-gray-100 text-gray-500",
  vencido: "bg-red-100 text-red-700",
}

const TYPE_COLORS: Record<string, string> = {
  receita: "text-green-600",
  despesa: "text-red-600",
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("pt-BR")
}

export function FinanceView() {
  const { user } = useAuth()
  const canSync = isAdminRole(user?.role) || user?.role === "financeiro"
  const [filterType, setFilterType] = useState<FinanceEntryType | "">("")
  const [syncing, setSyncing] = useState(false)

  const { data: cashFlow, isLoading: loadingCashFlow } = useSWR("cash-flow", () => getCashFlow())

  const { data: entriesPage, isLoading: loadingEntries } = useSWR(
    ["finance-entries", filterType],
    () => listFinanceEntries(1, 100, filterType || undefined),
  )

  const entries = entriesPage?.items ?? []

  async function handleSyncFromFreights() {
    setSyncing(true)
    try {
      const stats = await syncFinanceFromFreights()
      invalidateFinanceCaches()
      await mutate(["finance-entries", filterType])
      await mutate("cash-flow")
      toast.success(
        `Sincronizado: ${stats.receitas} receita(s) e ${stats.despesas} despesa(s) dos fretes.`,
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao sincronizar financeiro")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Controle Financeiro</h1>
          <p className="text-muted-foreground text-sm">
            Receitas dos fretes, despesas de abastecimento e custos operacionais
          </p>
        </div>
        {canSync && (
          <Button type="button" variant="outline" disabled={syncing} onClick={handleSyncFromFreights}>
            {syncing ? "Sincronizando..." : "Importar dos fretes"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loadingCashFlow ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card animate-pulse rounded-lg border p-4">
              <div className="bg-muted mb-2 h-4 w-24 rounded" />
              <div className="bg-muted h-8 w-32 rounded" />
            </div>
          ))
        ) : (
          <>
            <SummaryCard
              label="Receita Total"
              value={formatBRL(cashFlow?.total_receitas ?? 0)}
              colorClass="text-green-600"
            />
            <SummaryCard
              label="Despesa Total"
              value={formatBRL(cashFlow?.total_despesas ?? 0)}
              colorClass="text-red-600"
            />
            <SummaryCard
              label="Saldo"
              value={formatBRL(cashFlow?.saldo ?? 0)}
              colorClass={(cashFlow?.saldo ?? 0) >= 0 ? "text-green-600" : "text-red-600"}
            />
            <SummaryCard
              label="Pendente"
              value={formatBRL(
                (cashFlow?.receitas_pendentes ?? 0) + (cashFlow?.despesas_pendentes ?? 0),
              )}
              colorClass="text-yellow-600"
            />
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Tipo:</label>
        <select
          className="rounded-md border px-3 py-1.5 text-sm"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as FinanceEntryType | "")}
        >
          <option value="">Todos</option>
          <option value="receita">Receitas</option>
          <option value="despesa">Despesas</option>
        </select>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Tipo</th>
              <th className="px-4 py-3 text-left font-medium">Categoria</th>
              <th className="px-4 py-3 text-left font-medium">Descrição</th>
              <th className="px-4 py-3 text-left font-medium">Frete</th>
              <th className="px-4 py-3 text-right font-medium">Valor</th>
              <th className="px-4 py-3 text-left font-medium">Vencimento</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loadingEntries ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="bg-muted h-4 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-4 py-8 text-center">
                  Nenhum lançamento.{" "}
                  {canSync ? 'Clique em "Importar dos fretes" para gerar receitas e despesas.' : ""}
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-t transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <span className={`font-medium ${TYPE_COLORS[entry.tipo] ?? ""}`}>
                      {TYPE_LABELS[entry.tipo] ?? entry.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3">{entry.categoria}</td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.descricao ?? "—"}</td>
                  <td className="px-4 py-3">
                    {entry.freight_id ? (
                      <Link
                        href={`/dashboard/fretes/${entry.freight_id}`}
                        className="text-primary hover:underline"
                      >
                        Ver frete
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${TYPE_COLORS[entry.tipo] ?? ""}`}
                  >
                    {entry.tipo === "despesa" ? "-" : "+"}
                    {formatBRL(entry.valor)}
                  </td>
                  <td className="px-4 py-3">{formatDate(entry.data_vencimento)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[entry.status] ?? ""}`}
                    >
                      {STATUS_LABELS[entry.status] ?? entry.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  colorClass,
}: {
  label: string
  value: string
  colorClass: string
}) {
  return (
    <div className="bg-card rounded-lg border p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
  )
}
