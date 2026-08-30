"use client"

import { usePathname } from "next/navigation"

/**
 * Retorna true se href corresponde à rota atual.
 * Matching exato para /dashboard (raiz); prefixo para rotas filhas.
 */
export function useActiveRoute(href: string): boolean {
  const pathname = usePathname()
  if (href === "/dashboard") return pathname === "/dashboard"
  return pathname === href || pathname.startsWith(`${href}/`)
}
