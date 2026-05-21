import type {
  Driver,
  FreightEvent,
  FreightOccurrence,
  FreightOrder,
  Truck,
  TruckImplement,
} from "@/types"
import {
  DEMO_CUSTOMERS,
  DEMO_KPIS,
  DEMO_USERS,
  mockDrivers as seedDrivers,
  mockFreightEvents as seedEvents,
  mockFreights as seedFreights,
  mockImplements as seedImplements,
  mockOccurrences as seedOccurrences,
  mockTrucks as seedTrucks,
} from "@/lib/mocks/seed"

export const mockStore = {
  trucks: [...seedTrucks] as Truck[],
  implements: [...seedImplements] as TruckImplement[],
  drivers: [...seedDrivers] as Driver[],
  freights: [...seedFreights] as FreightOrder[],
  freightEvents: [...seedEvents] as FreightEvent[],
  occurrences: [...seedOccurrences] as FreightOccurrence[],
  customers: [...DEMO_CUSTOMERS],
  kpis: { ...DEMO_KPIS },
  users: DEMO_USERS,
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`
}
