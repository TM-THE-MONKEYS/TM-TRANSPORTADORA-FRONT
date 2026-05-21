const ACCESS = "tmt_access_token"
const REFRESH = "tmt_refresh_token"
const TENANT = "tmt_tenant_id"
const BRANCH = "tmt_branch_id"

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined"
}

export function getStoredAccessToken(): string | null {
  if (!canUseStorage()) return null
  return sessionStorage.getItem(ACCESS)
}

export function getStoredRefreshToken(): string | null {
  if (!canUseStorage()) return null
  return sessionStorage.getItem(REFRESH)
}

export function getStoredTenantId(): string | null {
  if (!canUseStorage()) return null
  return sessionStorage.getItem(TENANT)
}

export function getStoredBranchId(): string | null {
  if (!canUseStorage()) return null
  return sessionStorage.getItem(BRANCH)
}

export function setStoredSession(
  access: string,
  refresh: string | null,
  tenantId: string,
  branchId?: string | null,
): void {
  if (!canUseStorage()) return
  sessionStorage.setItem(ACCESS, access)
  if (refresh) sessionStorage.setItem(REFRESH, refresh)
  else sessionStorage.removeItem(REFRESH)
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
  sessionStorage.removeItem(ACCESS)
  sessionStorage.removeItem(REFRESH)
  sessionStorage.removeItem(TENANT)
  sessionStorage.removeItem(BRANCH)
}
