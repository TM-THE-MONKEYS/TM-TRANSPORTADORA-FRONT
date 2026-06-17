"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { normalizeAuthUser } from "@/lib/api/adapters/auth"
import { syncServerSession } from "@/lib/auth/sync-server-session"
import { getMe, login as apiLogin, logout as apiLogout, registerTenant, type LoginInput, type RegisterTenantInput } from "@/lib/api/services/auth"
import { shouldUseMocks } from "@/lib/api/config"
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
  login: (input: LoginInput) => Promise<AuthUser>
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
      try {
        await fetch("/api/auth/session", { method: "DELETE" })
      } catch {
        /* ignore */
      }
      setIsReady(true)
      return
    }
    try {
      const me = await getMe(token)
      setUser(me)
      try {
        await syncServerSession(token)
      } catch {
        /* proxy gate; ignore on hydrate */
      }
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
    const user = normalizeAuthUser(u)
    setStoredSession(tokens.access_token, tokens.refresh_token, user.tenant_id, user.branch_id)
    setUser(user)
    return user
  }, [])

  const register = useCallback(async (input: RegisterTenantInput) => {
    const { tokens, user: u } = await registerTenant(input)
    const user = normalizeAuthUser(u)
    setStoredSession(tokens.access_token, tokens.refresh_token, user.tenant_id, user.branch_id)
    setUser(user)
  }, [])

  const logout = useCallback(async () => {
    const refresh = getStoredRefreshToken()
    if (refresh && !shouldUseMocks()) {
      try {
        await apiLogout(refresh)
      } catch {
        /* ignore */
      }
    }
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
