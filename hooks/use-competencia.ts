"use client"

import { useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { currentCompetencia, shiftCompetencia } from "@/lib/format/dates"

const PARAM = "competencia"
const RE = /^(\d{4})-(\d{2})$/

function parseCompetenciaParam(raw: string | null): { mes: number; ano: number } {
  if (!raw) return currentCompetencia()
  const m = RE.exec(raw)
  if (!m) return currentCompetencia()
  const ano = Number(m[1])
  const mes = Number(m[2])
  if (mes < 1 || mes > 12 || ano < 2000 || ano > 2100) return currentCompetencia()
  return { mes, ano }
}

function toParam(mes: number, ano: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}`
}

export function useCompetencia() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const competencia = useMemo(
    () => parseCompetenciaParam(searchParams.get(PARAM)),
    [searchParams],
  )

  const setCompetencia = useCallback(
    (next: { mes: number; ano: number }) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(PARAM, toParam(next.mes, next.ano))
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const shift = useCallback(
    (delta: number) => {
      setCompetencia(shiftCompetencia(competencia.mes, competencia.ano, delta))
    },
    [competencia.ano, competencia.mes, setCompetencia],
  )

  return { competencia, setCompetencia, shift }
}
