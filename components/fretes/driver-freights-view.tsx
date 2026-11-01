"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { toast } from "sonner"
import {
  ArrowRight,
  ChevronRight,
  Clock,
  Package,
  Truck,
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
import { useAuth } from "@/components/providers/auth-provider"
import { advanceFreightStatus, listFreights } from "@/lib/api/services/freight"
import { listDrivers } from "@/lib/api/services/drivers"
import { formatFreightRouteShort } from "@/lib/freight/route-label"
import { formatWeightKg } from "@/lib/format/numbers"
import { formatDateBR } from "@/lib/format/dates"
import { getTruckLabel } from "@/lib/freight/active-trip"
import { FREIGHT_STATUS_LABELS, nextFreightStatus } from "@/lib/freight/status"
import {
  freightStatusAccent,
  freightStatusDot,
  SEMANTIC,
  STATUS_TONE,
} from "@/lib/ui/status-colors"
import { resolveDriverIdForUser } from "@/lib/drivers/resolve-driver"
import { useCompetencia } from "@/hooks/use-competencia"
import { useOperationContext } from "@/hooks/use-operation-context"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"
import { cn } from "@/lib/utils"
import type { FreightOrder, FreightStatus } from "@/types"

const STATUS_ORDER: Array<FreightStatus | "all"> = [
  "all",
  "confirmado",
  "em_coleta",
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

/**
 * Fretes do motorista: só os atribuídos a ele, sem valores financeiros.
 */
export function DriverFreightsView() {
  const router = useRouter()
  const { user } = useAuth()
  const canStatus = usePermission(PERMISSIONS.freightStatus)
  const { trucks } = useOperationContext({ freights: false, drivers: false })
  const { competencia, shift, canGoForward } = useCompetencia()

  const { data: driversPage } = useSWR("driver-freights-drivers", () => listDrivers(1, 100), {
    revalidateOnFocus: false,
  })
  const linkedDriverId =
    user != null ? resolveDriverIdForUser(user, driversPage?.items ?? []) : null

  const [filterTruckId, setFilterTruckId] = useState<string | undefined>()
  const [statusFilter, setStatusFilter] = useState<FreightStatus | "all">("all")
  const [search, setSearch] = useState("")
  const [advancing, setAdvancing] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const competenciaKey = `${competencia.mes}-${competencia.ano}`
  const [prevCompetenciaKey, setPrevCompetenciaKey] = useState(competenciaKey)
  if (competenciaKey !== prevCompetenciaKey) {
    setPrevCompetenciaKey(competenciaKey)
    setPage(1)
  }

  const filters = {
    competencia,
    driverId: linkedDriverId ?? undefined,
    truckId: filterTruckId,
    status: statusFilter === "all" ? undefined : statusFilter,
    search: search.trim() || undefined,
  }

  const { data, isLoading, error, mutate } = useSWR(
    linkedDriverId
      ? [
          "driver-freights-list",
          linkedDriverId,
          page,
          pageSize,
          competencia.mes,
          competencia.ano,
          filterTruckId,
          statusFilter,
          search,
        ]
      : null,
    () => listFreights(page, pageSize, filters),
  )

  const items = data?.items ?? []
  const hasSearchOrStatus = statusFilter !== "all" || search.trim() !== ""
  const inProgress = items.filter(
    (f) =>
      f.status === "em_transporte" ||
      f.status === "confirmado" ||
      f.status === "em_coleta",
  ).length
  const overdueCount = items.filter(isOverdue).length

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

  if (user && driversPage && !linkedDriverId) {
    return (
      <ListPage
        header={
          <PageHeader
            title="Meus fretes"
            description="Fretes atribuídos a você"
          />
        }
      >
        <EmptyState
          title="Conta sem vínculo de motorista"
          description="Peça ao administrador para associar seu usuário ao cadastro de motorista."
        />
      </ListPage>
    )
  }

  return (
    <ListPage
      header={
        <PageHeader
          title="Meus fretes"
          description="Somente fretes atribuídos a você — sem valores financeiros"
        />
      }
      stats={
        linkedDriverId && !isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            <ListStatTile
              icon={Package}
              label="Nesta competência"
              value={data?.total ?? items.length}
              accent={STATUS_TONE.info.bg}
            />
            <ListStatTile
              icon={Truck}
              label="Em andamento"
              value={inProgress}
              accent={STATUS_TONE.progress.bg}
            />
            <ListStatTile
              icon={Clock}
              label="Com atraso"
              value={overdueCount}
              accent={overdueCount > 0 ? STATUS_TONE.danger.bg : STATUS_TONE.neutral.bg}
            />
          </div>
        ) : null
      }
      toolbar={
        <div className="space-y-3">
          <ListFilterBar
            variant="glass"
            competencia={competencia}
            onCompetenciaShift={shift}
            nextDisabled={!canGoForward}
            driverId={undefined}
            onDriverChange={() => {}}
            showDriverFilter={false}
            truckId={filterTruckId}
            onTruckChange={(id) => {
              setFilterTruckId(id)
              setPage(1)
            }}
          />
          <ListSearchField
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder="Buscar por código, cidade..."
          />
          <StatusFilterChips
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value)
              setPage(1)
            }}
            chips={STATUS_ORDER.filter((s) => s === "all" || STATUS_TAB_LABELS[s]).map((s) => ({
              value: s,
              label: STATUS_TAB_LABELS[s],
              dotClassName: s !== "all" ? freightStatusDot(s) : undefined,
            }))}
          />
        </div>
      }
    >
      {!linkedDriverId || isLoading ? (
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
      ) : items.length === 0 ? (
        <EmptyState
          title={hasSearchOrStatus ? "Nenhum resultado" : "Nenhum frete seu"}
          description={
            hasSearchOrStatus
              ? "Nenhum frete encontrado com os filtros aplicados."
              : "Quando um frete for atribuído a você nesta competência, ele aparece aqui."
          }
          actionLabel={hasSearchOrStatus ? "Limpar filtros" : undefined}
          onAction={
            hasSearchOrStatus
              ? () => {
                  setSearch("")
                  setStatusFilter("all")
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {items.map((f) => {
            const overdue = isOverdue(f)
            const nextStatus = nextFreightStatus(f.status)
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
                      {truckLabel && <span>{truckLabel}</span>}
                      {f.deadline_at && (
                        <span className={cn(overdue && cn("font-semibold", SEMANTIC.overdue))}>
                          Prazo: {formatDateBR(f.deadline_at)}
                        </span>
                      )}
                      {f.weight_kg != null && f.weight_kg > 0 && (
                        <span>{formatWeightKg(f.weight_kg)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
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

          {(data?.total ?? 0) > 0 ? (
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
