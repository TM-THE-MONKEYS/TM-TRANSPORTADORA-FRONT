"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"

/**
 * Força tema claro nas rotas públicas de auth e restaura a preferência ao sair.
 */
export function ForceLightTheme() {
  const { setTheme } = useTheme()

  useEffect(() => {
    const previous = window.localStorage.getItem("theme") ?? "system"
    setTheme("light")
    return () => {
      setTheme(previous === "light" ? "system" : previous)
    }
  }, [setTheme])

  return null
}
