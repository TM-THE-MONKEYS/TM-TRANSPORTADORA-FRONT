import { cn } from "@/lib/utils"

/** Classes compartilhadas de microinteração em cards de listagem. */
export const LIST_CARD_INTERACTIVE =
  "relative overflow-hidden transition-all duration-150 group-hover:shadow-md group-hover:-translate-y-px group-focus-visible:ring-2 group-focus-visible:ring-ring"

type ListPageProps = {
  header: React.ReactNode
  stats?: React.ReactNode
  toolbar?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/** Shell padrão das telas de listagem do painel. */
export function ListPage({ header, stats, toolbar, children, className }: ListPageProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {header}
      {stats}
      {toolbar}
      {children}
    </div>
  )
}
