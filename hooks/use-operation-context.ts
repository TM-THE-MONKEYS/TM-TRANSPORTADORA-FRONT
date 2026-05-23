"use client"

import useSWR from "swr"
import { listDrivers } from "@/lib/api/services/drivers"
import { listFreights } from "@/lib/api/services/freight"
import { listTrucks } from "@/lib/api/services/fleet"

/** Fretes, motoristas e caminhões para vínculos e viagem em trânsito. */
export function useOperationContext() {
  const { data: freightsPage, isLoading: loadingFreights } = useSWR("op-freights", () =>
    listFreights(1, 100),
  )
  const { data: driversPage, isLoading: loadingDrivers } = useSWR("op-drivers", () =>
    listDrivers(1, 100),
  )
  const { data: trucksPage, isLoading: loadingTrucks } = useSWR("op-trucks", () =>
    listTrucks(1, 100),
  )

  return {
    freights: freightsPage?.items ?? [],
    drivers: driversPage?.items ?? [],
    trucks: trucksPage?.items ?? [],
    isLoading: loadingFreights || loadingDrivers || loadingTrucks,
  }
}
