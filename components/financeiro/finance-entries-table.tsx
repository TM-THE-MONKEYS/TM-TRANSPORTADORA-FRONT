"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import {
  AlignCenter,
  AlignJustify,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  Download,
  MoreHorizontal,
  Pencil,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { ListSearchField } from "@/components/shared/list-search-field"
import { EmptyState } from "@/components/shared/empty-state"
import { useTableDensity } from "@/hooks/use-table-density"
import {
  financeEntryOriginLabel,
  resolveFinanceEntryOrigin,
} from "@/lib/finance/entry-origin"
import { formatBRL } from "@/lib/format/currency"
import { formatDateBR, parseLocalDate } from "@/lib/format/dates"
import { SEMANTIC } from "@/lib/ui/status-colors"
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

type QuickFilter = "all" | "despesa" | "receita" | "pendente" | "pago" | "vencido"

export function effectiveStatus(entry: {
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

function exportEntriesToCSV(rows: FinanceEntry[], filename: string) {
  const headers = ["Data", "Descrição", "Categoria", "Origem", "Valor", "Status"]
  const csvRows = rows.map((e) => {
    const origin = financeEntryOriginLabel(resolveFinanceEntryOrigin(e.observacoes))
    return [
      formatDateBR(e.data_vencimento || e.data_pagamento) ?? "",
      e.descricao ?? "",
      e.categoria,
      origin,
      `${e.tipo === "receita" ? "+" : "-"}${e.valor.toFixed(2)}`,
      effectiveStatus(e),
    ]
  })
  const content = [
    headers.join(","),
    ...csvRows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n")
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
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
  /** Label do mês usado no nome do arquivo CSV exportado */
  exportLabel?: string
}

const CHIPS: { id: QuickFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "despesa", label: "Despesas" },
  { id: "receita", label: "Receitas" },
  { id: "pendente", label: "Pendentes" },
  { id: "pago", label: "Pagos" },
  { id: "vencido", label: "Vencidos" },
]

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
  exportLabel = "extrato",
}: FinanceEntriesTableProps) {
  const [search, setSearch] = useState("")
  const [vencidoFilter, setVencidoFilter] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([{ id: "data", desc: true }])
  const [density, toggleDensity] = useTableDensity()

  function activeChip(): QuickFilter {
    if (vencidoFilter) return "vencido"
    if (filterType === "despesa" && filterStatus === "all") return "despesa"
    if (filterType === "receita" && filterStatus === "all") return "receita"
    if (filterType === "all" && filterStatus === "pendente") return "pendente"
    if (filterType === "all" && filterStatus === "pago") return "pago"
    return "all"
  }

  function setQuick(next: QuickFilter) {
    if (next === "vencido") {
      onFilterTypeChange("all")
      onFilterStatusChange("all")
      setVencidoFilter(true)
      return
    }
    setVencidoFilter(false)
    switch (next) {
      case "all":      onFilterTypeChange("all");      onFilterStatusChange("all");      break
      case "despesa":  onFilterTypeChange("despesa");  onFilterStatusChange("all");      break
      case "receita":  onFilterTypeChange("receita");  onFilterStatusChange("all");      break
      case "pendente": onFilterTypeChange("all");      onFilterStatusChange("pendente"); break
      case "pago":     onFilterTypeChange("all");      onFilterStatusChange("pago");     break
    }
  }

  const quick = activeChip()

  const filteredEntries = useMemo(() => {
    let result = entries
    if (vencidoFilter) {
      result = result.filter((e) => effectiveStatus(e) === "vencido")
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (e) =>
          (e.descricao ?? "").toLowerCase().includes(q) ||
          (e.categoria ?? "").toLowerCase().includes(q),
      )
    }
    return result
  }, [entries, vencidoFilter, search])

  const handleExport = useCallback(() => {
    exportEntriesToCSV(filteredEntries, `financeiro-${exportLabel}.csv`)
  }, [filteredEntries, exportLabel])

  const columns = useMemo<ColumnDef<FinanceEntry>[]>(() => {
    const base: ColumnDef<FinanceEntry>[] = [
      {
        id: "data",
        header: "Data",
        accessorFn: (row) => row.data_vencimento || row.data_pagamento || row.created_at,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {formatDateBR(row.original.data_vencimento || row.original.data_pagamento)}
          </span>
        ),
      },
      {
        id: "descricao",
        header: "Descrição",
        accessorKey: "descricao",
        cell: ({ row }) => (
          <div className="flex max-w-[220px] items-center gap-1.5">
            {row.original.tipo === "receita" ? (
              <TrendingUp className={cn("h-3.5 w-3.5 shrink-0", SEMANTIC.positiveIcon)} />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 shrink-0 text-destructive" />
            )}
            <span className="truncate font-medium">{row.original.descricao || "—"}</span>
          </div>
        ),
      },
      {
        id: "categoria",
        header: "Categoria",
        accessorKey: "categoria",
        cell: ({ row }) => <span className="text-xs">{row.original.categoria}</span>,
      },
      {
        id: "origem",
        header: "Origem",
        enableSorting: false,
        cell: ({ row }) => {
          const origin = resolveFinanceEntryOrigin(row.original.observacoes)
          return (
            <Badge variant="outline" className="text-[10px] font-normal">
              {financeEntryOriginLabel(origin)}
            </Badge>
          )
        },
      },
      {
        id: "frete",
        header: "Frete",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.freight_id ? (
            <Link
              href={`/dashboard/fretes/${row.original.freight_id}`}
              className="text-xs text-primary hover:underline"
            >
              Ver frete
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        id: "valor",
        header: "Valor",
        accessorKey: "valor",
        cell: ({ row }) => (
          <span
            className={cn(
              "font-semibold tabular-nums",
              row.original.tipo === "receita" ? SEMANTIC.positive : SEMANTIC.negative,
            )}
          >
            {row.original.tipo === "receita" ? "+" : "−"}
            {formatBRL(row.original.valor)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => effectiveStatus(row),
        cell: ({ row }) => {
          const effStatus = effectiveStatus(row.original)
          const info = STATUS_BADGE[effStatus]
          return (
            <Badge variant={info.variant} className="text-[10px]">
              {info.label}
            </Badge>
          )
        },
      },
    ]

    if (!canAdmin) return base

    return [
      ...base,
      {
        id: "acoes",
        header: () => <span className="sr-only">Ações</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const entry = row.original
          return (
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
          )
        },
      },
    ]
  }, [canAdmin, onMarkPaid, onEdit, onDelete])

  const table = useReactTable({
    data: filteredEntries,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const colCount = canAdmin ? 8 : 7
  const isEmpty = !loading && filteredEntries.length === 0
  const hasActiveFilter = search.trim() !== "" || vencidoFilter
  const rowPadding = density === "compact" ? "px-3 py-1.5" : "px-3 py-2.5"
  const headPadding = density === "compact" ? "px-3 py-2" : "px-3 py-2.5"

  return (
    <div className="space-y-3">
      {/* Chips + busca + botões */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {CHIPS.map((chip) => (
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
        <div className="flex items-center gap-2">
          <ListSearchField
            value={search}
            onChange={setSearch}
            placeholder="Buscar descrição ou categoria..."
            className="w-full sm:w-64"
          />
          {canAdmin && filteredEntries.length > 0 && (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleExport}
              title="Exportar CSV"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden h-9 w-9 shrink-0 sm:flex"
            onClick={toggleDensity}
            title={density === "compact" ? "Modo confortável" : "Modo compacto"}
          >
            {density === "compact" ? (
              <AlignCenter className="h-4 w-4" />
            ) : (
              <AlignJustify className="h-4 w-4" />
            )}
          </Button>
          {canAdmin && onNewEntry && (
            <Button size="sm" onClick={onNewEntry} className="shrink-0">
              + Lançamento
            </Button>
          )}
        </div>
      </div>

      {/* Tabela desktop */}
      {(loading || !isEmpty) && (
        <div className="hidden overflow-x-auto rounded-lg border sm:block">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b bg-muted/40">
                  {headerGroup.headers.map((header) => {
                    const isRight = header.column.id === "valor" || header.column.id === "acoes"
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          headPadding,
                          "font-medium text-muted-foreground",
                          isRight ? "text-right" : "text-left",
                        )}
                      >
                        {header.isPlaceholder ? null : (
                          <button
                            type="button"
                            className={cn(
                              "flex items-center gap-1",
                              header.column.getCanSort() &&
                                "cursor-pointer select-none hover:text-foreground",
                              isRight && "ml-auto",
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                            disabled={!header.column.getCanSort()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <span className="inline-flex">
                                {header.column.getIsSorted() === "asc" ? (
                                  <ArrowUp className="h-3.5 w-3.5" />
                                ) : header.column.getIsSorted() === "desc" ? (
                                  <ArrowDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                                )}
                              </span>
                            )}
                          </button>
                        )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      {Array.from({ length: colCount }).map((_, j) => (
                        <td key={j} className="px-3 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b transition-colors last:border-0 hover:bg-muted/30"
                    >
                      {row.getVisibleCells().map((cell) => {
                        const isRight =
                          cell.column.id === "valor" || cell.column.id === "acoes"
                        return (
                          <td
                            key={cell.id}
                            className={cn(rowPadding, isRight && "text-right")}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cards mobile */}
      {!loading && !isEmpty && (
        <div className="space-y-2 sm:hidden">
          {table.getRowModel().rows.map((row) => {
            const entry = row.original
            const effStatus = effectiveStatus(entry)
            const info = STATUS_BADGE[effStatus]
            const origin = resolveFinanceEntryOrigin(entry.observacoes)
            return (
              <div key={entry.id} className="rounded-lg border bg-card px-4 py-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      {entry.tipo === "receita" ? (
                        <TrendingUp
                          className={cn("h-3.5 w-3.5 shrink-0", SEMANTIC.positiveIcon)}
                        />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 shrink-0 text-destructive" />
                      )}
                      <p className="truncate text-sm font-medium">
                        {entry.descricao || "—"}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">{entry.categoria}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        entry.tipo === "receita" ? SEMANTIC.positive : SEMANTIC.negative,
                      )}
                    >
                      {entry.tipo === "receita" ? "+" : "−"}
                      {formatBRL(entry.valor)}
                    </span>
                    <Badge variant={info.variant} className="text-[10px]">
                      {info.label}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{formatDateBR(entry.data_vencimento || entry.data_pagamento)}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {financeEntryOriginLabel(origin)}
                    </Badge>
                    {entry.freight_id && (
                      <Link
                        href={`/dashboard/fretes/${entry.freight_id}`}
                        className="text-primary hover:underline"
                      >
                        Ver frete
                      </Link>
                    )}
                    {canAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="-mr-1 h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Ações</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {entry.status === "pendente" && onMarkPaid && (
                            <DropdownMenuItem onClick={() => onMarkPaid(entry)}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Marcar como pago
                            </DropdownMenuItem>
                          )}
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(entry)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(entry)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Skeleton mobile */}
      {loading && (
        <div className="space-y-2 sm:hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border px-4 py-3 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {isEmpty &&
        (hasActiveFilter ? (
          <EmptyState
            title="Nenhum lançamento encontrado"
            description="Tente ajustar a busca ou os filtros para encontrar o que procura."
          />
        ) : (
          <EmptyState
            title="Nenhum lançamento nesta competência"
            description={
              canAdmin && onNewEntry
                ? 'Use "+ Lançamento" ou registre gastos no frete para começar.'
                : "Não há lançamentos para exibir neste período."
            }
            actionLabel={canAdmin && onNewEntry ? "+ Lançamento" : undefined}
            onAction={canAdmin && onNewEntry ? onNewEntry : undefined}
          />
        ))}
    </div>
  )
}
