import { AppCanvas } from "@/components/layout/app-canvas"
import { cn } from "@/lib/utils"

/** Microinteração em cards de listagem (combinar com `glass` / `glass-interactive`). */
export const LIST_CARD_INTERACTIVE =
  "relative overflow-hidden group-focus-visible:ring-2 group-focus-visible:ring-ring"

type ListPageProps = {
  header: React.ReactNode
  stats?: React.ReactNode
  toolbar?: React.ReactNode
  children: React.ReactNode
  className?: string
  /**
   * Envolve a listagem em `AppCanvas` (tokens de vidro + blobs).
   * Default `true` — padrão visual do painel. Desligar só se o pai já fornecer canvas.
   */
  canvas?: boolean
}

/** Shell padrão das telas de listagem do painel. */
export function ListPage({
  header,
  stats,
  toolbar,
  children,
  className,
  canvas = true,
}: ListPageProps) {
  const body = (
    <div className={cn("space-y-5 md:space-y-6", className)}>
      {header}
      {stats}
      {toolbar}
      {children}
    </div>
  )

  if (!canvas) return body
  return <AppCanvas>{body}</AppCanvas>
}
