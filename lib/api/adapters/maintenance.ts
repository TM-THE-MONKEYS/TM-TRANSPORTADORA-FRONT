import type { Maintenance, MaintenanceStatus, MaintenanceType, Paginated } from "@/types"

/** Shape parcial da API (MaintenanceRead / MaintenanceCreate). */
export type BackendMaintenance = {
  id: string
  truck_id: string
  tipo: MaintenanceType
  status: MaintenanceStatus
  descricao?: string | null
  custo?: number | null
  fornecedor?: string | null
  oficina?: string | null
  data_prevista?: string | null
  data_agendada?: string | null
  data_inicio?: string | null
  data_conclusao?: string | null
  km_atual?: number | null
  km_na_manutencao?: number | null
  km_proxima?: number | null
  proxima_manutencao_km?: number | null
  proxima_manutencao_data?: string | null
  created_at: string
  updated_at: string
}

export function mapMaintenanceFromApi(raw: Record<string, unknown>): Maintenance {
  const dataPrevista =
    (raw.data_prevista as string | null) ??
    (raw.data_agendada as string | null) ??
    undefined

  return {
    id: String(raw.id),
    truck_id: String(raw.truck_id),
    tipo: raw.tipo as MaintenanceType,
    status: raw.status as MaintenanceStatus,
    descricao: (raw.descricao as string | null) ?? undefined,
    custo: raw.custo != null ? Number(raw.custo) : undefined,
    oficina:
      (raw.fornecedor as string | null) ??
      (raw.oficina as string | null) ??
      undefined,
    data_agendada: dataPrevista ? dataPrevista.slice(0, 10) : undefined,
    data_inicio: (raw.data_inicio as string | null) ?? undefined,
    data_conclusao: (raw.data_conclusao as string | null) ?? undefined,
    km_na_manutencao:
      raw.km_atual != null
        ? Number(raw.km_atual)
        : raw.km_na_manutencao != null
          ? Number(raw.km_na_manutencao)
          : undefined,
    proxima_manutencao_km:
      raw.km_proxima != null
        ? Number(raw.km_proxima)
        : raw.proxima_manutencao_km != null
          ? Number(raw.proxima_manutencao_km)
          : undefined,
    proxima_manutencao_data: (raw.proxima_manutencao_data as string | null) ?? undefined,
    created_at: String(raw.created_at ?? new Date().toISOString()),
    updated_at: String(raw.updated_at ?? new Date().toISOString()),
  }
}

export function mapMaintenancePageFromApi(
  data: Paginated<Record<string, unknown>> | Record<string, unknown>[],
): Maintenance[] {
  const items = Array.isArray(data) ? data : (data.items ?? [])
  return items.map((item) => mapMaintenanceFromApi(item as Record<string, unknown>))
}

export function toMaintenanceCreatePayload(
  data: Omit<Maintenance, "id" | "created_at" | "updated_at">,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    truck_id: data.truck_id,
    tipo: data.tipo,
    status: data.status ?? "agendada",
  }
  if (data.descricao) body.descricao = data.descricao
  if (data.custo != null && data.custo > 0) body.custo = data.custo
  if (data.oficina) body.fornecedor = data.oficina
  if (data.km_na_manutencao != null) body.km_atual = data.km_na_manutencao
  if (data.proxima_manutencao_km != null) body.km_proxima = data.proxima_manutencao_km
  if (data.data_agendada) {
    body.data_prevista = data.data_agendada.includes("T")
      ? data.data_agendada
      : `${data.data_agendada}T09:00:00Z`
  }
  return body
}

export function toMaintenanceUpdatePayload(data: Partial<Maintenance>): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (data.tipo !== undefined) body.tipo = data.tipo
  if (data.status !== undefined) body.status = data.status
  if (data.descricao !== undefined) body.descricao = data.descricao || null
  if (data.custo !== undefined) body.custo = data.custo
  if (data.oficina !== undefined) body.fornecedor = data.oficina || null
  if (data.km_na_manutencao !== undefined) body.km_atual = data.km_na_manutencao
  if (data.proxima_manutencao_km !== undefined) body.km_proxima = data.proxima_manutencao_km
  if (data.data_agendada !== undefined) {
    body.data_prevista = data.data_agendada
      ? data.data_agendada.includes("T")
        ? data.data_agendada
        : `${data.data_agendada}T09:00:00Z`
      : null
  }
  if (data.data_inicio !== undefined) body.data_inicio = data.data_inicio
  if (data.data_conclusao !== undefined) body.data_conclusao = data.data_conclusao
  return body
}
