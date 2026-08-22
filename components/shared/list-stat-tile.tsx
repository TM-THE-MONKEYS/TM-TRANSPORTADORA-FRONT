"use client"

import { cn } from "@/lib/utils"

type ListStatTileProps = {
  icon: React.ElementType
  label: string
  value: string | number
  accent: string
  onClick?: () => void
}

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
        "flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-sm" : "cursor-default",
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
