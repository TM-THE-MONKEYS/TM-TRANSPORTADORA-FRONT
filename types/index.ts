// ── Enums — aligned with backend StrEnum values ─────────────────────────────

export type UserRole = "admin" | "operacional" | "operador" | "financeiro" | "motorista" | "cliente"

/** Aligned with backend FreightStatus enum */
export type FreightStatus =
  | "orcamento"
  | "confirmado"
  | "em_coleta"
  | "em_transporte"
  | "entregue"
  | "cancelado"

/** Aligned with backend TruckStatus enum */
export type TruckStatus = "disponivel" | "em_viagem" | "em_manutencao" | "inativo"

/** Aligned with backend DriverStatus enum */
export type DriverStatus = "ativo" | "inativo" | "suspenso" | "ferias"

// ── Auth ─────────────────────────────────────────────────────────────────────

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
  /** Quando o login é de motorista vinculado ao cadastro de drivers. */
  driver_id?: string | null
  permissions: string[]
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in?: number
}

/** Resposta de POST/PATCH /users (backend). */
export interface UserRead {
  id: string
  nome: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

// ── Pagination ───────────────────────────────────────────────────────────────

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  size?: number
  page_size: number
  pages: number
  has_next?: boolean
  has_prev?: boolean
}

// ── Clients / Customers ──────────────────────────────────────────────────────

export interface Customer {
  id: string
  tenant_id: string
  nome?: string          // backend field
  name?: string          // alias used in mocks
  document?: string
  cpf_cnpj?: string      // backend field
  email?: string
  phone?: string
  telefone?: string      // backend field
}

// ── Trucks ───────────────────────────────────────────────────────────────────

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

// ── Drivers ──────────────────────────────────────────────────────────────────

export interface Driver {
  id: string
  tenant_id: string
  name: string
  cpf: string
  cnh_number: string
  cnh_category: string
  cnh_expires_at: string
  status: DriverStatus
  phone?: string
  email?: string | null
  user_id?: string | null
  photo_url?: string | null
  commission_pct?: number
  created_at: string
  /** Returned once on creation when password is auto-generated. Never stored. */
  temporary_password?: string | null
}

// ── Freights ─────────────────────────────────────────────────────────────────

export interface FreightOrder {
  id: string
  tenant_id: string
  branch_id?: string
  code: string
  customer_id: string
  customer_name?: string
  origin_city: string
  origin_state: string
  origin_street?: string | null
  origin_neighborhood?: string | null
  origin_cep?: string | null
  destination_city: string
  destination_state: string
  destination_street?: string | null
  destination_neighborhood?: string | null
  destination_cep?: string | null
  cargo_description: string
  weight_kg?: number | null
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

export interface FreightCost {
  id: string
  freight_id: string
  tipo: string
  valor: number
  litros?: number | null
  descricao: string | null
  created_at: string
}

// ── Finance ──────────────────────────────────────────────────────────────────

export type FinanceEntryType = "receita" | "despesa"
export type FinanceEntryStatus = "pendente" | "pago" | "cancelado" | "vencido"

export interface FinanceEntry {
  id: string
  tipo: FinanceEntryType
  categoria: string
  descricao?: string
  valor: number
  status: FinanceEntryStatus
  data_vencimento?: string
  freight_id?: string
  created_at: string
  updated_at: string
}

export interface CashFlowSummary {
  total_receitas: number
  total_despesas: number
  saldo: number
  receitas_pendentes: number
  despesas_pendentes: number
  receitas_pagas: number
  despesas_pagas: number
}

// ── Fixed Expenses ────────────────────────────────────────────────────────────

export type FixedExpenseFrequency = "mensal" | "trimestral" | "semestral" | "anual"

export interface FixedExpense {
  id: string
  nome: string
  categoria: string
  valor: number
  frequencia: FixedExpenseFrequency
  dia_vencimento?: number
  ativo: boolean
  observacao?: string
  created_at: string
  updated_at: string
}

// ── Maintenance ───────────────────────────────────────────────────────────────

export type MaintenanceType = "preventiva" | "corretiva"
export type MaintenanceStatus = "agendada" | "em_andamento" | "concluida" | "cancelada"

export interface Maintenance {
  id: string
  truck_id: string
  tipo: MaintenanceType
  status: MaintenanceStatus
  descricao?: string
  custo?: number
  oficina?: string
  data_agendada?: string
  data_inicio?: string
  data_conclusao?: string
  km_na_manutencao?: number
  proxima_manutencao_km?: number
  proxima_manutencao_data?: string
  created_at: string
  updated_at: string
}

// ── Tracking ──────────────────────────────────────────────────────────────────

export type TrackingStatus =
  | "coletado"
  | "em_transito"
  | "saiu_para_entrega"
  | "tentativa_entrega"
  | "entregue"
  | "devolvido"

export interface TrackingUpdate {
  id: string
  freight_id: string
  status: TrackingStatus
  latitude?: number
  longitude?: number
  observacao?: string
  evento_at: string
  created_at: string
}

export interface TrackingTimeline {
  freight_id: string
  updates: TrackingUpdate[]
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

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
  truck_id?: string
}
