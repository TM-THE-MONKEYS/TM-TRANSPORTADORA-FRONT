"use client"

import Link from "next/link"
import { ChevronDown, KeyRound, LogOut, Moon, Sun, UserRound } from "lucide-react"
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
import { ModuleNavLinks } from "@/components/navigation/module-nav-links"
import { useAuth } from "@/components/providers/auth-provider"
import { getDefaultHomeRoute } from "@/lib/rbac/permissions"
import { getUserRoleLabel } from "@/lib/navigation/user-role-labels"
import { siteConfig } from "@/lib/site-config"

export function AppHeader() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()

  const homeRoute = user
    ? getDefaultHomeRoute(user.role, user.permissions)
    : "/dashboard/home"
  const roleLabel = getUserRoleLabel(user?.role)
  const isDark = theme === "dark"

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex min-h-[4.75rem] items-center gap-3 px-4 md:gap-4 md:px-6">
        <Link
          href={homeRoute}
          className="shrink-0 text-sm font-semibold tracking-tight sm:text-base"
        >
          {siteConfig.navbarBrand}
        </Link>

        <ModuleNavLinks />

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="ml-auto h-10 shrink-0 gap-2 px-3"
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
    </header>
  )
}
