"use client"

import { useCallback, useEffect, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  clampCompetenciaToLimit,
  currentCompetencia,
  isCompetenciaWithinLimit,
  shiftCompetencia,
} from "@/lib/format/dates"

const DEFAULT_PARAM = "competencia"
const RE = /^(\d{4})-(\d{2})$/

function parseCompetenciaParam(raw: string | null): { mes: number; ano: number } {
  if (!raw) return currentCompetencia()
  const m = RE.exec(raw)
  if (!m) return currentCompetencia()
  const ano = Number(m[1])
  const mes = Number(m[2])
  if (mes < 1 || mes > 12 || ano < 2000 || ano > 2100) return currentCompetencia()
  return clampCompetenciaToLimit(mes, ano)
}

function toParam(mes: number, ano: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}`
}

export function useCompetencia(paramName = DEFAULT_PARAM) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const competencia = useMemo(
    () => parseCompetenciaParam(searchParams.get(paramName)),
    [searchParams, paramName],
  )

  const setCompetencia = useCallback(
    (next: { mes: number; ano: number }) => {
      const clamped = clampCompetenciaToLimit(next.mes, next.ano)
      const params = new URLSearchParams(searchParams.toString())
      params.set(paramName, toParam(clamped.mes, clamped.ano))
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [paramName, pathname, router, searchParams],
  )

  const shift = useCallback(
    (delta: number) => {
      const next = shiftCompetencia(competencia.mes, competencia.ano, delta)
      if (delta > 0 && !isCompetenciaWithinLimit(next.mes, next.ano)) return
      setCompetencia(next)
    },
    [competencia.ano, competencia.mes, setCompetencia],
  )

  const canGoForward = useMemo(() => {
    const next = shiftCompetencia(competencia.mes, competencia.ano, 1)
    return isCompetenciaWithinLimit(next.mes, next.ano)
  }, [competencia.ano, competencia.mes])

  useEffect(() => {
    const raw = searchParams.get(paramName)
    if (!raw) {
      setCompetencia(currentCompetencia())
      return
    }
    const parsed = parseCompetenciaParam(raw)
    if (toParam(parsed.mes, parsed.ano) !== raw) {
      setCompetencia(parsed)
    }
  }, [paramName, searchParams, setCompetencia])

  return { competencia, setCompetencia, shift, canGoForward }
}
