"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useSWR, { mutate } from "swr"
import { BadgePercent, Calendar, IdCard, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { QueryErrorState } from "@/components/shared/query-error-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { ListPage } from "@/components/shared/list-page"
import { ListSearchField } from "@/components/shared/list-search-field"
import { ListPagination } from "@/components/shared/list-pagination"
import { StatusFilterChips } from "@/components/shared/status-filter-chips"
import { ClickableListCard } from "@/components/shared/clickable-list-card"
import { listDrivers } from "@/lib/api/services/drivers"
import { deleteDriverWithAccount } from "@/lib/motoristas/delete-driver-account"
import {
  DRIVER_STATUS_LABELS,
  DRIVER_STATUS_VARIANT,
  driverInitials,
  formatCommissionPct,
} from "@/lib/motoristas/driver-status"
import { formatDateBR } from "@/lib/format/dates"
import { findActiveFreightByDriver } from "@/lib/freight/active-trip"
import { ActiveTripLink } from "@/components/shared/active-trip-link"
import { DRIVER_STATUS_TONE, statusDotClass } from "@/lib/ui/status-colors"
import { useOperationContext } from "@/hooks/use-operation-context"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"
import type { Driver, DriverStatus } from "@/types"

const STATUS_ORDER: Array<DriverStatus | "all"> = [
  "all",
  "ativo",
  "ferias",
  "suspenso",
  "inativo",
]

function DriverCard({
  driver,
  canWrite,
  onDelete,
}: {
  driver: Driver
  canWrite: boolean
  onDelete: (id: string) => void
}) {
  const router = useRouter()
  const { freights } = useOperationContext()
  const activeTrip = findActiveFreightByDriver(freights, driver.id)
  const status = driver.status as DriverStatus

  return (
    <ClickableListCard
      onActivate={() => router.push(`/dashboard/motoristas/${driver.id}`)}
      accent={
        <div
          className={`absolute left-0 top-0 h-full w-1 ${statusDotClass(DRIVER_STATUS_TONE[status])}`}
        />
      }
    >
      <CardContent className="p-0">
        <div className="flex items-stretch">
          <div className="flex w-16 shrink-0 items-center justify-center bg-primary/10 text-sm font-semibold text-primary">
            {driverInitials(driver.name)}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-base font-semibold">{driver.name}</span>
                <Badge variant={DRIVER_STATUS_VARIANT[status]}>{DRIVER_STATUS_LABELS[status]}</Badge>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <IdCard className="h-3.5 w-3.5" />
                  CNH {driver.cnh_category} · {driver.cnh_number}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Validade {formatDateBR(driver.cnh_expires_at)}
                </span>
                {driver.commission_pct != null && (
                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground/80">
                    <BadgePercent className="h-3.5 w-3.5" />
                    Comissão {formatCommissionPct(driver.commission_pct)}
                  </span>
                )}
              </div>

              <div onClick={(e) => e.stopPropagation()}>
                <ActiveTripLink freight={activeTrip} />
              </div>
            </div>

            {canWrite && (
              <div
                className="flex shrink-0 gap-1 self-start sm:self-center"
                onClick={(e) => e.stopPropagation()}
              >
                <Button variant="ghost" size="icon" asChild aria-label="Editar">
                  <Link href={`/dashboard/motoristas/${driver.id}/editar`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Excluir"
                  onClick={() => onDelete(driver.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </ClickableListCard>
  )
}

export function DriversListView() {
  const router = useRouter()
  const canWrite = usePermission(PERMISSIONS.driversWrite)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<DriverStatus | "all">("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { data, isLoading, error, mutate: revalidate } = useSWR(
    ["drivers", page, pageSize],
    () => listDrivers(page, pageSize),
  )

  const allDrivers = data?.items ?? []

  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = { all: allDrivers.length }
    for (const d of allDrivers) {
      counts[d.status] = (counts[d.status] ?? 0) + 1
    }
    return counts
  }, [allDrivers])

  const filtered = useMemo(() => {
    let items = allDrivers
    if (statusFilter !== "all") {
      items = items.filter((d) => d.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.cnh_number.toLowerCase().includes(q) ||
          (d.cpf ?? "").toLowerCase().includes(q),
      )
    }
    return items
  }, [allDrivers, statusFilter, search])

  const hasFilters = statusFilter !== "all" || search.trim() !== ""

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteDriverWithAccount(deleteId)
      toast.success("Motorista excluído")
      await mutate((key) => Array.isArray(key) && key[0] === "drivers")
      setDeleteId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <ListPage
      header={
        <PageHeader
          title="Motoristas"
          description="Gestão de CNH, comissões e contas de acesso"
          actions={
            canWrite ? (
              <Button asChild>
                <Link href="/dashboard/motoristas/novo">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo motorista
                </Link>
              </Button>
            ) : undefined
          }
        />
      }
      toolbar={
        <div className="space-y-3">
          <ListSearchField
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder="Buscar por nome, CNH ou CPF..."
            className="max-w-md"
          />
          {!isLoading && allDrivers.length > 0 ? (
            <StatusFilterChips
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
              chips={STATUS_ORDER.map((s) => ({
                value: s,
                label: s === "all" ? "Todos" : DRIVER_STATUS_LABELS[s],
                count: countByStatus[s] ?? 0,
                visible: s === "all" || (countByStatus[s] ?? 0) > 0,
                dotClassName: s !== "all" ? statusDotClass(DRIVER_STATUS_TONE[s]) : undefined,
              }))}
            />
          ) : null}
        </div>
      }
    >
      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : error ? (
        <QueryErrorState
          description={error instanceof Error ? error.message : "Falha ao carregar motoristas."}
          onRetry={() => void revalidate()}
        />
      ) : allDrivers.length === 0 ? (
        <EmptyState
          title="Sem motoristas"
          description="Cadastre motoristas da frota com CNH, comissão e acesso ao app."
          actionLabel={canWrite ? "Novo motorista" : undefined}
          onAction={canWrite ? () => router.push("/dashboard/motoristas/novo") : undefined}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nenhum resultado"
          description="Nenhum motorista encontrado com os filtros aplicados."
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
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((d) => (
              <DriverCard key={d.id} driver={d} canWrite={canWrite} onDelete={setDeleteId} />
            ))}
          </div>
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

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir motorista?"
        description="O registro será removido. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </ListPage>
  )
}
