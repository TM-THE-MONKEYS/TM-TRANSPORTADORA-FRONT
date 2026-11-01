import { cn } from "@/lib/utils"

type AppCanvasProps = {
  children: React.ReactNode
  className?: string
}

/**
 * Fundo neutro + tokens `--glass-*` para painéis `glass` / `glass-subtle`.
 * Bleed compensando o padding do `<main>` do `DashboardShell`.
 * Home (foto) NÃO usa isto — usa `glass-hero`.
 */
export function AppCanvas({ children, className }: AppCanvasProps) {
  return (
    <div
      className={cn(
        "app-canvas -m-4 min-h-[calc(100vh-7.75rem)] p-3 md:-m-6 md:p-4 xl:p-5",
        className,
      )}
    >
      {children}
    </div>
  )
}
