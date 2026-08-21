"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { getMe, login as apiLogin, logout as apiLogout, registerTenant, type LoginInput, type RegisterTenantInput } from "@/lib/api/services/auth"
import { shouldUseMocks } from "@/lib/api/config"
import { clearStoredSession, setStoredSession } from "@/lib/api/storage"
import type { AuthUser } from "@/types"

type AuthContextValue = {
  user: AuthUser | null
  isReady: boolean
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<AuthUser>
  register: (input: RegisterTenantInput) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isReady, setIsReady] = useState(false)

  const hydrate = useCallback(async () => {
    if (shouldUseMocks()) {
      setIsReady(true)
      return
    }
    try {
      const me = await getMe()
      setUser(me)
      setStoredSession("", null, me.tenant_id, me.branch_id)
    } catch {
      clearStoredSession()
      setUser(null)
    } finally {
      setIsReady(true)
    }
  }, [])

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const login = useCallback(async (input: LoginInput) => {
    const { user: u } = await apiLogin(input)
    setStoredSession("", null, u.tenant_id, u.branch_id)
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (input: RegisterTenantInput) => {
    const { user: u } = await registerTenant(input)
    setStoredSession("", null, u.tenant_id, u.branch_id)
    setUser(u)
  }, [])

  const refreshUser = useCallback(async () => {
    const me = await getMe()
    setUser(me)
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      /* ignore */
    }
    clearStoredSession()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isReady,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isReady, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
