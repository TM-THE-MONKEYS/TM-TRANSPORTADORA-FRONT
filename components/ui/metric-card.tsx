"use client"

import type { CSSProperties } from "react"
import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCountUp } from "@/hooks/use-count-up"
import { parseMetricDisplay } from "@/lib/format/metric-display"
import { cn } from "@/lib/utils"

export type MetricTone = "default" | "primary" | "success" | "warning" | "danger"

export type MetricCardProps = {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  tone?: MetricTone
  loading?: boolean
  className?: string
  /**
   * Superfície. Default `glass-subtle` (tile dentro de um painel `glass`).
   * Use `default` fora do `.dashboard-canvas`.
   */
  variant?: "glass-subtle" | "default"
  /** Count-up ao montar / quando o valor muda. Default true. */
  animate?: boolean
}

/**
 * Cor do tom via tokens (`--primary`, `--status-*`, `--destructive`).
 * `ink` mistura com `--foreground` (% em `--ink-mix`, definido no canvas) p/ contraste AA
 * sobre vidro claro (ex.: `--status-warning` puro não passa).
 */
function toneVars(token: string): CSSProperties {
  // oklab (não oklch): evita interpolar matiz — vermelho + azul-foreground virava magenta.
  const ink = `color-mix(in oklab, ${token} var(--ink-mix, 65%), var(--foreground))`
  return { "--kpi-tone": token, "--kpi-icon": ink, "--kpi-ink": ink } as CSSProperties
}

const TONE_STYLE: Record<MetricTone, CSSProperties> = {
  default: {
    "--kpi-tone": "var(--muted-foreground)",
    "--kpi-icon": "var(--muted-foreground)",
    "--kpi-ink": "var(--foreground)",
  } as CSSProperties,
  primary: toneVars("var(--primary)"),
  success: toneVars("var(--status-success)"),
  warning: toneVars("var(--status-warning)"),
  danger: toneVars("var(--destructive)"),
}

function MetricValue({ value, animate }: { value: string; animate: boolean }) {
  const parsed = parseMetricDisplay(value)
  const enabled = animate && parsed.kind === "animate"
  const target = parsed.kind === "animate" ? parsed.target : 0
  const current = useCountUp(target, { enabled, durationMs: 700 })

  if (parsed.kind === "animate" && enabled) {
    return <>{parsed.format(current)}</>
  }
  return <>{value}</>
}

/**
 * Card de métrica reutilizável (KPI). Preferir este componente a montar `glass-subtle` na mão.
 * Dentro do dashboard: `variant="glass-subtle"` (default). Fora do canvas: `variant="default"`.
 */
export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  loading,
  className,
  variant = "glass-subtle",
  animate = true,
}: MetricCardProps) {
  return (
    <Card
      variant={variant}
      size="none"
      style={TONE_STYLE[tone]}
      className={cn(
        "@container h-full p-4 md:p-5",
        variant === "glass-subtle" && "glass-interactive",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--kpi-tone)_14%,transparent)] text-[var(--kpi-icon)] md:h-10 md:w-10 md:rounded-xl"
          aria-hidden
        >
          <Icon className="h-4 w-4 md:h-5 md:w-5" />
        </span>
        <p className="min-w-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>

      <div className="mt-3 space-y-1 md:mt-3.5">
        {loading ? (
          <Skeleton className="h-9 w-32 bg-foreground/10" />
        ) : (
          <p className="break-words text-2xl font-semibold leading-tight tracking-tight tabular-nums text-[var(--kpi-ink)] @[14rem]:text-[1.75rem]">
            <MetricValue value={value} animate={animate} />
          </p>
        )}
        {hint && !loading && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </Card>
  )
}
