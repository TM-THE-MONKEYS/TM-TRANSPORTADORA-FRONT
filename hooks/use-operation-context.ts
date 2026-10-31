"use client"

import useSWR from "swr"
import { listDrivers } from "@/lib/api/services/drivers"
import { listFreights } from "@/lib/api/services/freight"
import { listTrucks } from "@/lib/api/services/fleet"

const OP_PAGE_SIZE = 50
const OP_SWR_OPTS = { revalidateOnFocus: false as const }

export type OperationContextOptions = {
  /** Fretes para vínculos / filtro de caminhão por motorista. Default true. */
  freights?: boolean
  /** Motoristas para dropdowns. Default true. */
  drivers?: boolean
  /** Caminhões para dropdowns. Default true. */
  trucks?: boolean
}

/**
 * Fretes, motoristas e caminhões para vínculos e viagem em trânsito.
 *
 * Preferir params seletivos: quem só precisa de labels em dropdown
 * (`drivers`/`trucks`) não deve puxar a lista de fretes.
 *
 * `ListFilterBar` precisa de fretes só para restringir caminhões ao motorista
 * selecionado — não use payloads de frete completos em páginas que só filtram
 * por competência/motorista/caminhão sem essa regra de convergência.
 *
 * Quando o backend expuser `GET /drivers/catalog` e `GET /trucks/catalog`,
 * trocar `listDrivers`/`listTrucks` por essas rotas leves; fretes seguem
 * `listFreights(1, 50)`.
 */
export function useOperationContext(options: OperationContextOptions = {}) {
  const wantFreights = options.freights !== false
  const wantDrivers = options.drivers !== false
  const wantTrucks = options.trucks !== false

  const { data: freightsPage, isLoading: loadingFreights } = useSWR(
    wantFreights ? "op-freights" : null,
    () => listFreights(1, OP_PAGE_SIZE),
    OP_SWR_OPTS,
  )
  const { data: driversPage, isLoading: loadingDrivers } = useSWR(
    wantDrivers ? "op-drivers" : null,
    () => listDrivers(1, OP_PAGE_SIZE),
    OP_SWR_OPTS,
  )
  const { data: trucksPage, isLoading: loadingTrucks } = useSWR(
    wantTrucks ? "op-trucks" : null,
    () => listTrucks(1, OP_PAGE_SIZE),
    OP_SWR_OPTS,
  )

  return {
    freights: freightsPage?.items ?? [],
    drivers: driversPage?.items ?? [],
    trucks: trucksPage?.items ?? [],
    isLoading:
      (wantFreights && loadingFreights) ||
      (wantDrivers && loadingDrivers) ||
      (wantTrucks && loadingTrucks),
  }
}
