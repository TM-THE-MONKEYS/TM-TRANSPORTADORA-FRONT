import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type DashboardKpiCardProps = {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  tone?: "default" | "primary" | "success" | "warning" | "danger"
  loading?: boolean
}

const toneStyles = {
  default: "border-border bg-card",
  primary: "border-primary/25 bg-primary/5",
  success: "border-green-500/25 bg-green-500/5",
  warning: "border-amber-500/25 bg-amber-500/5",
  danger: "border-destructive/25 bg-destructive/5",
}

const iconToneStyles = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/15 text-primary",
  success: "bg-green-500/15 text-green-700 dark:text-green-400",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  danger: "bg-destructive/15 text-destructive",
}

export function DashboardKpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  loading,
}: DashboardKpiCardProps) {
  return (
    <div
      className={cn(
        "flex gap-4 rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md",
        toneStyles[tone],
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
          iconToneStyles[tone],
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        {loading ? (
          <div className="mt-2 h-8 w-28 animate-pulse rounded bg-muted" />
        ) : (
          <p className="mt-0.5 truncate text-2xl font-bold tracking-tight">{value}</p>
        )}
        {hint && !loading && (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
    </div>
  )
}
