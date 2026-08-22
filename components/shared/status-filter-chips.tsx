"use client"

import { cn } from "@/lib/utils"

export type StatusFilterChip<T extends string> = {
  value: T | "all"
  label: string
  count?: number
  /** Classe do dot (ex.: bg-status-progress). Omitido em "all". */
  dotClassName?: string
  /** Se false, o chip some (ex.: status sem itens). */
  visible?: boolean
}

type StatusFilterChipsProps<T extends string> = {
  chips: StatusFilterChip<T>[]
  value: T | "all"
  onChange: (value: T | "all") => void
  className?: string
}

export function StatusFilterChips<T extends string>({
  chips,
  value,
  onChange,
  className,
}: StatusFilterChipsProps<T>) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="group" aria-label="Filtrar por status">
      {chips.map((chip) => {
        if (chip.visible === false) return null
        const active = value === chip.value
        return (
          <button
            key={String(chip.value)}
            type="button"
            onClick={() => onChange(chip.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-foreground",
            )}
          >
            {chip.value !== "all" && chip.dotClassName ? (
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", chip.dotClassName)} />
            ) : null}
            {chip.label}
            {chip.count != null ? (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] leading-5",
                  active ? "bg-white/20 text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {chip.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
