import { cn } from "@/lib/utils"

const titleClass = {
  default: "text-2xl font-bold tracking-tight",
  compact: "text-xl font-semibold tracking-tight",
} as const

export function PageHeader({
  title,
  description,
  actions,
  density = "default",
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  /** `compact` em telas densas (detalhe / sub-módulos). */
  density?: keyof typeof titleClass
  className?: string
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className={titleClass[density]}>{title}</h1>
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
