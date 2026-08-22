const TENANT = "tmt_tenant_id"
const BRANCH = "tmt_branch_id"

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined"
}

/** @deprecated Tokens ficam só em cookies httpOnly — sempre null. */
export function getStoredAccessToken(): string | null {
  return null
}

/** @deprecated Tokens ficam só em cookies httpOnly — sempre null. */
export function getStoredRefreshToken(): string | null {
  return null
}

export function getStoredTenantId(): string | null {
  if (!canUseStorage()) return null
  return sessionStorage.getItem(TENANT)
}

export function getStoredBranchId(): string | null {
  if (!canUseStorage()) return null
  return sessionStorage.getItem(BRANCH)
}

/** Persiste só tenant/branch (não-sensiveis). Tokens vão para cookies httpOnly. */
export function setStoredSession(
  _access: string,
  _refresh: string | null,
  tenantId: string,
  branchId?: string | null,
): void {
  if (!canUseStorage()) return
  sessionStorage.setItem(TENANT, tenantId)
  if (branchId) sessionStorage.setItem(BRANCH, branchId)
  else sessionStorage.removeItem(BRANCH)
}

export function setStoredBranchId(branchId: string | null): void {
  if (!canUseStorage()) return
  if (branchId) sessionStorage.setItem(BRANCH, branchId)
  else sessionStorage.removeItem(BRANCH)
}

export function clearStoredSession(): void {
  if (!canUseStorage()) return
  sessionStorage.removeItem(TENANT)
  sessionStorage.removeItem(BRANCH)
  // Limpa leftovers de versões antigas (tokens em sessionStorage).
  sessionStorage.removeItem("tmt_access_token")
  sessionStorage.removeItem("tmt_refresh_token")
}
