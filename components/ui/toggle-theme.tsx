"use client"

import { useId, useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { MoonIcon, SunIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

function subscribeNoop() {
  return () => {}
}

function useIsClient() {
  return useSyncExternalStore(subscribeNoop, () => true, () => false)
}

/** Alterna claro/escuro com Switch (sol · interruptor · lua), ligado ao next-themes. */
export function ToggleTheme({ className }: { className?: string }) {
  const id = useId()
  const mounted = useIsClient()
  const { setTheme, resolvedTheme } = useTheme()
  const isDark = mounted && resolvedTheme === "dark"

  return (
    <div className={cn("group inline-flex items-center gap-2", className)}>
      <button
        type="button"
        id={`${id}-light`}
        className={cn(
          "cursor-pointer text-left text-sm font-medium",
          isDark && "text-foreground/50",
        )}
        aria-controls={id}
        aria-label="Ativar modo claro"
        onClick={() => setTheme("light")}
      >
        <SunIcon className="size-4" aria-hidden="true" />
      </button>

      <Switch
        id={id}
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-labelledby={`${id}-light ${id}-dark`}
        aria-label="Alternar entre modo escuro e claro"
      />

      <button
        type="button"
        id={`${id}-dark`}
        className={cn(
          "cursor-pointer text-right text-sm font-medium",
          !isDark && "text-foreground/50",
        )}
        aria-controls={id}
        aria-label="Ativar modo escuro"
        onClick={() => setTheme("dark")}
      >
        <MoonIcon className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export default ToggleTheme
