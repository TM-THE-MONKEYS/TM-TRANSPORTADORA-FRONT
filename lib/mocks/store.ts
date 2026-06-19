import type {
  Driver,
  FreightCost,
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
  mockFreightCostsSeed as seedFreightCosts,
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
  freightCosts: [...seedFreightCosts] as FreightCost[],
  fuelRefills: [] as import("@/lib/api/services/fuel").FuelRefill[],
  customers: [...DEMO_CUSTOMERS],
  kpis: { ...DEMO_KPIS },
  users: DEMO_USERS,
  passwordResetTokens: {} as Record<string, { email: string; expiresAt: number }>,
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`
}
