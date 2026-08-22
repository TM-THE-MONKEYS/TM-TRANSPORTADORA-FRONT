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
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ListPagination, DEFAULT_LIST_PAGE_SIZE_OPTIONS } from "@/components/shared/list-pagination"
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

  return (
    <div className="space-y-4">
      <Input
        placeholder={filterPlaceholder}
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-muted/40">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-5 py-3 text-left font-medium text-muted-foreground"
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
                    <td key={cell.id} className="px-5 py-3.5">
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
