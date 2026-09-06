import { describe, expect, it } from "vitest"
import {
  clampCompetenciaToLimit,
  isCompetenciaWithinLimit,
  shiftCompetencia,
} from "@/lib/format/dates"

const NOW = new Date(2026, 8, 15) // 15/09/2026 — mês base 1 = setembro

describe("isCompetenciaWithinLimit", () => {
  it("permite o mês atual", () => {
    expect(isCompetenciaWithinLimit(9, 2026, 2, NOW)).toBe(true)
  })

  it("permite até 2 meses à frente", () => {
    expect(isCompetenciaWithinLimit(11, 2026, 2, NOW)).toBe(true)
  })

  it("bloqueia 3 meses à frente", () => {
    expect(isCompetenciaWithinLimit(12, 2026, 2, NOW)).toBe(false)
  })

  it("permite o passado", () => {
    expect(isCompetenciaWithinLimit(1, 2026, 2, NOW)).toBe(true)
    expect(isCompetenciaWithinLimit(12, 2025, 2, NOW)).toBe(true)
  })
})

describe("clampCompetenciaToLimit", () => {
  it("mantém competência dentro do limite", () => {
    expect(clampCompetenciaToLimit(9, 2026, 2, NOW)).toEqual({ mes: 9, ano: 2026 })
    expect(clampCompetenciaToLimit(11, 2026, 2, NOW)).toEqual({ mes: 11, ano: 2026 })
    expect(clampCompetenciaToLimit(3, 2026, 2, NOW)).toEqual({ mes: 3, ano: 2026 })
  })

  it("rebaixa competência além do teto para o mês atual + max", () => {
    expect(clampCompetenciaToLimit(12, 2026, 2, NOW)).toEqual({ mes: 11, ano: 2026 })
    expect(clampCompetenciaToLimit(1, 2027, 2, NOW)).toEqual({ mes: 11, ano: 2026 })
  })
})

describe("shiftCompetencia", () => {
  it("avança e volta 1 mês", () => {
    expect(shiftCompetencia(9, 2026, 1)).toEqual({ mes: 10, ano: 2026 })
    expect(shiftCompetencia(9, 2026, -1)).toEqual({ mes: 8, ano: 2026 })
  })

  it("cruza o ano", () => {
    expect(shiftCompetencia(12, 2026, 1)).toEqual({ mes: 1, ano: 2027 })
    expect(shiftCompetencia(1, 2026, -1)).toEqual({ mes: 12, ano: 2025 })
  })
})
