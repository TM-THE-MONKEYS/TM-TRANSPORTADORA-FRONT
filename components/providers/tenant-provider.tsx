"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { getStoredBranchId, setStoredBranchId } from "@/lib/api/storage"
import { useAuth } from "@/components/providers/auth-provider"
import type { Branch } from "@/types"

type TenantContextValue = {
  branches: Branch[]
  branchId: string | null
  setBranchId: (id: string | null) => void
  isLoadingBranches: boolean
}

const TenantContext = createContext<TenantContextValue | null>(null)

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchId, setBranchIdState] = useState<string | null>(null)
  const [isLoadingBranches, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    setBranchIdState(getStoredBranchId())
    setLoading(true)
    // Backend does not expose a /branches endpoint; branches are part of the auth response.
    // Branches functionality is deferred until multi-tenancy is implemented.
    Promise.resolve([])
      .then((b) => {
        setBranches(b)
      })
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  const setBranchId = useCallback((id: string | null) => {
    setBranchIdState(id)
    setStoredBranchId(id)
  }, [])

  const value = useMemo(
    () => ({ branches, branchId, setBranchId, isLoadingBranches }),
    [branches, branchId, setBranchId, isLoadingBranches],
  )

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error("useTenant must be used within TenantProvider")
  return ctx
}
