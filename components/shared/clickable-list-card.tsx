"use client"

import { Card } from "@/components/ui/card"
import { LIST_CARD_INTERACTIVE } from "@/components/shared/list-page"
import { cn } from "@/lib/utils"

type ClickableListCardProps = {
  onActivate: () => void
  children: React.ReactNode
  className?: string
  /** Conteúdo absoluto (ex.: barra de accent à esquerda). */
  accent?: React.ReactNode
}

/** Card clicável com hover/foco padronizado (Enter/Espaço). */
export function ClickableListCard({
  onActivate,
  children,
  className,
  accent,
}: ClickableListCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="group cursor-pointer outline-none"
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onActivate()
        }
      }}
    >
      <Card className={cn(LIST_CARD_INTERACTIVE, className)}>
        {accent}
        {children}
      </Card>
    </div>
  )
}
