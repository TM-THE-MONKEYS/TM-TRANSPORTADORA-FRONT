"use client"

import { useState } from "react"
import useSWR from "swr"
import { getCashFlow, listFinanceEntries } from "@/lib/api/services/finance"
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
  const [filterType, setFilterType] = useState<FinanceEntryType | "">("")

  const { data: cashFlow, isLoading: loadingCashFlow } = useSWR(
    "cash-flow",
    () => getCashFlow(),
  )

  const { data: entriesPage, isLoading: loadingEntries } = useSWR(
    ["finance-entries", filterType],
    () => listFinanceEntries(1, 50, filterType || undefined),
  )

  const entries = entriesPage?.items ?? []

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Controle Financeiro</h1>
          <p className="text-muted-foreground text-sm">Receitas, despesas e fluxo de caixa</p>
        </div>
      </div>

      {/* Cash Flow Cards */}
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

      {/* Filters */}
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

      {/* Entries Table */}
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Tipo</th>
              <th className="px-4 py-3 text-left font-medium">Categoria</th>
              <th className="px-4 py-3 text-left font-medium">Descrição</th>
              <th className="px-4 py-3 text-right font-medium">Valor</th>
              <th className="px-4 py-3 text-left font-medium">Vencimento</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loadingEntries ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="bg-muted h-4 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center">
                  Nenhum lançamento encontrado
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`font-medium ${TYPE_COLORS[entry.tipo] ?? ""}`}>
                      {TYPE_LABELS[entry.tipo] ?? entry.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3">{entry.categoria}</td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.descricao ?? "—"}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${TYPE_COLORS[entry.tipo] ?? ""}`}>
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
