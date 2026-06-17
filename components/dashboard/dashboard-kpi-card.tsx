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

const accentStyles = {
  default:  "before:bg-border",
  primary:  "before:bg-primary",
  success:  "before:bg-green-500",
  warning:  "before:bg-amber-500",
  danger:   "before:bg-destructive",
}

const iconColor = {
  default:  "text-muted-foreground",
  primary:  "text-primary",
  success:  "text-green-500",
  warning:  "text-amber-500",
  danger:   "text-destructive",
}

const valueColor = {
  default:  "",
  primary:  "text-primary",
  success:  "text-green-700 dark:text-green-400",
  warning:  "text-amber-700 dark:text-amber-400",
  danger:   "text-destructive",
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
        "relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all",
        "hover:shadow-md hover:-translate-y-0.5",
        "before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-xl",
        accentStyles[tone],
      )}
    >
      {/* Watermark icon */}
      <Icon
        className={cn(
          "absolute right-4 top-4 h-14 w-14 opacity-[0.06]",
          iconColor[tone],
        )}
        aria-hidden
      />

      <div className="relative space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        {loading ? (
          <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
        ) : (
          <p className={cn("text-3xl font-bold tracking-tight tabular-nums", valueColor[tone])}>
            {value}
          </p>
        )}
        {hint && !loading && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
    </div>
  )
}
