"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { Search } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

const routes = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Fretes", href: "/dashboard/fretes" },
  { label: "Frota", href: "/dashboard/frota" },
  { label: "Motoristas", href: "/dashboard/motoristas" },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground hover:bg-muted"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="hidden rounded border bg-background px-1.5 text-xs sm:inline">Ctrl+K</kbd>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0">
          <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
            <Command.Input placeholder="Ir para módulo..." className="h-12 w-full border-b px-4 text-sm outline-none" />
            <Command.List className="max-h-72 overflow-y-auto p-2">
              <Command.Empty>Nenhum resultado.</Command.Empty>
              <Command.Group heading="Módulos">
                {routes.map((r) => (
                  <Command.Item
                    key={r.href}
                    value={r.label}
                    onSelect={() => {
                      router.push(r.href)
                      setOpen(false)
                    }}
                    className="cursor-pointer rounded-md px-2 py-2 text-sm aria-selected:bg-accent"
                  >
                    {r.label}
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}
