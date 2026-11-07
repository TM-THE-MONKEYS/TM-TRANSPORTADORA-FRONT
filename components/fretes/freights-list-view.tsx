"use client"

import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  getFreightsCostsSummary,
  getFreightsSummary,
  listCustomers,
  listFreights,
} from "@/lib/api/services/freight"
import { formatFreightRouteShort } from "@/lib/freight/route-label"
import { formatBRL } from "@/lib/format/currency"
import { formatWeightKg } from "@/lib/format/numbers"
import { formatDateBR } from "@/lib/format/dates"
import { getDriverName, getTruckLabel } from "@/lib/freight/active-trip"
import { FREIGHT_STATUS_LABELS, nextFreightStatus } from "@/lib/freight/status"
import {
  freightStatusAccent,
  freightStatusDot,
  SEMANTIC,
  STATUS_TONE,
} from "@/lib/ui/status-colors"
import { useCompetencia } from "@/hooks/use-competencia"
import { useOperationContext } from "@/hooks/use-operation-context"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"
import { cn } from "@/lib/utils"
import type { FreightOrder, FreightStatus, Paginated } from "@/types"

function FreightCostSummary({
  valueBrl,
  totalCosts,
}: {
  valueBrl: number | null | undefined
  totalCosts: number | undefined
}) {
  if (valueBrl == null || totalCosts == null || totalCosts <= 0) return null

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

function patchFreightInPage(
  page: Paginated<FreightOrder> | undefined,
  freightId: string,
  patch: Partial<FreightOrder>,
): Paginated<FreightOrder> | undefined {
  if (!page) return undefined
  return {
    ...page,
    items: page.items.map((f) => (f.id === freightId ? { ...f, ...patch } : f)),
  }
}

function requirePatchedPage(
  page: Paginated<FreightOrder> | undefined,
  freightId: string,
  patch: Partial<FreightOrder>,
): Paginated<FreightOrder> {
  return patchFreightInPage(page, freightId, patch) ?? {
    items: [],
    total: 0,
    page: 1,
    page_size: 20,
    pages: 0,
  }
}

export function FreightsListView() {
  const router = useRouter()
  const canWrite = usePermission(PERMISSIONS.freightWrite)
  const canStatus = usePermission(PERMISSIONS.freightStatus)
  const { drivers, trucks } = useOperationContext({ freights: false })
  const { competencia, shift, canGoForward } = useCompetencia()

  const [filterDriverId, setFilterDriverId] = useState<string | undefined>()
  const [filterTruckId, setFilterTruckId] = useState<string | undefined>()
  const [filterClientId, setFilterClientId] = useState<string | undefined>()

  const [statusFilter, setStatusFilter] = useState<FreightStatus | "all">("all")
  const [search, setSearch] = useState("")
  const [advancing, setAdvancing] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Reset page when competência changes (React: adjust state during render).
  const competenciaKey = `${competencia.mes}-${competencia.ano}`
  const [prevCompetenciaKey, setPrevCompetenciaKey] = useState(competenciaKey)
  if (competenciaKey !== prevCompetenciaKey) {
    setPrevCompetenciaKey(competenciaKey)
    setPage(1)
  }

  const searchKey = search.trim()
  const filters = {
    competencia,
    driverId: filterDriverId,
    truckId: filterTruckId,
    clientId: filterClientId,
    status: statusFilter === "all" ? undefined : statusFilter,
    search: searchKey || undefined,
  }

  const listKey = [
    "freights-list",
    page,
    pageSize,
    competencia.mes,
    competencia.ano,
    filterDriverId ?? "",
    filterTruckId ?? "",
    filterClientId ?? "",
    statusFilter,
    searchKey,
  ] as const

  const summaryKey = [
    "freights-summary",
    competencia.mes,
    competencia.ano,
    filterDriverId ?? "",
    filterTruckId ?? "",
    filterClientId ?? "",
    statusFilter,
    searchKey,
  ] as const

  const { data, isLoading, error, mutate } = useSWR(
    listKey,
    () => listFreights(page, pageSize, filters),
    { keepPreviousData: true },
  )

  const { data: summary, isLoading: loadingSummary, error: summaryError } = useSWR(
    summaryKey,
    () => getFreightsSummary(filters),
    { keepPreviousData: true },
  )

  const { data: customers } = useSWR("customers", listCustomers, {
    revalidateOnFocus: false,
  })

  const items = data?.items ?? []
  // Chave estável por ids da página; só dispara após a lista ter dados (batch único).
  const costsKey =
    data && data.items.length > 0 && !isLoading
      ? (["freights-costs-summary", data.items.map((f) => f.id).join(",")] as const)
      : null

  const { data: costsByFreightId } = useSWR(
    costsKey,
    () => getFreightsCostsSummary(data!.items.map((f) => f.id)),
    { revalidateOnFocus: false },
  )
  const overdueCount = summaryError ? null : (summary?.com_atraso ?? 0)
  const hasSearchOrStatus =
    statusFilter !== "all" || searchKey !== "" || Boolean(filterClientId)

  async function handleAdvance(e: React.MouseEvent, freight: FreightOrder) {
    e.stopPropagation()
    const next = nextFreightStatus(freight.status)
    if (!next) return
    setAdvancing(freight.id)
    try {
      await mutate(
        async (current) => {
          const updated = await advanceFreightStatus(freight.id)
          return requirePatchedPage(current, freight.id, updated)
        },
        {
          optimisticData: (current) =>
            requirePatchedPage(current, freight.id, { status: next }),
          rollbackOnError: true,
          revalidate: true,
        },
      )
      toast.success(`${freight.code} → ${FREIGHT_STATUS_LABELS[next]}`)
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
              value={
                loadingSummary ? "..." : summaryError ? "—" : formatBRL(summary?.faturamento_bruto ?? 0)
              }
              accent={STATUS_TONE.success.bg}
            />
            <ListStatTile
              icon={TrendingDown}
              label="Gastos"
              value={loadingSummary ? "..." : summaryError ? "—" : formatBRL(summary?.gastos ?? 0)}
              accent={STATUS_TONE.danger.bg}
            />
            <ListStatTile
              icon={Clock}
              label="Com atraso"
              value={loadingSummary ? "..." : overdueCount ?? "—"}
              accent={overdueCount && overdueCount > 0 ? STATUS_TONE.danger.bg : STATUS_TONE.neutral.bg}
            />
          </div>
        ) : null
      }
      toolbar={
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <ListFilterBar
              variant="glass"
              competencia={competencia}
              onCompetenciaShift={shift}
              nextDisabled={!canGoForward}
              driverId={filterDriverId}
              onDriverChange={(id) => { setFilterDriverId(id); setPage(1) }}
              truckId={filterTruckId}
              onTruckChange={(id) => { setFilterTruckId(id); setPage(1) }}
              showClear={false}
            />
            <Select
              value={filterClientId ?? "all"}
              onValueChange={(v) => {
                setFilterClientId(v === "all" ? undefined : v)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-[180px] border-foreground/15 bg-background/60 text-xs">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos clientes</SelectItem>
                {(customers ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filterDriverId || filterTruckId || filterClientId) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                onClick={() => {
                  setFilterDriverId(undefined)
                  setFilterTruckId(undefined)
                  setFilterClientId(undefined)
                  setPage(1)
                }}
              >
                Limpar
              </Button>
            )}
          </div>
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
              dotClassName: s !== "all" ? freightStatusDot(s) : undefined,
            }))}
          />
        </div>
      }
    >
      {isLoading && !data ? (
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
          title={hasSearchOrStatus ? "Nenhum resultado" : "Nenhum frete"}
          description={
            hasSearchOrStatus
              ? "Nenhum frete encontrado com os filtros aplicados."
              : "Nenhum frete nesta competência."
          }
          actionLabel={
            hasSearchOrStatus
              ? "Limpar filtros"
              : canWrite
                ? "Nova ordem"
                : undefined
          }
          onAction={
            hasSearchOrStatus
              ? () => {
                  setSearch("")
                  setStatusFilter("all")
                  setFilterClientId(undefined)
                }
              : canWrite
                ? () => router.push("/dashboard/fretes/novo")
                : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {items.map((f) => {
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
                      <FreightCostSummary
                        valueBrl={f.value_brl}
                        totalCosts={costsByFreightId?.[f.id]}
                      />
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
