"use client"

import Link from "next/link"
import { Menu, Moon, Sun, LogOut, Building2, KeyRound } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/components/providers/auth-provider"
import { useTenant } from "@/components/providers/tenant-provider"
import { CommandPalette } from "@/components/layout/command-palette"

export function AppHeader({
  onMenuClick,
  sidebarOpen,
}: {
  onMenuClick?: () => void
  sidebarOpen?: boolean
}) {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const { branches, branchId, setBranchId, isLoadingBranches } = useTenant()

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-background px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        aria-expanded={sidebarOpen}
        aria-controls="dashboard-sidebar"
        title={sidebarOpen ? "Fechar menu" : "Abrir menu"}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <CommandPalette />
      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-2 sm:flex">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Select
            value={branchId ?? undefined}
            onValueChange={(v) => setBranchId(v)}
            disabled={isLoadingBranches}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filial" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="hidden text-sm text-muted-foreground md:inline">{user?.name}</span>
        <Button variant="ghost" size="icon" asChild title="Alterar senha">
          <Link href="/dashboard/conta/alterar-senha">
            <KeyRound className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={logout} title="Sair">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
