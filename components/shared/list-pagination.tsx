"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const DEFAULT_LIST_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

type ListPaginationProps = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
  className?: string
}

/** Paginação numerada reutilizada pelas listagens (mesmo padrão visual de `DataTable`). */
export function ListPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_LIST_PAGE_SIZE_OPTIONS,
  className,
}: ListPaginationProps) {
  if (total <= 0) return null

  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), pageCount)
  const from = (safePage - 1) * pageSize + 1
  const to = Math.min(safePage * pageSize, total)
  const canPrev = safePage > 1
  const canNext = safePage < pageCount

  return (
    <div
      className={
        className ??
        "flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground"
      }
    >
      <div className="flex items-center gap-2">
        <span className="shrink-0">Linhas por página</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="h-8 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <span className="shrink-0">
          {from}–{to} de {total}
        </span>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={!canPrev}
            onClick={() => onPageChange(safePage - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={!canNext}
            onClick={() => onPageChange(safePage + 1)}
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
