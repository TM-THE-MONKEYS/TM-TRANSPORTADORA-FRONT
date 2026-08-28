"use client"

import { useState, useEffect, useCallback } from "react"

export type TableDensity = "comfortable" | "compact"

const STORAGE_KEY = "tm:table-density"

export function useTableDensity(): [TableDensity, () => void] {
  const [density, setDensity] = useState<TableDensity>("comfortable")

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "compact" || stored === "comfortable") {
      setDensity(stored)
    }
  }, [])

  const toggle = useCallback(() => {
    setDensity((prev) => {
      const next: TableDensity = prev === "comfortable" ? "compact" : "comfortable"
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [])

  return [density, toggle]
}
