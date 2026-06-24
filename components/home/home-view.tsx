"use client"

import { ModuleNavLinks } from "@/components/navigation/module-nav-links"
import { PageHeader } from "@/components/shared/page-header"
import { useAllowedModuleRoutes } from "@/hooks/use-allowed-module-routes"

export function HomeView() {
  const pages = useAllowedModuleRoutes()

  return (
    <div>
      <PageHeader
        title="Home"
        description="Escolha um módulo para continuar"
      />

      {pages.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum módulo disponível para o seu perfil.
        </p>
      ) : (
        <ModuleNavLinks variant="grid" />
      )}
    </div>
  )
}
