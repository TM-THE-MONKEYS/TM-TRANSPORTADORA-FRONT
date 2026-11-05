import { describe, expect, it } from "vitest"
import { statusChangeSourceLabel, statusChangeTitle } from "@/lib/freight/status-history"

describe("status history labels", () => {
  it("mostra a criação sem status anterior", () => {
    expect(statusChangeTitle({ from_status: null, to_status: "em_transporte" })).toBe(
      "Status inicial: Em Transporte",
    )
  })

  it("liga o status anterior ao novo", () => {
    expect(
      statusChangeTitle({ from_status: "em_transporte", to_status: "entregue" }),
    ).toBe("Em Transporte para Entregue")
  })

  it("nomeia a origem da mudança", () => {
    expect(statusChangeSourceLabel("tracking")).toBe("Rastreamento")
    expect(statusChangeSourceLabel("system")).toBe("Automático")
  })
})
