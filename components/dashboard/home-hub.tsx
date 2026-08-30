"use client"

import Image from "next/image"
import { useAuth } from "@/components/providers/auth-provider"
import { getAllowedNavRoutes, HOME_NAV_ROUTE } from "@/lib/rbac/permissions"
import { getNavIcon } from "@/lib/navigation/nav-icons"
import { HomeHubCard } from "./home-hub-card"
import { siteConfig } from "@/lib/site-config"

/** Mapeamento href → token de cor (CSS custom property). */
const MODULE_COLOR_VARS: Record<string, string> = {
  "/dashboard": "--chart-1",
  "/dashboard/fretes": "--chart-2",
  "/dashboard/frota": "--chart-3",
  "/dashboard/motoristas": "--chart-4",
  "/dashboard/abastecimento": "--status-warning",
  "/dashboard/manutencao": "--status-caution",
  "/dashboard/financeiro": "--status-success",
}

export function HomeHub() {
  const { user } = useAuth()

  const cards = user
    ? getAllowedNavRoutes(user.role, user.permissions)
        .filter((r) => r.href !== HOME_NAV_ROUTE.href)
        .map((route) => ({
          ...route,
          icon: getNavIcon(route.href),
          colorVar: MODULE_COLOR_VARS[route.href] ?? "--chart-1",
        }))
    : []

  return (
    /*
     * Bleed edge-to-edge compensando o p-4/p-6 do main do DashboardShell.
     * O background cobre toda a área visível sem alterar o layout das
     * outras páginas.
     */
    <div className="-m-4 flex min-h-[calc(100vh-7.75rem)] flex-col md:-m-6">
      {/* Camada de background com overlay escuro */}
      <div className="relative flex-1">
        <Image
          src={siteConfig.branding.loginImage}
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        {/* Overlay: gradiente descendente — escurece o topo e abre no centro */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/65" />

        {/* Conteúdo centralizado sobre o fundo */}
        <div className="relative z-10 flex flex-1 flex-col justify-center px-4 py-12 md:px-6 md:py-16">
          <div className="mx-auto w-full max-w-5xl space-y-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm md:text-4xl">
                Bem-vindo
              </h1>
              <p className="text-sm text-white/70">{siteConfig.tagline}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {cards.map((card) => (
                <HomeHubCard
                  key={card.href}
                  href={card.href}
                  label={card.label}
                  icon={card.icon}
                  colorVar={card.colorVar}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
