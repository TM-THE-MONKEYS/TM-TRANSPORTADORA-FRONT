import { siteConfig } from "@/lib/site-config"

type AppFooterProps = {
  companyName?: string
  year?: number
}

export function AppFooter({
  companyName = siteConfig.company,
  year = new Date().getFullYear(),
}: AppFooterProps) {
  return (
    <footer className="border-t border-border px-4 py-3 md:px-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          © {year} {companyName}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}
