"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { FreightsListView } from "@/components/fretes/freights-list-view"
import { DriverFreightsView } from "@/components/fretes/driver-freights-view"
import { isMotoristaRole } from "@/lib/fuel/eligibility"

/** Lista de fretes: visão operacional ou visão exclusiva do motorista. */
export function FretesPageClient() {
  const { user } = useAuth()
  if (isMotoristaRole(user)) return <DriverFreightsView />
  return <FreightsListView />
}
