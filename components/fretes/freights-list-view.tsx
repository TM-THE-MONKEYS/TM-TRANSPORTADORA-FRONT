"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"
import { toast } from "sonner"
import {
  ArrowRight,
  ChevronRight,
  Clock,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { QueryErrorState } from "@/components/shared/query-error-state"
import { ListPage } from "@/components/shared/list-page"
import { ListSearchField } from "@/components/shared/list-search-field"
import { ListStatTile } from "@/components/shared/list-stat-tile"
import { ListFilterBar } from "@/components/shared/list-filter-bar"
import { ListPagination } from "@/components/shared/list-pagination"
import { StatusFilterChips } from "@/components/shared/status-filter-chips"
import { ClickableListCard } from "@/components/shared/clickable-list-card"
import { FreightStatusBadge } from "@/components/fretes/freight-status-badge"
import {
  advanceFreightStatus,
  getFreightCosts,
  getFreightsSummary,
  listFreights,
} from "@/lib/api/services/freight"
import { formatFreightRouteShort } from "@/lib/freight/route-label"
import { formatBRL } from "@/lib/format/currency"
import { formatWeightKg } from "@/lib/format/numbers"
import { formatDateBR, shiftCompetencia } from "@/lib/format/dates"
import { getDriverName, getTruckLabel, isFreightInTransit } from "@/lib/freight/active-trip"
import { FREIGHT_STATUS_LABELS, nextFreightStatus } from "@/lib/freight/status"
import {
  freightStatusAccent,
  freightStatusDot,
  SEMANTIC,
  STATUS_TONE,
} from "@/lib/ui/status-colors"
import { useOperationContext } from "@/hooks/use-operation-context"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"
import { cn } from "@/lib/utils"
import type { FreightOrder, FreightStatus } from "@/types"

function FreightCostSummary({ freightId, valueBrl }: { freightId: string; valueBrl: number }) {
  const { data: costs } = useSWR(
    ["freight-breakdown-costs", freightId],
    () => getFreightCosts(freightId),
    { revalidateOnFocus: false },
  )
  if (!costs?.length) return null

  const totalCosts = costs.reduce((s, c) => s + c.valor, 0)
  const margin = valueBrl - totalCosts

  return (
    <div className="mt-1 space-y-0.5 text-right text-xs">
      <p className="text-muted-foreground">
        Despesas:{" "}
        <span className="font-medium text-destructive">{formatBRL(totalCosts)}</span>
      </p>
      <p className={cn("font-semibold", margin >= 0 ? SEMANTIC.positive : SEMANTIC.negative)}>
        Margem: {formatBRL(margin)}
      </p>
    </div>
  )
}

const STATUS_ORDER: Array<FreightStatus | "all"> = [
  "all",
  "em_transporte",
  "entregue",
  "cancelado",
]

const STATUS_TAB_LABELS: Record<string, string> = {
  all: "Todos",
  ...FREIGHT_STATUS_LABELS,
}

function isOverdue(f: FreightOrder): boolean {
  if (!f.deadline_at) return false
  if (f.status === "entregue" || f.status === "cancelado") return false
  return new Date(f.deadline_at) < new Date()
}

export function FreightsListView() {
  const router = useRouter()
  const canWrite = usePermission(PERMISSIONS.freightWrite)
  const canStatus = usePermission(PERMISSIONS.freightStatus)
  const { drivers, trucks } = useOperationContext()

  // Competência e filtros de entidade
  const now = new Date()
  const [competencia, setCompetencia] = useState({
    mes: now.getMonth() + 1,
    ano: now.getFullYear(),
  })
  const [filterDriverId, setFilterDriverId] = useState<string | undefined>()
  const [filterTruckId, setFilterTruckId] = useState<string | undefined>()

  const [statusFilter, setStatusFilter] = useState<FreightStatus | "all">("all")
  const [search, setSearch] = useState("")
  const [advancing, setAdvancing] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  function handleCompetenciaShift(delta: number) {
    setCompetencia((c) => shiftCompetencia(c, delta))
    setPage(1)
  }

  const filters = {
    competencia,
    driverId: filterDriverId,
    truckId: filterTruckId,
  }

  const { data, isLoading, error, mutate } = useSWR(
    ["freights-list", page, pageSize, competencia.mes, competencia.ano, filterDriverId, filterTruckId],
    () => listFreights(page, pageSize, filters),
  )

  const { data: summary, isLoading: loadingSummary } = useSWR(
    ["freights-summary", competencia.mes, competencia.ano, filterDriverId, filterTruckId],
    () => getFreightsSummary(filters),
    { keepPreviousData: true },
  )

  const allFreights = data?.items ?? []

  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = { all: allFreights.length }
    for (const f of allFreights) {
      counts[f.status] = (counts[f.status] ?? 0) + 1
    }
    return counts
  }, [allFreights])

  const filtered = useMemo(() => {
    let items = allFreights
    if (statusFilter !== "all") items = items.filter((f) => f.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (f) =>
          f.code.toLowerCase().includes(q) ||
          (f.customer_name ?? "").toLowerCase().includes(q) ||
          f.origin_city.toLowerCase().includes(q) ||
          f.destination_city.toLowerCase().includes(q) ||
          (f.stops ?? []).some((s) => s.city.toLowerCase().includes(q)),
      )
    }
    return items
  }, [allFreights, statusFilter, search])

  const overdueCount = summary?.com_atraso ?? allFreights.filter(isOverdue).length
  const hasFilters = statusFilter !== "all" || search.trim() !== ""

  async function handleAdvance(e: React.MouseEvent, freight: FreightOrder) {
    e.stopPropagation()
    setAdvancing(freight.id)
    try {
      await advanceFreightStatus(freight.id)
      await mutate()
      const next = nextFreightStatus(freight.status)
      if (next) toast.success(`${freight.code} → ${FREIGHT_STATUS_LABELS[next]}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao avançar status")
    } finally {
      setAdvancing(null)
    }
  }

  return (
    <ListPage
      header={
        <PageHeader
          title="Gestão de fretes"
          description="Ordens de frete e fluxo operacional"
          actions={
            canWrite && (
              <Button asChild>
                <Link href="/dashboard/fretes/novo">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova ordem
                </Link>
              </Button>
            )
          }
        />
      }
      stats={
        !isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            <ListStatTile
              icon={TrendingUp}
              label="Faturamento bruto"
              value={loadingSummary ? "..." : formatBRL(summary?.faturamento_bruto ?? 0)}
              accent={STATUS_TONE.success.bg}
            />
            <ListStatTile
              icon={TrendingDown}
              label="Gastos"
              value={loadingSummary ? "..." : formatBRL(summary?.gastos ?? 0)}
              accent={STATUS_TONE.danger.bg}
            />
            <ListStatTile
              icon={Clock}
              label="Com atraso"
              value={loadingSummary ? "..." : overdueCount}
              accent={overdueCount > 0 ? STATUS_TONE.danger.bg : STATUS_TONE.neutral.bg}
            />
          </div>
        ) : null
      }
      toolbar={
        <div className="space-y-3">
          <ListFilterBar
            competencia={competencia}
            onCompetenciaShift={handleCompetenciaShift}
            driverId={filterDriverId}
            onDriverChange={(id) => { setFilterDriverId(id); setPage(1) }}
            truckId={filterTruckId}
            onTruckChange={(id) => { setFilterTruckId(id); setPage(1) }}
          />
          <ListSearchField
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder="Buscar por código, cliente, cidade..."
          />
          <StatusFilterChips
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value)
              setPage(1)
            }}
            chips={STATUS_ORDER.map((s) => ({
              value: s,
              label: STATUS_TAB_LABELS[s],
              count: countByStatus[s] ?? 0,
              visible: s === "all" || (countByStatus[s] ?? 0) > 0,
              dotClassName: s !== "all" ? freightStatusDot(s) : undefined,
            }))}
          />
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <QueryErrorState
          description={error instanceof Error ? error.message : "Falha ao carregar fretes."}
          onRetry={() => void mutate()}
        />
      ) : allFreights.length === 0 ? (
        <EmptyState
          title="Nenhum frete"
          description="Crie a primeira ordem de frete para iniciar a operação."
          actionLabel={canWrite ? "Nova ordem" : undefined}
          onAction={canWrite ? () => router.push("/dashboard/fretes/novo") : undefined}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nenhum resultado"
          description="Nenhum frete encontrado com os filtros aplicados."
          actionLabel={hasFilters ? "Limpar filtros" : undefined}
          onAction={
            hasFilters
              ? () => {
                  setSearch("")
                  setStatusFilter("all")
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((f) => {
            const overdue = isOverdue(f)
            const nextStatus = nextFreightStatus(f.status)
            const driverName = getDriverName(drivers, f.driver_id ?? undefined)
            const truckLabel = getTruckLabel(trucks, f.truck_id ?? undefined)
            const isAdvancing = advancing === f.id

            return (
              <ClickableListCard
                key={f.id}
                onActivate={() => router.push(`/dashboard/fretes/${f.id}`)}
                className={cn(overdue && SEMANTIC.overdueBorder)}
                accent={
                  <div
                    className={cn(
                      "absolute left-0 top-0 h-full w-1",
                      freightStatusAccent(f.status),
                    )}
                  />
                }
              >
                <CardContent className="flex items-center gap-4 py-4 pl-5 pr-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-bold tracking-tight">{f.code}</span>
                      <FreightStatusBadge status={f.status} />
                      {overdue && (
                        <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                          Atrasado
                        </Badge>
                      )}
                    </div>

                    <p className="flex items-center gap-1 text-sm font-medium text-foreground/80">
                      <span className="truncate">{formatFreightRouteShort(f)}</span>
                      {(f.stops?.length ?? 0) > 0 && (
                        <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px]">
                          {f.stops!.length + 1} entregas
                        </Badge>
                      )}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {f.customer_name && (
                        <span className="font-medium text-foreground/70">{f.customer_name}</span>
                      )}
                      {driverName && <span>Mot. {driverName}</span>}
                      {truckLabel && <span>{truckLabel}</span>}
                      {f.deadline_at && (
                        <span className={cn(overdue && cn("font-semibold", SEMANTIC.overdue))}>
                          Prazo: {formatDateBR(f.deadline_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Valor
                      </p>
                      <p className="text-base font-bold leading-none tabular-nums">
                        {formatBRL(f.value_brl)}
                      </p>
                      <FreightCostSummary freightId={f.id} valueBrl={f.value_brl} />
                    </div>
                    {f.weight_kg != null && f.weight_kg > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {formatWeightKg(f.weight_kg)}
                      </p>
                    )}
                    {canStatus && nextStatus && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 px-2 text-[11px] font-medium"
                        disabled={isAdvancing}
                        onClick={(e) => handleAdvance(e, f)}
                      >
                        {isAdvancing ? (
                          <span className="text-muted-foreground">Aguarde...</span>
                        ) : (
                          <>
                            <ArrowRight className="h-3 w-3" />
                            {FREIGHT_STATUS_LABELS[nextStatus]}
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                </CardContent>
              </ClickableListCard>
            )
          })}

          {(data?.total ?? 0) > 0 && !hasFilters ? (
            <ListPagination
              page={page}
              pageSize={pageSize}
              total={data?.total ?? 0}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(1)
              }}
            />
          ) : null}
        </div>
      )}
    </ListPage>
  )
}
