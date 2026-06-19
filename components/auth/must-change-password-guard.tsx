"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"

/** Redireciona motoristas com senha provisória para troca obrigatória. */
export function MustChangePasswordGuard({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isReady || !user?.must_change_password) return
    if (pathname !== "/dashboard/conta/alterar-senha") {
      router.replace("/dashboard/conta/alterar-senha")
    }
  }, [isReady, user, pathname, router])

  if (user?.must_change_password && pathname !== "/dashboard/conta/alterar-senha") {
    return null
  }

  return <>{children}</>
}
