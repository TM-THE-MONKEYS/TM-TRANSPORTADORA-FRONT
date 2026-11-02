"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"
import { Skeleton } from "@/components/ui/skeleton"

/** Bloqueia /fretes/novo sem `freight:write` (ex.: motorista). */
export function FreightNovoGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const canWrite = usePermission(PERMISSIONS.freightWrite)

  useEffect(() => {
    if (!canWrite) router.replace("/dashboard/fretes")
  }, [canWrite, router])

  if (!canWrite) return <Skeleton className="h-48 w-full" />
  return <>{children}</>
}
