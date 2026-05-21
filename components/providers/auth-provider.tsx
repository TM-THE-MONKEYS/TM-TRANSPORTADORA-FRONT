"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { getMe, login as apiLogin, registerTenant, type LoginInput, type RegisterTenantInput } from "@/lib/api/services/auth"
import {
  clearStoredSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  setStoredSession,
} from "@/lib/api/storage"
import type { AuthUser } from "@/types"

type AuthContextValue = {
  user: AuthUser | null
  isReady: boolean
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterTenantInput) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isReady, setIsReady] = useState(false)

  const hydrate = useCallback(async () => {
    const token = getStoredAccessToken()
    if (!token) {
      setIsReady(true)
      return
    }
    try {
      const me = await getMe(token)
      setUser(me)
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
    const { tokens, user: u } = await apiLogin(input)
    setStoredSession(tokens.access_token, tokens.refresh_token, u.tenant_id, u.branch_id)
    setUser(u)
  }, [])

  const register = useCallback(async (input: RegisterTenantInput) => {
    const { tokens, user: u } = await registerTenant(input)
    setStoredSession(tokens.access_token, tokens.refresh_token, u.tenant_id, u.branch_id)
    setUser(u)
  }, [])

  const logout = useCallback(async () => {
    clearStoredSession()
    try {
      await fetch("/api/auth/session", { method: "DELETE" })
    } catch {
      /* ignore */
    }
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
    }),
    [user, isReady, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
