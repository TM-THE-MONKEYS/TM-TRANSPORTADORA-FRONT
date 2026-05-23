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

export async function mockListTrucks(
  page = 1,
  pageSize = 20,
  search?: string,
): Promise<Paginated<Truck>> {
  await delay(200)
  let items = mockStore.trucks
  if (search?.trim()) {
    const q = search.trim().toLowerCase()
    items = items.filter(
      (t) =>
        t.plate.toLowerCase().includes(q) ||
        t.model.toLowerCase().includes(q) ||
        t.brand.toLowerCase().includes(q),
    )
  }
  return paginate(items, page, pageSize)
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

export async function mockDeleteTruck(id: string): Promise<void> {
  await delay(200)
  mockStore.trucks = mockStore.trucks.filter((t) => t.id !== id)
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

export async function mockDeleteDriver(id: string): Promise<void> {
  await delay(200)
  mockStore.drivers = mockStore.drivers.filter((d) => d.id !== id)
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
  const { formatOccurrenceObservation } = await import("@/lib/freight/occurrences")
  const occ: FreightOccurrence = {
    id: generateId("occ"),
    freight_id: freightId,
    type,
    description,
    created_at: new Date().toISOString(),
  }
  mockStore.occurrences.push(occ)
  const { mockTrackingUpdates } = await import("@/lib/api/services/tracking")
  mockTrackingUpdates.push({
    id: occ.id,
    freight_id: freightId,
    status: "em_transito",
    observacao: formatOccurrenceObservation(type, description),
    evento_at: occ.created_at,
    created_at: occ.created_at,
  })
  return occ
}

export async function mockCustomers() {
  await delay(100)
  return mockStore.customers
}

export async function mockListClients(search?: string) {
  await delay(100)
  let items = mockStore.customers
  if (search?.trim()) {
    const q = search.trim().toLowerCase()
    items = items.filter((c) => (c.name ?? "").toLowerCase().includes(q))
  }
  return items
}

export async function mockCreateClient(data: {
  nome: string
  cpf_cnpj?: string
  email?: string
  telefone?: string
}) {
  await delay(200)
  const { generateProvisionalCnpj } = await import("@/lib/format/numbers")
  const doc = data.cpf_cnpj ?? generateProvisionalCnpj(data.nome)
  const customer = {
    id: generateId("cli"),
    tenant_id: DEMO_TENANT.id,
    name: data.nome,
    nome: data.nome,
    document: doc,
    cpf_cnpj: doc,
    email: data.email,
    phone: data.telefone,
    telefone: data.telefone,
  }
  mockStore.customers = [customer, ...mockStore.customers]
  return customer
}

export async function mockListFreightCosts(tipo = "combustivel") {
  await delay(100)
  return mockStore.freightCosts.filter((c) => c.tipo === tipo)
}

export async function mockRegisterFuelRefill(data: {
  freight_id: string
  driver_id?: string
  litros: number
  valor_total: number
  posto?: string
  cidade?: string
  estado?: string
  observacoes?: string
}) {
  await delay(200)
  const freight = mockStore.freights.find((f) => f.id === data.freight_id)
  const driverId = data.driver_id ?? freight?.driver_id ?? mockStore.drivers[0]?.id
  if (!driverId) throw new Error("Frete sem motorista vinculado")

  const costId = generateId("cost")
  const refill = {
    id: generateId("fuel"),
    freight_id: data.freight_id,
    driver_id: driverId,
    truck_id: freight?.truck_id ?? null,
    litros: data.litros,
    valor_total: data.valor_total,
    valor_litro: data.valor_total / data.litros,
    km_atual: null,
    posto: data.posto ?? null,
    cidade: data.cidade ?? null,
    estado: data.estado ?? null,
    freight_cost_id: costId,
    created_at: new Date().toISOString(),
  }
  mockStore.fuelRefills = [refill, ...(mockStore.fuelRefills ?? [])]
  mockStore.freightCosts = [
    {
      id: costId,
      freight_id: data.freight_id,
      tipo: "combustivel",
      valor: data.valor_total,
      litros: data.litros,
      descricao: data.posto ?? "Abastecimento",
      created_at: refill.created_at,
    },
    ...mockStore.freightCosts,
  ]
  return refill
}

export async function mockListFuelRefills(page = 1, size = 100, freightId?: string) {
  await delay(100)
  let items = mockStore.fuelRefills ?? []
  if (freightId) items = items.filter((r) => r.freight_id === freightId)
  const start = (page - 1) * size
  const slice = items.slice(start, start + size)
  return {
    items: slice,
    total: items.length,
    page,
    page_size: size,
    pages: Math.max(1, Math.ceil(items.length / size)),
  }
}

export async function mockAddFreightCost(
  freightId: string,
  data: { tipo: string; valor: number; litros?: number; descricao?: string },
) {
  await delay(200)
  const cost = {
    id: generateId("cost"),
    freight_id: freightId,
    tipo: data.tipo,
    valor: data.valor,
    litros: data.litros ?? null,
    descricao: data.descricao ?? null,
    created_at: new Date().toISOString(),
  }
  mockStore.freightCosts = [cost, ...mockStore.freightCosts]
  return cost
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
