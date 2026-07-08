"use client"

import Link from "next/link"
import {
  ArrowUpDown,
  CheckCircle2,
  Pencil,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatBRL } from "@/lib/format/currency"
import { formatDateBR, isFixedExpenseEntry, parseLocalDate } from "@/lib/format/dates"
import { cn } from "@/lib/utils"
import type { FinanceEntry, FinanceEntryStatus, FinanceEntryType } from "@/types"

const STATUS_BADGE: Record<
  FinanceEntryStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pendente: { label: "Pendente", variant: "outline" },
  pago: { label: "Pago", variant: "secondary" },
  cancelado: { label: "Cancelado", variant: "destructive" },
  vencido: { label: "Vencido", variant: "destructive" },
}

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
}: FinanceEntriesTableProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filterType}
          onValueChange={(v) => onFilterTypeChange(v as FinanceEntryType | "all")}
        >
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos tipos</SelectItem>
            <SelectItem value="receita">Receitas</SelectItem>
            <SelectItem value="despesa">Despesas</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filterStatus}
          onValueChange={(v) => onFilterStatusChange(v as FinanceEntryStatus | "all")}
        >
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

      <div className="overflow-x-auto rounded-lg border">
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
            {loading ? (
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
                  Nenhum lançamento nesta competência.
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
                    <td className="px-4 py-3 text-xs font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        {entry.categoria}
                        {isFixedExpenseEntry(entry.observacoes) && (
                          <Badge
                            variant="outline"
                            className="h-4 border-amber-400/60 bg-amber-50 px-1 text-[9px] font-normal text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                            title="Despesa fixa"
                          >
                            Fixo
                          </Badge>
                        )}
                      </span>
                    </td>
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
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {formatBRL(entry.valor)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDateBR(entry.data_vencimento)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusInfo.variant} className="text-[10px]">
                        {statusInfo.label}
                      </Badge>
                    </td>
                    {canAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          {entry.status === "pendente" && onMarkPaid && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-green-600 hover:text-green-700"
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
