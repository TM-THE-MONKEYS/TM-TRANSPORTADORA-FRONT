import Link from "next/link"
import type { LucideIcon } from "lucide-react"

type HomeHubCardProps = {
  href: string
  label: string
  icon: LucideIcon
  /** CSS custom property name, e.g. "--chart-1". Provides icon bg tint. */
  colorVar?: string
  subtitle?: string
}

export function HomeHubCard({ href, label, icon: Icon, colorVar, subtitle }: HomeHubCardProps) {
  const iconBg = colorVar
    ? `color-mix(in oklch, var(${colorVar}) 20%, transparent)`
    : undefined
  const iconColor = colorVar ? `var(${colorVar})` : undefined

  return (
    <Link
      href={href}
      className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-6 text-center backdrop-blur-md transition-colors hover:border-white/30 hover:bg-white/20"
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="h-[18px] w-[18px]" style={{ color: iconColor }} aria-hidden />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-white drop-shadow-sm">{label}</span>
        {subtitle && (
          <span className="text-xs text-white/65">{subtitle}</span>
        )}
      </div>
    </Link>
  )
}
