import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type HomeHubCardProps = {
  href: string
  label: string
  icon: LucideIcon
  /** CSS custom property name, e.g. "--chart-1". Provides icon bg tint. */
  colorVar?: string
  subtitle?: string
  className?: string
}

/** Item de módulo dentro do painel dock da home (linha, não tile solto). */
export function HomeHubCard({
  href,
  label,
  icon: Icon,
  colorVar,
  subtitle,
  className,
}: HomeHubCardProps) {
  const iconBg = colorVar
    ? `color-mix(in oklch, var(${colorVar}) 22%, transparent)`
    : "oklch(1 0 0 / 0.1)"
  const iconColor = colorVar ? `var(${colorVar})` : "oklch(1 0 0 / 0.9)"

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors",
        "hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
        className,
      )}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: iconBg }}
        aria-hidden
      >
        <Icon className="h-[18px] w-[18px]" style={{ color: iconColor }} />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-medium text-white">{label}</span>
        {subtitle ? (
          <span className="block truncate text-xs text-white/55">{subtitle}</span>
        ) : null}
      </span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-white/35 transition-transform group-hover:translate-x-0.5 group-hover:text-white/70"
        aria-hidden
      />
    </Link>
  )
}
