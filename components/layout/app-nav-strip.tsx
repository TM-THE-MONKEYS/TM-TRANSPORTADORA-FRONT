"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { useActiveRoute } from "@/hooks/use-active-route"
import { useAuth } from "@/components/providers/auth-provider"
import { getAllowedNavRoutes } from "@/lib/rbac/permissions"
import { getNavIcon } from "@/lib/navigation/nav-icons"
import { cn } from "@/lib/utils"

export function AppNavStrip() {
  const { user } = useAuth()
  const routes = user
    ? getAllowedNavRoutes(user.role, user.permissions).map((route) => ({
        ...route,
        icon: getNavIcon(route.href),
      }))
    : []

  return (
    <nav
      className="overflow-x-auto border-b border-border bg-card/80 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Módulos"
    >
      <div className="flex h-11 min-w-max items-center gap-0.5 px-4 md:px-6">
        {routes.map((route) => (
          <NavStripItem
            key={route.href}
            href={route.href}
            label={route.label}
            Icon={route.icon}
          />
        ))}
      </div>
    </nav>
  )
}

function NavStripItem({
  href,
  label,
  Icon,
}: {
  href: string
  label: string
  Icon: LucideIcon
}) {
  const active = useActiveRoute(href)

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
        "hover:text-foreground",
        active ? "font-medium text-primary" : "font-normal text-muted-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </Link>
  )
}
