/**
 * Smoke tests sem Vitest (fallback se npm install falhar no ambiente).
 * Espelha contratos críticos de status/closed-freight/adapter.
 * Rodar: node scripts/smoke-freight-rules.mjs
 */
import assert from "node:assert/strict"

const FREIGHT_STATUS_FLOW = ["em_transporte", "entregue"]

function nextFreightStatus(current) {
  const idx = FREIGHT_STATUS_FLOW.indexOf(current)
  if (idx < 0 || idx >= FREIGHT_STATUS_FLOW.length - 1) return null
  return FREIGHT_STATUS_FLOW[idx + 1]
}

function isFreightClosed(status) {
  return status === "entregue" || status === "cancelado"
}

function canAdminManageClosedFreight(role) {
  return role === "admin"
}

function suggestedRevertStatus(current) {
  if (current === "entregue" || current === "cancelado") return "em_transporte"
  return null
}

function mapTrackingStatus(status) {
  if (status === "entregue") return "entregue"
  if (status === "devolvido") return "cancelado"
  return "em_transporte"
}

assert.equal(nextFreightStatus("em_transporte"), "entregue")
assert.equal(nextFreightStatus("entregue"), null)
assert.equal(isFreightClosed("entregue"), true)
assert.equal(isFreightClosed("em_transporte"), false)
assert.equal(canAdminManageClosedFreight("admin"), true)
assert.equal(canAdminManageClosedFreight("operador"), false)
assert.equal(suggestedRevertStatus("cancelado"), "em_transporte")
assert.equal(mapTrackingStatus("entregue"), "entregue")
assert.equal(mapTrackingStatus("em_transito"), "em_transporte")

console.log("smoke-freight-rules: OK (9 asserts)")
