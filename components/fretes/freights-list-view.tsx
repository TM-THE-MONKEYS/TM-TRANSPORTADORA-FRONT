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
  Package,
  Plus,
  Search,
  TrendingUp,
  Truck,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { FreightStatusBadge } from "@/components/fretes/freight-status-badge"
import { advanceFreightStatus, listFreights } from "@/lib/api/services/freight"
import { formatBRL } from "@/lib/format/currency"
import { formatWeightKg } from "@/lib/format/numbers"
import { formatDateBR } from "@/lib/format/dates"
import { getDriverName, getTruckLabel, isFreightInTransit } from "@/lib/freight/active-trip"
import { FREIGHT_STATUS_LABELS, nextFreightStatus } from "@/lib/freight/status"
import { useOperationContext } from "@/hooks/use-operation-context"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"
import { cn } from "@/lib/utils"
import type { FreightOrder, FreightStatus } from "@/types"

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_ORDER: Array<FreightStatus | "all"> = [
  "all",
  "orcamento",
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

const STATUS_DOT: Record<string, string> = {
  orcamento:     "bg-slate-400",
  confirmado:    "bg-blue-500",
  em_coleta:     "bg-amber-500",
  em_transporte: "bg-violet-500",
  entregue:      "bg-emerald-500",
  cancelado:     "bg-rose-500",
}

const STATUS_ACCENT: Record<string, string> = {
  orcamento:     "bg-slate-200 dark:bg-slate-700",
  confirmado:    "bg-blue-400",
  em_coleta:     "bg-amber-400",
  em_transporte: "bg-violet-500",
  entregue:      "bg-emerald-500",
  cancelado:     "bg-rose-500",
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isOverdue(f: FreightOrder): boolean {
  if (!f.deadline_at) return false
  if (f.status === "entregue" || f.status === "cancelado") return false
  return new Date(f.deadline_at) < new Date()
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatTile({
  icon: Icon,
  label,
  value,
  accent,
  onClick,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  accent: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-all",
        onClick ? "cursor-pointer hover:shadow-sm hover:-translate-y-0.5" : "cursor-default",
      )}
    >
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", accent)}>
        <Icon className="h-4 w-4 text-white" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-lg font-bold tabular-nums leading-tight">{value}</p>
      </div>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function FreightsListView() {
  const router = useRouter()
  const canWrite = usePermission(PERMISSIONS.freightWrite)
  const canStatus = usePermission(PERMISSIONS.freightStatus)
  const { drivers, trucks } = useOperationContext()
  const { data, isLoading, mutate } = useSWR("freights-list", () => listFreights(1, 50))

  const [statusFilter, setStatusFilter] = useState<FreightStatus | "all">("all")
  const [search, setSearch] = useState("")
  const [advancing, setAdvancing] = useState<string | null>(null)

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
          f.destination_city.toLowerCase().includes(q),
      )
    }
    return items
  }, [allFreights, statusFilter, search])

  const inTransitCount = allFreights.filter((f) => isFreightInTransit(f.status)).length
  const overdueCount = allFreights.filter(isOverdue).length
  const totalValue = allFreights.reduce((s, f) => s + f.value_brl, 0)
  const hasFilters = statusFilter !== "all" || search.trim() !== ""

  async function handleAdvance(e: React.MouseEvent, freight: FreightOrder) {
    e.stopPropagation()
    setAdvancing(freight.id)
    try {
      const updated = await advanceFreightStatus(freight.id)
      await mutate()
      const next = nextFreightStatus(freight.status)
      if (next) toast.success(`${freight.code} → ${FREIGHT_STATUS_LABELS[next]}`)
      return updated
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao avançar status")
    } finally {
      setAdvancing(null)
    }
  }

  return (
    <div className="space-y-6">
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

      {/* Stats strip */}
      {!isLoading && allFreights.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatTile
            icon={Truck}
            label="Em trânsito"
            value={inTransitCount}
            accent="bg-violet-500"
            onClick={() => setStatusFilter("em_transporte")}
          />
          <StatTile
            icon={TrendingUp}
            label="Volume total"
            value={formatBRL(totalValue)}
            accent="bg-emerald-500"
          />
          <StatTile
            icon={Clock}
            label="Com atraso"
            value={overdueCount}
            accent={overdueCount > 0 ? "bg-rose-500" : "bg-slate-400"}
          />
        </div>
      )}

      {/* Search + status chips */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9 pr-9"
            placeholder="Buscar por código, cliente, cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch("")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2">
          {STATUS_ORDER.map((s) => {
            const count = countByStatus[s] ?? 0
            if (s !== "all" && count === 0) return null
            const active = statusFilter === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s as FreightStatus | "all")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-foreground",
                )}
              >
                {s !== "all" && (
                  <span
                    className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[s] ?? "bg-muted")}
                  />
                )}
                {STATUS_TAB_LABELS[s]}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] leading-5",
                    active
                      ? "bg-white/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : allFreights.length === 0 ? (
        <EmptyState
          title="Nenhum frete"
          description="Crie a primeira ordem de frete para iniciar a operação."
          actionLabel={canWrite ? "Nova ordem" : undefined}
          onAction={canWrite ? () => router.push("/dashboard/fretes/novo") : undefined}
        />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
          <Package className="h-8 w-8 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">
            Nenhum frete encontrado com os filtros aplicados.
          </p>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("")
                setStatusFilter("all")
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((f) => {
            const overdue = isOverdue(f)
            const nextStatus = nextFreightStatus(f.status)
            const driverName = getDriverName(drivers, f.driver_id ?? undefined)
            const truckLabel = getTruckLabel(trucks, f.truck_id ?? undefined)
            const isAdvancing = advancing === f.id

            return (
              <div
                key={f.id}
                role="button"
                tabIndex={0}
                className="group cursor-pointer outline-none"
                onClick={() => router.push(`/dashboard/fretes/${f.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    router.push(`/dashboard/fretes/${f.id}`)
                  }
                }}
              >
                <Card
                  className={cn(
                    "relative overflow-hidden transition-all duration-150 group-hover:shadow-md group-hover:-translate-y-px group-focus-visible:ring-2 group-focus-visible:ring-ring",
                    overdue && "border-rose-300 dark:border-rose-800",
                  )}
                >
                  {/* Left accent bar */}
                  <div
                    className={cn(
                      "absolute left-0 top-0 h-full w-1",
                      STATUS_ACCENT[f.status] ?? "bg-slate-200",
                    )}
                  />

                  <CardContent className="flex items-center gap-4 py-4 pl-5 pr-4">
                    {/* Main info */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="font-bold tracking-tight">{f.code}</span>
                        <FreightStatusBadge status={f.status} />
                        {overdue && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Atrasado
                          </Badge>
                        )}
                      </div>

                      <p className="flex items-center gap-1 text-sm font-medium text-foreground/80">
                        <span className="truncate">{f.origin_city}/{f.origin_state}</span>
                        <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">{f.destination_city}/{f.destination_state}</span>
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {f.customer_name && (
                          <span className="font-medium text-foreground/70">{f.customer_name}</span>
                        )}
                        {driverName && <span>Mot. {driverName}</span>}
                        {truckLabel && <span>{truckLabel}</span>}
                        {f.deadline_at && (
                          <span className={cn(overdue && "font-semibold text-rose-600 dark:text-rose-400")}>
                            Prazo: {formatDateBR(f.deadline_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <p className="text-base font-bold tabular-nums leading-none">
                        {formatBRL(f.value_brl)}
                      </p>
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
                            <span className="animate-pulse">Aguarde...</span>
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
                </Card>
              </div>
            )
          })}

          {(data?.total ?? 0) > (data?.items.length ?? 0) && (
            <p className="pt-1 text-center text-xs text-muted-foreground">
              Exibindo {data?.items.length} de {data?.total} fretes
            </p>
          )}
        </div>
      )}
    </div>
  )
}
