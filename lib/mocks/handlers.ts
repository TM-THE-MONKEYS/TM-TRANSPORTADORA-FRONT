import { permissionsForRole } from "@/lib/rbac/permissions"
import { DEMO_BRANCHES, DEMO_TENANT } from "@/lib/mocks/seed"
import { generateId, mockStore } from "@/lib/mocks/store"
import { nextFreightStatus } from "@/lib/freight/status"
import type {
  AuthTokens,
  AuthUser,
  DashboardFilters,
  DashboardKpis,
  Driver,
  FreightEvent,
  FreightOccurrence,
  FreightOrder,
  FreightStatus,
  Paginated,
  Truck,
  TruckImplement,
} from "@/types"

function paginate<T>(items: T[], page = 1, pageSize = 20): Paginated<T> {
  const start = (page - 1) * pageSize
  const slice = items.slice(start, start + pageSize)
  return {
    items: slice,
    total: items.length,
    page,
    page_size: pageSize,
    pages: Math.max(1, Math.ceil(items.length / pageSize)),
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function mockLogin(email: string, password: string): Promise<{
  tokens: AuthTokens
  user: AuthUser
}> {
  await delay(300)
  const record = mockStore.users[email.toLowerCase()]
  if (!record || record.password !== password) {
    throw new Error("Credenciais inválidas")
  }
  const { password: _, ...user } = record
  user.permissions = permissionsForRole(user.role)
  return {
    tokens: {
      access_token: `mock-access-${user.id}`,
      refresh_token: `mock-refresh-${user.id}`,
      token_type: "bearer",
    },
    user,
  }
}

export async function mockMe(accessToken: string): Promise<AuthUser> {
  await delay(100)
  const id = accessToken.replace("mock-access-", "")
  const user = Object.values(mockStore.users).find((u) => u.id === id)
  if (!user) throw new Error("Sessão inválida")
  const { password: _, ...rest } = user
  rest.permissions = permissionsForRole(rest.role)
  return rest
}

export async function mockBranches() {
  await delay(100)
  return DEMO_BRANCHES
}

export async function mockDashboardKpis(_filters?: DashboardFilters): Promise<DashboardKpis> {
  await delay(200)
  return mockStore.kpis
}

export async function mockListTrucks(page = 1, pageSize = 20): Promise<Paginated<Truck>> {
  await delay(200)
  return paginate(mockStore.trucks, page, pageSize)
}

export async function mockGetTruck(id: string): Promise<Truck | null> {
  await delay(100)
  return mockStore.trucks.find((t) => t.id === id) ?? null
}

export async function mockCreateTruck(data: Omit<Truck, "id" | "created_at" | "tenant_id">): Promise<Truck> {
  await delay(200)
  const truck: Truck = {
    ...data,
    id: generateId("truck"),
    tenant_id: DEMO_TENANT.id,
    created_at: new Date().toISOString(),
  }
  mockStore.trucks = [truck, ...mockStore.trucks]
  return truck
}

export async function mockUpdateTruck(id: string, data: Partial<Truck>): Promise<Truck> {
  await delay(200)
  const idx = mockStore.trucks.findIndex((t) => t.id === id)
  if (idx < 0) throw new Error("Caminhão não encontrado")
  mockStore.trucks[idx] = { ...mockStore.trucks[idx], ...data }
  return mockStore.trucks[idx]
}

export async function mockListImplements(truckId: string): Promise<TruckImplement[]> {
  await delay(100)
  return mockStore.implements.filter((i) => i.truck_id === truckId)
}

export async function mockListDrivers(page = 1, pageSize = 20): Promise<Paginated<Driver>> {
  await delay(200)
  return paginate(mockStore.drivers, page, pageSize)
}

export async function mockGetDriver(id: string): Promise<Driver | null> {
  await delay(100)
  return mockStore.drivers.find((d) => d.id === id) ?? null
}

export async function mockCreateDriver(
  data: Omit<Driver, "id" | "created_at" | "tenant_id">,
): Promise<Driver> {
  await delay(200)
  const driver: Driver = {
    ...data,
    id: generateId("drv"),
    tenant_id: DEMO_TENANT.id,
    created_at: new Date().toISOString(),
  }
  mockStore.drivers = [driver, ...mockStore.drivers]
  return driver
}

export async function mockUpdateDriver(id: string, data: Partial<Driver>): Promise<Driver> {
  await delay(200)
  const idx = mockStore.drivers.findIndex((d) => d.id === id)
  if (idx < 0) throw new Error("Motorista não encontrado")
  mockStore.drivers[idx] = { ...mockStore.drivers[idx], ...data }
  return mockStore.drivers[idx]
}

export async function mockListFreights(page = 1, pageSize = 20): Promise<Paginated<FreightOrder>> {
  await delay(200)
  return paginate(mockStore.freights, page, pageSize)
}

export async function mockGetFreight(id: string): Promise<FreightOrder | null> {
  await delay(100)
  return mockStore.freights.find((f) => f.id === id) ?? null
}

export async function mockCreateFreight(
  data: Omit<FreightOrder, "id" | "code" | "created_at" | "updated_at" | "tenant_id" | "status"> & {
    status?: FreightStatus
  },
): Promise<FreightOrder> {
  await delay(200)
  const n = mockStore.freights.length + 1
  const freight: FreightOrder = {
    ...data,
    id: generateId("frt"),
    tenant_id: DEMO_TENANT.id,
    code: `OF-2026-${String(n).padStart(4, "0")}`,
    status: data.status ?? "orcamento",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  mockStore.freights = [freight, ...mockStore.freights]
  mockStore.freightEvents.push({
    id: generateId("evt"),
    freight_id: freight.id,
    status: freight.status,
    title: "Ordem criada",
    created_at: new Date().toISOString(),
  })
  return freight
}

export async function mockUpdateFreight(id: string, data: Partial<FreightOrder>): Promise<FreightOrder> {
  await delay(200)
  const idx = mockStore.freights.findIndex((f) => f.id === id)
  if (idx < 0) throw new Error("Frete não encontrado")
  mockStore.freights[idx] = { ...mockStore.freights[idx], ...data, updated_at: new Date().toISOString() }
  return mockStore.freights[idx]
}

export async function mockAdvanceFreightStatus(id: string): Promise<FreightOrder> {
  const freight = mockStore.freights.find((f) => f.id === id)
  if (!freight) throw new Error("Frete não encontrado")
  const next = nextFreightStatus(freight.status)
  if (!next) throw new Error("Status final já atingido")
  return mockUpdateFreightStatus(id, next)
}

export async function mockUpdateFreightStatus(id: string, status: FreightStatus): Promise<FreightOrder> {
  const updated = await mockUpdateFreight(id, { status })
  mockStore.freightEvents.push({
    id: generateId("evt"),
    freight_id: id,
    status,
    title: `Status: ${status}`,
    created_at: new Date().toISOString(),
  })
  return updated
}

export async function mockListFreightEvents(freightId: string): Promise<FreightEvent[]> {
  await delay(100)
  return mockStore.freightEvents.filter((e) => e.freight_id === freightId)
}

export async function mockFreightOccurrences(freightId: string): Promise<FreightOccurrence[]> {
  await delay(100)
  return mockStore.occurrences.filter((o) => o.freight_id === freightId)
}

export async function mockAddOccurrence(
  freightId: string,
  type: string,
  description: string,
): Promise<FreightOccurrence> {
  await delay(200)
  const occ: FreightOccurrence = {
    id: generateId("occ"),
    freight_id: freightId,
    type,
    description,
    created_at: new Date().toISOString(),
  }
  mockStore.occurrences.push(occ)
  return occ
}

export async function mockCustomers() {
  await delay(100)
  return mockStore.customers
}

export async function mockRegisterTenant(input: {
  tenant_name: string
  email: string
  password: string
  admin_name: string
}): Promise<{ tokens: AuthTokens; user: AuthUser }> {
  await delay(400)
  void input
  return mockLogin("admin@demo.tm", "demo1234")
}
