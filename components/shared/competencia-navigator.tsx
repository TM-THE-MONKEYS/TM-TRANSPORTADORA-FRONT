"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCompetenciaLabel } from "@/lib/format/dates"
import { cn } from "@/lib/utils"

const NEXT_LIMIT_LABEL = "Limite de 2 meses à frente"

interface CompetenciaNavigatorProps {
  mes: number
  ano: number
  onPrevious: () => void
  onNext: () => void
  className?: string
  size?: "sm" | "md"
  nextDisabled?: boolean
}

export function CompetenciaNavigator({
  mes,
  ano,
  onPrevious,
  onNext,
  className,
  size = "sm",
  nextDisabled = false,
}: CompetenciaNavigatorProps) {
  const btnClass = size === "sm" ? "h-8 w-8" : "h-9 w-9"
  const labelClass = size === "sm" ? "min-w-[120px] text-xs" : "min-w-[140px] text-sm"

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md border bg-muted/30 px-1",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass}
        onClick={onPrevious}
        aria-label="Mês anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className={cn("text-center font-medium capitalize", labelClass)}>
        {formatCompetenciaLabel(mes, ano)}
      </span>
      <span title={nextDisabled ? NEXT_LIMIT_LABEL : undefined} className="inline-flex">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={btnClass}
          onClick={onNext}
          disabled={nextDisabled}
          aria-disabled={nextDisabled}
          aria-label={nextDisabled ? NEXT_LIMIT_LABEL : "Próximo mês"}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </span>
    </div>
  )
}
