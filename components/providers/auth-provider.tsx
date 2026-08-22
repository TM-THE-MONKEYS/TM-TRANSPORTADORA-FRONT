"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { getMe, login as apiLogin, logout as apiLogout, type LoginInput } from "@/lib/api/services/auth"
import { clearStoredSession, setStoredSession } from "@/lib/api/storage"
import type { AuthUser } from "@/types"

type AuthContextValue = {
  user: AuthUser | null
  isReady: boolean
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<AuthUser>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isReady, setIsReady] = useState(false)

  const hydrate = useCallback(async () => {
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
    void hydrate()
  }, [hydrate])

  const login = useCallback(async (input: LoginInput) => {
    const { user: u } = await apiLogin(input)
    setStoredSession("", null, u.tenant_id, u.branch_id)
    setUser(u)
    return u
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
      logout,
      refreshUser,
    }),
    [user, isReady, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
