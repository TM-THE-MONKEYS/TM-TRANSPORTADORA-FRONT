import { getDriverName } from "@/lib/freight/active-trip"
import type { Driver } from "@/types"

export type DriverReference = {
  driver_id?: string | null
  driver_name?: string | null
  /** Campo em português retornado pela API. */
  driver_nome?: string | null
}

/**
 * Nome do motorista para listagens históricas (abastecimento, pedágio).
 * Com driver_id → cadastro ativo; sem id → snapshot driver_nome/driver_name.
 */
export function resolveDriverDisplayName(
  ref: DriverReference,
  drivers?: Driver[],
): string {
  if (ref.driver_id) {
    const active = drivers ? getDriverName(drivers, ref.driver_id) : undefined
    if (active) return active
  }

  const snapshot = ref.driver_name?.trim() || ref.driver_nome?.trim()
  if (snapshot) return snapshot

  if (ref.driver_id) return "Motorista removido"
  return "—"
}

export function isRemovedDriverSnapshot(ref: DriverReference): boolean {
  return !ref.driver_id && Boolean(ref.driver_name?.trim() || ref.driver_nome?.trim())
}
