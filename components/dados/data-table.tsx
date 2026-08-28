"use client"

import { useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown, AlignJustify, AlignCenter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ListPagination, DEFAULT_LIST_PAGE_SIZE_OPTIONS } from "@/components/shared/list-pagination"
import { useTableDensity } from "@/hooks/use-table-density"
import { cn } from "@/lib/utils"

const DEFAULT_PAGE_SIZE_OPTIONS = DEFAULT_LIST_PAGE_SIZE_OPTIONS

type DataTableProps<T> = {
  columns: ColumnDef<T, unknown>[]
  data: T[]
  loading?: boolean
  error?: Error | null
  filterPlaceholder?: string
  emptyMessage?: string
  /** Quando fornecido, habilita paginação client-side com os tamanhos listados. */
  pageSizeOptions?: number[]
  defaultPageSize?: number
}

export function DataTable<T>({
  columns,
  data,
  loading,
  error,
  filterPlaceholder = "Filtrar registros...",
  emptyMessage = "Nenhum registro encontrado",
  pageSizeOptions,
  defaultPageSize,
}: DataTableProps<T>) {
  const clientPaginated = Boolean(pageSizeOptions)
  const sizeOptions = pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS
  const initialSize = defaultPageSize ?? sizeOptions[0] ?? 20

  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: initialSize })
  const [density, toggleDensity] = useTableDensity()

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, ...(clientPaginated ? { pagination } : {}) },
    onSortingChange: setSorting,
    onGlobalFilterChange: (value) => {
      setGlobalFilter(value)
      if (clientPaginated) setPagination((p) => ({ ...p, pageIndex: 0 }))
    },
    ...(clientPaginated
      ? {
          onPaginationChange: setPagination,
          getPaginationRowModel: getPaginationRowModel(),
        }
      : {}),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const totalFiltered = table.getFilteredRowModel().rows.length

  const rowPadding = density === "compact" ? "px-5 py-1.5" : "px-5 py-3.5"
  const headPadding = density === "compact" ? "px-5 py-2" : "px-5 py-3"

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder={filterPlaceholder}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={toggleDensity}
          title={density === "compact" ? "Modo confortável" : "Modo compacto"}
        >
          {density === "compact" ? (
            <AlignCenter className="h-4 w-4" />
          ) : (
            <AlignJustify className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-muted/40">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(headPadding, "text-left font-medium text-muted-foreground")}
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className={cn(
                          "flex items-center gap-1",
                          header.column.getCanSort() && "cursor-pointer select-none hover:text-foreground",
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
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, rowIdx) => (
                <tr key={`skeleton-${rowIdx}`} className="border-b">
                  {columns.map((_, colIdx) => (
                    <td key={`skeleton-${rowIdx}-${colIdx}`} className="px-5 py-3">
                      <Skeleton className="h-4 w-full max-w-[12rem]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-10 text-center text-destructive"
                >
                  {error.message || "Erro ao carregar dados"}
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-10 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b transition-colors last:border-0 hover:bg-muted/30"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={rowPadding}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {clientPaginated && !loading && !error && totalFiltered > 0 && (
        <ListPagination
          page={pagination.pageIndex + 1}
          pageSize={pagination.pageSize}
          total={totalFiltered}
          pageSizeOptions={sizeOptions}
          onPageChange={(nextPage) =>
            setPagination((p) => ({ ...p, pageIndex: nextPage - 1 }))
          }
          onPageSizeChange={(nextSize) =>
            setPagination({ pageIndex: 0, pageSize: nextSize })
          }
        />
      )}
    </div>
  )
}
