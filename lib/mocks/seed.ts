import type {
  AuthUser,
  Branch,
  Customer,
  DashboardKpis,
  Driver,
  FreightEvent,
  FreightOccurrence,
  FreightOrder,
  Tenant,
  Truck,
  TruckImplement,
} from "@/types"

export const DEMO_TENANT: Tenant = {
  id: "tenant-demo-001",
  slug: "demo-transportadora",
  name: "Transportadora Demo TM",
  document: "12.345.678/0001-90",
}

export const DEMO_BRANCHES: Branch[] = [
  {
    id: "branch-sp",
    tenant_id: DEMO_TENANT.id,
    name: "Matriz São Paulo",
    city: "São Paulo",
    state: "SP",
  },
  {
    id: "branch-rj",
    tenant_id: DEMO_TENANT.id,
    name: "Filial Rio",
    city: "Rio de Janeiro",
    state: "RJ",
  },
]

export const DEMO_USERS: Record<string, AuthUser & { password: string }> = {
  "admin@tmtransportadora.com.br": {
    id: "user-admin-seed",
    email: "admin@tmtransportadora.com.br",
    name: "Admin TM",
    role: "admin",
    tenant_id: DEMO_TENANT.id,
    branch_id: null,
    permissions: [],
    password: "Admin@123!",
  },
  "admin@demo.tm": {
    id: "user-admin",
    email: "admin@demo.tm",
    name: "Admin Demo",
    role: "admin",
    tenant_id: DEMO_TENANT.id,
    branch_id: "branch-sp",
    permissions: [],
    password: "demo1234",
  },
  "operacional@demo.tm": {
    id: "user-op",
    email: "operacional@demo.tm",
    name: "Operacional Demo",
    role: "operacional",
    tenant_id: DEMO_TENANT.id,
    branch_id: "branch-sp",
    permissions: [],
    password: "demo1234",
  },
  "financeiro@demo.tm": {
    id: "user-fin",
    email: "financeiro@demo.tm",
    name: "Financeiro Demo",
    role: "financeiro",
    tenant_id: DEMO_TENANT.id,
    branch_id: "branch-sp",
    permissions: [],
    password: "demo1234",
  },
}

export const DEMO_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    tenant_id: DEMO_TENANT.id,
    name: "Agro Norte Ltda",
    document: "11.111.111/0001-11",
    email: "contato@agronorte.com",
  },
  {
    id: "cust-2",
    tenant_id: DEMO_TENANT.id,
    name: "Indústria Sul S.A.",
    document: "22.222.222/0001-22",
  },
]

export const mockTrucks: Truck[] = [
  {
    id: "truck-1",
    tenant_id: DEMO_TENANT.id,
    branch_id: "branch-sp",
    plate: "ABC1D23",
    renavam: "12345678901",
    brand: "Volvo",
    model: "FH 540",
    year: 2022,
    type: "cavalo",
    capacity_kg: 45000,
    avg_consumption_km_l: 2.1,
    status: "em_viagem",
    mileage_km: 185000,
    insurance_expires_at: "2026-12-01",
    license_expires_at: "2026-08-15",
    created_at: "2025-01-10T10:00:00Z",
  },
  {
    id: "truck-2",
    tenant_id: DEMO_TENANT.id,
    branch_id: "branch-rj",
    plate: "XYZ9K87",
    brand: "Scania",
    model: "R 450",
    year: 2020,
    type: "cavalo",
    capacity_kg: 42000,
    status: "em_manutencao",
    mileage_km: 240000,
    created_at: "2024-06-01T10:00:00Z",
  },
]

export const mockImplements: TruckImplement[] = [
  { id: "imp-1", truck_id: "truck-1", type: "carreta", identifier: "CAR-001", capacity_kg: 30000 },
]

export const mockDrivers: Driver[] = [
  {
    id: "drv-1",
    tenant_id: DEMO_TENANT.id,
    name: "João Silva",
    cpf: "123.456.789-00",
    cnh_number: "12345678900",
    cnh_category: "E",
    cnh_expires_at: "2027-05-20",
    status: "ativo",
    phone: "(11) 99999-0001",
    commission_pct: 8,
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "drv-2",
    tenant_id: DEMO_TENANT.id,
    name: "Maria Santos",
    cpf: "98765432100",
    cnh_number: "98765432100",
    cnh_category: "E",
    cnh_expires_at: "2026-02-10",
    status: "ativo",
    created_at: "2023-08-01T10:00:00Z",
  },
]

export const mockFreights: FreightOrder[] = [
  {
    id: "frt-1",
    tenant_id: DEMO_TENANT.id,
    branch_id: "branch-sp",
    code: "OF-2026-0001",
    customer_id: "cust-1",
    customer_name: "Agro Norte Ltda",
    origin_city: "Ribeirão Preto",
    origin_state: "SP",
    destination_city: "Santos",
    destination_state: "SP",
    cargo_description: "Soja em grãos",
    weight_kg: 28000,
    value_brl: 18500,
    freight_type: "carga_geral",
    status: "em_transporte",
    deadline_at: "2026-05-25",
    truck_id: "truck-1",
    driver_id: "drv-2",
    created_at: "2026-05-10T08:00:00Z",
    updated_at: "2026-05-18T14:00:00Z",
  },
  {
    id: "frt-2",
    tenant_id: DEMO_TENANT.id,
    branch_id: "branch-sp",
    code: "OF-2026-0002",
    customer_id: "cust-2",
    customer_name: "Indústria Sul S.A.",
    origin_city: "Curitiba",
    origin_state: "PR",
    destination_city: "Porto Alegre",
    destination_state: "RS",
    cargo_description: "Equipamentos industriais",
    weight_kg: 12000,
    value_brl: 9200,
    freight_type: "carga_geral",
    status: "orcamento",
    created_at: "2026-05-19T10:00:00Z",
    updated_at: "2026-05-19T10:00:00Z",
  },
]

export const mockFreightEvents: FreightEvent[] = [
  {
    id: "evt-1",
    freight_id: "frt-1",
    status: "orcamento",
    title: "Ordem criada",
    created_at: "2026-05-10T08:00:00Z",
  },
  {
    id: "evt-2",
    freight_id: "frt-1",
    status: "em_transporte",
    title: "Em transporte",
    description: "Saída do pátio SP",
    created_at: "2026-05-12T06:00:00Z",
  },
]

export const mockOccurrences: FreightOccurrence[] = [
  {
    id: "occ-1",
    freight_id: "frt-1",
    type: "atraso",
    description: "Trânsito na Rod. Anhanguera — 45 min",
    created_at: "2026-05-13T10:30:00Z",
  },
]

export const DEMO_KPIS: DashboardKpis = {
  freights_in_progress: 3,
  active_trucks: 1,
  available_drivers: 1,
  monthly_revenue_brl: 284500,
  operational_costs_brl: 198200,
  maintenance_alerts: 2,
  financial_pending: 5,
}
