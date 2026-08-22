"use client"

import Link from "next/link"
import {
  CheckCircle2,
  Pencil,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  financeEntryOriginLabel,
  resolveFinanceEntryOrigin,
} from "@/lib/finance/entry-origin"
import { formatBRL } from "@/lib/format/currency"
import { formatDateBR, parseLocalDate } from "@/lib/format/dates"
import { SEMANTIC } from "@/lib/ui/status-colors"
import { cn } from "@/lib/utils"
import type { FinanceEntry, FinanceEntryStatus, FinanceEntryType } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"

const STATUS_BADGE: Record<
  FinanceEntryStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pendente: { label: "Pendente", variant: "outline" },
  pago: { label: "Pago", variant: "secondary" },
  cancelado: { label: "Cancelado", variant: "destructive" },
  vencido: { label: "Vencido", variant: "destructive" },
}

type QuickFilter = "all" | "despesa" | "receita" | "pendente" | "pago"

function effectiveStatus(entry: {
  status: FinanceEntryStatus
  data_vencimento?: string | null
}): FinanceEntryStatus {
  if (
    entry.status === "pendente" &&
    entry.data_vencimento &&
    parseLocalDate(entry.data_vencimento) < new Date(new Date().toDateString())
  ) {
    return "vencido"
  }
  return entry.status
}

interface FinanceEntriesTableProps {
  entries: FinanceEntry[]
  loading?: boolean
  canAdmin?: boolean
  filterType: FinanceEntryType | "all"
  filterStatus: FinanceEntryStatus | "all"
  onFilterTypeChange: (v: FinanceEntryType | "all") => void
  onFilterStatusChange: (v: FinanceEntryStatus | "all") => void
  onMarkPaid?: (entry: FinanceEntry) => void
  onEdit?: (entry: FinanceEntry) => void
  onDelete?: (entry: FinanceEntry) => void
  onNewEntry?: () => void
}

function activeQuickFilter(
  filterType: FinanceEntryType | "all",
  filterStatus: FinanceEntryStatus | "all",
): QuickFilter {
  if (filterType === "despesa" && filterStatus === "all") return "despesa"
  if (filterType === "receita" && filterStatus === "all") return "receita"
  if (filterType === "all" && filterStatus === "pendente") return "pendente"
  if (filterType === "all" && filterStatus === "pago") return "pago"
  if (filterType === "all" && filterStatus === "all") return "all"
  return "all"
}

export function FinanceEntriesTable({
  entries,
  loading,
  canAdmin,
  filterType,
  filterStatus,
  onFilterTypeChange,
  onFilterStatusChange,
  onMarkPaid,
  onEdit,
  onDelete,
  onNewEntry,
}: FinanceEntriesTableProps) {
  const quick = activeQuickFilter(filterType, filterStatus)

  function setQuick(next: QuickFilter) {
    switch (next) {
      case "all":
        onFilterTypeChange("all")
        onFilterStatusChange("all")
        break
      case "despesa":
        onFilterTypeChange("despesa")
        onFilterStatusChange("all")
        break
      case "receita":
        onFilterTypeChange("receita")
        onFilterStatusChange("all")
        break
      case "pendente":
        onFilterTypeChange("all")
        onFilterStatusChange("pendente")
        break
      case "pago":
        onFilterTypeChange("all")
        onFilterStatusChange("pago")
        break
    }
  }

  const chips: { id: QuickFilter; label: string }[] = [
    { id: "all", label: "Todos" },
    { id: "despesa", label: "Despesas" },
    { id: "receita", label: "Receitas" },
    { id: "pendente", label: "Pendentes" },
    { id: "pago", label: "Pagos" },
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setQuick(chip.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                quick === chip.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
        {canAdmin && onNewEntry && (
          <Button size="sm" onClick={onNewEntry}>
            + Lançamento
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Data</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Descrição</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Categoria</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Origem</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Frete</th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Valor</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Status</th>
              {canAdmin && (
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Ações</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: canAdmin ? 8 : 7 }).map((_, j) => (
                    <td key={j} className="px-3 py-3">
                      <div className="h-4">
                        <Skeleton className="h-4 w-full" />
                      </div>
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
                  Nenhum lançamento nesta competência.
                  {canAdmin && onNewEntry ? " Use “+ Lançamento” ou registre gastos no frete." : ""}
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const effStatus = effectiveStatus(entry)
                const statusInfo = STATUS_BADGE[effStatus]
                const origin = resolveFinanceEntryOrigin(entry.observacoes)
                const dateLabel = formatDateBR(entry.data_vencimento || entry.data_pagamento)
                return (
                  <tr
                    key={entry.id}
                    className="border-b transition-colors last:border-0 hover:bg-muted/30"
                  >
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                      {dateLabel}
                    </td>
                    <td className="max-w-[220px] px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {entry.tipo === "receita" ? (
                          <TrendingUp className={cn("h-3.5 w-3.5 shrink-0", SEMANTIC.positiveIcon)} />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 shrink-0 text-destructive" />
                        )}
                        <span className="truncate font-medium">{entry.descricao || "—"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs">{entry.categoria}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {financeEntryOriginLabel(origin)}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      {entry.freight_id ? (
                        <Link
                          href={`/dashboard/fretes/${entry.freight_id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          Ver frete
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2.5 text-right font-semibold tabular-nums",
                        entry.tipo === "receita"
                          ? SEMANTIC.positive
                          : SEMANTIC.negative,
                      )}
                    >
                      {entry.tipo === "receita" ? "+" : "−"}
                      {formatBRL(entry.valor)}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={statusInfo.variant} className="text-[10px]">
                        {statusInfo.label}
                      </Badge>
                    </td>
                    {canAdmin && (
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-0.5">
                          {entry.status === "pendente" && onMarkPaid && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn("h-7 w-7 hover:opacity-80", SEMANTIC.positiveIcon)}
                              onClick={() => onMarkPaid(entry)}
                              title="Marcar como pago"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => onEdit(entry)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => onDelete(entry)}
                              title="Excluir lançamento"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
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
    </div>
  )
}
