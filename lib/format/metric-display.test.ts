import { describe, expect, it } from "vitest"
import { parseMetricDisplay } from "@/lib/format/metric-display"

describe("parseMetricDisplay", () => {
  it("anima inteiros", () => {
    const p = parseMetricDisplay("3")
    expect(p.kind).toBe("animate")
    if (p.kind === "animate") {
      expect(p.target).toBe(3)
      expect(p.format(3)).toBe("3")
    }
  })

  it("anima BRL", () => {
    const p = parseMetricDisplay("R$ 284.500,00")
    expect(p.kind).toBe("animate")
    if (p.kind === "animate") {
      expect(p.target).toBe(284500)
      expect(p.format(284500)).toMatch(/284\.500,00/)
    }
  })

  it("preserva sufixo de margem", () => {
    const p = parseMetricDisplay("R$ 86.300,00 (30,3%)")
    expect(p.kind).toBe("animate")
    if (p.kind === "animate") {
      expect(p.target).toBe(86300)
      expect(p.format(86300)).toContain("(30,3%)")
    }
  })

  it("texto livre fica estático", () => {
    expect(parseMetricDisplay("—")).toEqual({ kind: "static" })
  })
})
