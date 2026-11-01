"use client"

import { cn } from "@/lib/utils"

type ListStatTileProps = {
  icon: React.ElementType
  label: string
  value: string | number
  accent: string
  onClick?: () => void
}

/**
 * Tile de estatística nas listagens.
 * Usa `glass` + blur (mesmo idioma da home) — requer `.app-canvas` pai.
 */
export function ListStatTile({
  icon: Icon,
  label,
  value,
  accent,
  onClick,
}: ListStatTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "glass glass-interactive flex items-center gap-3 p-4 text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        onClick ? "cursor-pointer" : "cursor-default",
      )}
    >
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", accent)}>
        <Icon className="h-4 w-4 text-white" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-lg font-bold leading-tight tabular-nums">{value}</p>
      </div>
    </button>
  )
}
