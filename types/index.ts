export type UserRole = "admin" | "operacional" | "financeiro" | "motorista" | "cliente"

export type FreightStatus =
  | "cotacao"
  | "aprovacao"
  | "embarque"
  | "em_transito"
  | "entregue"
  | "finalizado"
  | "cancelado"

export type TruckStatus = "ativo" | "manutencao" | "inativo" | "viagem"

export type DriverStatus = "disponivel" | "em_viagem" | "folga" | "inativo"

export interface Tenant {
  id: string
  slug: string
  name: string
  document?: string
}

export interface Branch {
  id: string
  tenant_id: string
  name: string
  city: string
  state: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  tenant_id: string
  branch_id?: string | null
  permissions: string[]
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface Customer {
  id: string
  tenant_id: string
  name: string
  document?: string
  email?: string
  phone?: string
}

export interface Truck {
  id: string
  tenant_id: string
  branch_id?: string
  plate: string
  renavam?: string
  brand: string
  model: string
  year: number
  type: string
  capacity_kg?: number
  avg_consumption_km_l?: number
  status: TruckStatus
  mileage_km: number
  insurance_expires_at?: string | null
  license_expires_at?: string | null
  created_at: string
}

export interface TruckImplement {
  id: string
  truck_id: string
  type: "carreta" | "bau" | "tanque" | "prancha"
  identifier: string
  capacity_kg?: number
}

export interface Driver {
  id: string
  tenant_id: string
  name: string
  cpf?: string
  cnh_number: string
  cnh_category: string
  cnh_expires_at: string
  status: DriverStatus
  phone?: string
  photo_url?: string | null
  commission_pct?: number
  created_at: string
}

export interface FreightOrder {
  id: string
  tenant_id: string
  branch_id?: string
  code: string
  customer_id: string
  customer_name?: string
  origin_city: string
  origin_state: string
  destination_city: string
  destination_state: string
  cargo_description: string
  weight_kg: number
  value_brl: number
  freight_type: string
  status: FreightStatus
  deadline_at?: string | null
  responsible_id?: string | null
  truck_id?: string | null
  driver_id?: string | null
  created_at: string
  updated_at: string
}

export interface FreightEvent {
  id: string
  freight_id: string
  status: FreightStatus
  title: string
  description?: string
  created_at: string
  created_by?: string
}

export interface FreightOccurrence {
  id: string
  freight_id: string
  type: string
  description: string
  created_at: string
}

export interface DashboardKpis {
  freights_in_progress: number
  active_trucks: number
  available_drivers: number
  monthly_revenue_brl: number
  operational_costs_brl: number
  maintenance_alerts: number
  financial_pending: number
}

export interface DashboardFilters {
  period_from?: string
  period_to?: string
  branch_id?: string
  customer_id?: string
}
