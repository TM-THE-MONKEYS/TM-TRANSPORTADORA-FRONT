"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { hasPermission, type Permission } from "@/lib/rbac/permissions"

export function usePermission(permission: Permission): boolean {
  const { user } = useAuth()
  if (!user) return false
  return hasPermission(user.permissions, user.role, permission)
}
