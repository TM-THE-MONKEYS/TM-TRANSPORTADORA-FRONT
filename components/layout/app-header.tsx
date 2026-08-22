"use client"

import { useSyncExternalStore } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, KeyRound, LogOut, Menu, Moon, Sun, UserRound } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CommandPalette } from "@/components/layout/command-palette"
import { useAuth } from "@/components/providers/auth-provider"
import { getDefaultHomeRoute } from "@/lib/rbac/permissions"
import { getUserRoleLabel } from "@/lib/navigation/user-role-labels"
import { siteConfig } from "@/lib/site-config"

function subscribeNoop() {
  return () => {}
}

function useIsClient() {
  return useSyncExternalStore(subscribeNoop, () => true, () => false)
}

type AppHeaderProps = {
  onOpenMobileNav?: () => void
}

export function AppHeader({ onOpenMobileNav }: AppHeaderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { user, logout } = useAuth()
  const mounted = useIsClient()

  const homeRoute = user
    ? getDefaultHomeRoute(user.role, user.permissions)
    : "/dashboard"
  const roleLabel = getUserRoleLabel(user?.role)
  const isDark = theme === "dark"
  const logoSrc =
    mounted && resolvedTheme === "dark"
      ? siteConfig.branding.navbarLogoDark
      : siteConfig.branding.navbarLogo

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex min-h-[4.75rem] items-center gap-3 px-4 md:gap-4 md:px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 md:hidden"
          onClick={onOpenMobileNav}
          aria-label="Abrir menu de módulos"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link
          href={homeRoute}
          className="flex shrink-0 items-center gap-2.5"
          aria-label={siteConfig.branding.navbarLogoAlt}
        >
          <Image
            src={logoSrc}
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 object-contain"
            priority
          />
          <span className="hidden text-sm font-semibold tracking-tight sm:inline sm:text-base">
            {siteConfig.navbarBrand}
          </span>
        </Link>

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          <CommandPalette />

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 shrink-0 gap-2 px-3"
                  aria-label="Menu do usuário"
                >
                  <UserRound className="h-4 w-4 text-muted-foreground" />
                  <span className="hidden max-w-[9rem] truncate text-sm font-medium sm:inline">
                    {user.name || roleLabel}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="truncate font-medium">{user.name || roleLabel}</span>
                    <span className="text-xs font-normal text-muted-foreground">{roleLabel}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/conta/alterar-senha" className="cursor-pointer">
                    <KeyRound />
                    Alterar senha
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                >
                  {isDark ? <Sun /> : <Moon />}
                  {isDark ? "Modo claro" : "Modo escuro"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={logout}
                >
                  <LogOut />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
