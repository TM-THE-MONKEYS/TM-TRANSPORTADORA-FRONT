"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useSWR, { mutate } from "swr"
import { Pencil, Plus, Trash2 } from "lucide-react"
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
import { listTrucks, deleteTruck } from "@/lib/api/services/fleet"
import { formatDateBR } from "@/lib/format/dates"
import { findActiveFreightByTruck } from "@/lib/freight/active-trip"
import { getEffectiveTruckStatus, TRUCK_STATUS_LABELS } from "@/lib/fleet/truck-availability"
import { ActiveTripLink } from "@/components/shared/active-trip-link"
import { statusDotClass, TRUCK_STATUS_TONE } from "@/lib/ui/status-colors"
import { useOperationContext } from "@/hooks/use-operation-context"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"
import type { TruckStatus } from "@/types"

const STATUS_ORDER: Array<TruckStatus | "all"> = [
  "all",
  "disponivel",
  "em_viagem",
  "em_manutencao",
  "inativo",
]

export function FleetListView() {
  const router = useRouter()
  const canWrite = usePermission(PERMISSIONS.fleetWrite)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<TruckStatus | "all">("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { freights } = useOperationContext()
  const queryKey = useMemo(
    () => ["trucks", search, page, pageSize] as const,
    [search, page, pageSize],
  )
  const { data, isLoading, error, mutate: revalidate } = useSWR(queryKey, () =>
    listTrucks(page, pageSize, search || undefined),
  )

  const items = data?.items ?? []

  const withStatus = useMemo(
    () =>
      items.map((t) => ({
        truck: t,
        effectiveStatus: getEffectiveTruckStatus(t, freights),
      })),
    [items, freights],
  )

  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = { all: withStatus.length }
    for (const row of withStatus) {
      counts[row.effectiveStatus] = (counts[row.effectiveStatus] ?? 0) + 1
    }
    return counts
  }, [withStatus])

  const filtered = useMemo(() => {
    if (statusFilter === "all") return withStatus
    return withStatus.filter((row) => row.effectiveStatus === statusFilter)
  }, [withStatus, statusFilter])

  const hasFilters = statusFilter !== "all" || search.trim() !== ""

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteTruck(deleteId)
      toast.success("Caminhão excluído")
      await mutate((key) => Array.isArray(key) && key[0] === "trucks")
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
          title="Gestão de frota"
          description="Caminhões, documentação e disponibilidade"
          actions={
            canWrite && (
              <Button asChild>
                <Link href="/dashboard/frota/novo">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo caminhão
                </Link>
              </Button>
            )
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
            placeholder="Buscar por placa ou modelo..."
            className="max-w-md"
          />
          {!isLoading && items.length > 0 ? (
            <StatusFilterChips
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
              chips={STATUS_ORDER.map((s) => ({
                value: s,
                label: s === "all" ? "Todos" : TRUCK_STATUS_LABELS[s],
                count: countByStatus[s] ?? 0,
                visible: s === "all" || (countByStatus[s] ?? 0) > 0,
                dotClassName: s !== "all" ? statusDotClass(TRUCK_STATUS_TONE[s]) : undefined,
              }))}
            />
          ) : null}
        </div>
      }
    >
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      ) : error ? (
        <QueryErrorState
          description={error instanceof Error ? error.message : "Falha ao carregar a frota."}
          onRetry={() => void revalidate()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title={search ? "Nenhum resultado" : "Frota vazia"}
          description={
            search ? "Tente outra placa ou modelo." : "Cadastre o primeiro caminhão."
          }
          actionLabel={
            search
              ? "Limpar busca"
              : canWrite
                ? "Novo caminhão"
                : undefined
          }
          onAction={
            search
              ? () => setSearch("")
              : canWrite
                ? () => router.push("/dashboard/frota/novo")
                : undefined
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nenhum resultado"
          description="Nenhum caminhão encontrado com os filtros aplicados."
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
          <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(({ truck: t, effectiveStatus }) => (
            <ClickableListCard
              key={t.id}
              onActivate={() => router.push(`/dashboard/frota/${t.id}`)}
              accent={
                <div
                  className={`absolute left-0 top-0 h-full w-1 ${statusDotClass(TRUCK_STATUS_TONE[effectiveStatus])}`}
                />
              }
            >
              <CardContent className="p-4 pl-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold">{t.plate}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.brand} {t.model} · {t.year}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={effectiveStatus === "disponivel" ? "success" : "secondary"}>
                      {TRUCK_STATUS_LABELS[effectiveStatus] ?? effectiveStatus}
                    </Badge>
                    {canWrite && (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" asChild aria-label="Editar">
                          <Link href={`/dashboard/frota/${t.id}/editar`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Excluir"
                          onClick={() => setDeleteId(t.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm">{t.mileage_km.toLocaleString("pt-BR")} km</p>
                <div onClick={(e) => e.stopPropagation()}>
                  <ActiveTripLink freight={findActiveFreightByTruck(freights, t.id)} />
                </div>
                {t.license_expires_at && (
                  <p className="text-xs text-muted-foreground">
                    Licenciamento: {formatDateBR(t.license_expires_at)}
                  </p>
                )}
              </CardContent>
            </ClickableListCard>
          ))}
          </div>
          {(data?.total ?? 0) > 0 && statusFilter === "all" ? (
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
        title="Excluir caminhão?"
        description="O registro será removido da frota. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </ListPage>
  )
}
