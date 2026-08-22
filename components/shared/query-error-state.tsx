import { Button } from "@/components/ui/button"

export function QueryErrorState({
  title = "Não foi possível carregar",
  description = "Verifique a conexão e tente novamente.",
  onRetry,
}: {
  title?: string
  description?: string
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-destructive/30 bg-destructive/5 py-16 text-center">
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      <Button className="mt-4" variant="outline" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  )
}
