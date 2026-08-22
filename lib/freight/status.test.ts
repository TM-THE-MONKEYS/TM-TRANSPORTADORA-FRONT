import { describe, expect, it } from "vitest"
import {
  canAdminManageClosedFreight,
  isFreightClosed,
  suggestedRevertStatus,
} from "@/lib/freight/closed-freight"
import { FREIGHT_STATUS_FLOW, nextFreightStatus } from "@/lib/freight/status"
import { mapTrackingUpdateToFreightEvent } from "@/lib/api/adapters/freights"
import type { TrackingUpdate } from "@/types"

describe("freight status flow", () => {
  it("avança em_transporte → entregue", () => {
    expect(nextFreightStatus("em_transporte")).toBe("entregue")
    expect(nextFreightStatus("entregue")).toBeNull()
  })

  it("flow atual só tem em_transporte e entregue", () => {
    expect(FREIGHT_STATUS_FLOW).toEqual(["em_transporte", "entregue"])
  })
})

describe("closed freight admin rules", () => {
  it("marca entregue/cancelado como fechados", () => {
    expect(isFreightClosed("entregue")).toBe(true)
    expect(isFreightClosed("cancelado")).toBe(true)
    expect(isFreightClosed("em_transporte")).toBe(false)
  })

  it("só admin gerencia frete fechado", () => {
    expect(canAdminManageClosedFreight("admin")).toBe(true)
    expect(canAdminManageClosedFreight("operador")).toBe(false)
    expect(canAdminManageClosedFreight("motorista")).toBe(false)
  })

  it("sugere reabrir para em_transporte", () => {
    expect(suggestedRevertStatus("entregue")).toBe("em_transporte")
    expect(suggestedRevertStatus("cancelado")).toBe("em_transporte")
    expect(suggestedRevertStatus("em_transporte")).toBeNull()
  })
})

describe("mapTrackingUpdateToFreightEvent", () => {
  it("mapeia tracking entregue para status frete entregue", () => {
    const update: TrackingUpdate = {
      id: "1",
      freight_id: "f1",
      status: "entregue",
      evento_at: "2026-01-01T00:00:00Z",
      created_at: "2026-01-01T00:00:00Z",
    }
    expect(mapTrackingUpdateToFreightEvent(update).status).toBe("entregue")
  })

  it("mapeia em_transito para em_transporte", () => {
    const update: TrackingUpdate = {
      id: "2",
      freight_id: "f1",
      status: "em_transito",
      evento_at: "2026-01-01T00:00:00Z",
      created_at: "2026-01-01T00:00:00Z",
    }
    expect(mapTrackingUpdateToFreightEvent(update).status).toBe("em_transporte")
  })
})
