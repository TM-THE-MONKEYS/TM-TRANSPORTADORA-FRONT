"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAllowedModuleRoutes } from "@/hooks/use-allowed-module-routes"
import { getNavIcon } from "@/lib/navigation/nav-icons"
import { cn } from "@/lib/utils"

type ModuleNavLinksProps = {
  variant?: "header" | "grid"
  className?: string
}

export function ModuleNavLinks({ variant = "header", className }: ModuleNavLinksProps) {
  const pathname = usePathname()
  const pages = useAllowedModuleRoutes({ includeHome: variant === "header" })

  if (pages.length === 0) return null

  if (variant === "grid") {
    return (
      <ul className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5", className)}>
        {pages.map((page) => {
          const Icon = getNavIcon(page.href)

          return (
            <li key={page.href}>
              <Link
                href={page.href}
                className={cn(
                  "group flex h-full flex-col items-center justify-center gap-3 rounded-xl border bg-card p-6 text-center shadow-sm transition-colors",
                  "hover:border-primary/40 hover:bg-primary/5",
                )}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="h-7 w-7" aria-hidden />
                </span>
                <span className="text-sm font-medium leading-tight">{page.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <nav
      aria-label="Módulos"
      className={cn(
        "flex min-w-0 flex-1 items-stretch justify-center gap-0.5 overflow-x-auto px-2 py-1",
        className,
      )}
    >
      {pages.map((page) => {
        const Icon = getNavIcon(page.href)
        const active =
          pathname === page.href ||
          (page.href !== "/dashboard" && pathname.startsWith(`${page.href}/`))

        return (
          <Link
            key={page.href}
            href={page.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex w-[4.25rem] shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-colors sm:w-[4.75rem]",
              active
                ? "bg-primary/12 text-primary ring-1 ring-primary/25"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            <span
              className={cn(
                "w-full truncate text-center text-[10px] font-medium leading-none sm:text-[11px]",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              {page.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
