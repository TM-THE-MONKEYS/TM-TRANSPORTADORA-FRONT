"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { getAllowedNavRoutes, HOME_NAV_ROUTE } from "@/lib/rbac/permissions"
import { getNavIcon } from "@/lib/navigation/nav-icons"
import { getUserRoleLabel } from "@/lib/navigation/user-role-labels"
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

const MODULE_SUBTITLES: Record<string, string> = {
  "/dashboard": "Indicadores e operação",
  "/dashboard/fretes": "Ordens e status",
  "/dashboard/frota": "Veículos e implementos",
  "/dashboard/motoristas": "Equipe e documentos",
  "/dashboard/abastecimento": "Litros e custos",
  "/dashboard/manutencao": "Agenda e alertas",
  "/dashboard/financeiro": "Caixa e lançamentos",
}

function firstName(fullName: string | undefined) {
  if (!fullName?.trim()) return null
  return fullName.trim().split(/\s+/)[0]
}

export function HomeHub() {
  const { user } = useAuth()
  const greetName = firstName(user?.name)
  const roleLabel = user ? getUserRoleLabel(user.role) : null

  const cards = user
    ? getAllowedNavRoutes(user.role, user.permissions)
        .filter((r) => r.href !== HOME_NAV_ROUTE.href)
        .map((route) => ({
          ...route,
          icon: getNavIcon(route.href),
          colorVar: MODULE_COLOR_VARS[route.href] ?? "--chart-1",
          subtitle: MODULE_SUBTITLES[route.href],
        }))
    : []

  return (
    /*
     * Bleed edge-to-edge. Foto full-bleed + bloco (saudação + dock) no terço
     * superior/centro — evita botões soltos e evita “tudo no rodapé”.
     */
    <div className="-m-4 flex min-h-[calc(100dvh-7.75rem)] flex-col md:-m-6">
      <div className="relative flex min-h-[calc(100dvh-7.75rem)] flex-1 flex-col">
        {/* Mesmo asset e carregamento do login (`siteConfig.branding.loginImage`) — sem next/image cache */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${siteConfig.branding.loginImage})` }}
          role="img"
          aria-label={siteConfig.branding.loginImageAlt}
        />
        {/* Gradiente: leitura no bloco de conteúdo; foto ainda respira */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

        <div className="relative z-10 flex flex-1 flex-col justify-center px-4 py-10 md:px-6 md:py-12 lg:px-8 lg:py-14">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 md:gap-6 lg:-translate-y-6">
            <header className="home-hub-enter max-w-xl space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/55">
                {siteConfig.company}
                {roleLabel ? ` · ${roleLabel}` : ""}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow-sm md:text-4xl lg:text-[2.75rem] lg:leading-tight">
                {greetName ? `Olá, ${greetName}` : "Bem-vindo"}
              </h1>
              <p className="max-w-md text-sm text-white/70 md:text-base">{siteConfig.tagline}</p>
            </header>

            <nav
              aria-label="Módulos"
              className="home-hub-enter glass-hero home-hub-dock p-2 sm:p-2.5"
              style={{ animationDelay: "80ms" }}
            >
              <div className="mb-1 flex items-center justify-between px-3 pt-1 sm:px-3.5">
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/50">
                  Ir para
                </p>
                <p className="text-[11px] text-white/40">{cards.length} módulos</p>
              </div>
              <div className="grid gap-0.5 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map((card) => (
                  <HomeHubCard
                    key={card.href}
                    href={card.href}
                    label={card.label}
                    icon={card.icon}
                    colorVar={card.colorVar}
                    subtitle={card.subtitle}
                  />
                ))}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}
