"use client"

import Link from "next/link"
import useSWR from "swr"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { FreightStatusBadge } from "@/components/fretes/freight-status-badge"
import { listFreights } from "@/lib/api/services/freight"
import { formatBRL } from "@/lib/format/currency"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"

export function FreightsListView() {
  const canWrite = usePermission(PERMISSIONS.freightWrite)
  const { data, isLoading } = useSWR("freights-list", () => listFreights(1, 50))

  return (
    <div>
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

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <EmptyState
          title="Nenhum frete"
          description="Crie a primeira ordem de frete para iniciar a operação."
          actionLabel={canWrite ? "Nova ordem" : undefined}
          onAction={canWrite ? () => (window.location.href = "/dashboard/fretes/novo") : undefined}
        />
      ) : (
        <div className="space-y-3">
          {data.items.map((f) => (
            <Card key={f.id} className="transition-colors hover:bg-muted/30">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/dashboard/fretes/${f.id}`} className="font-semibold hover:underline">
                      {f.code}
                    </Link>
                    <FreightStatusBadge status={f.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {f.origin_city}/{f.origin_state} → {f.destination_city}/{f.destination_state}
                  </p>
                  <p className="text-sm">{f.customer_name ?? f.customer_id}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatBRL(f.value_brl)}</p>
                  <p className="text-xs text-muted-foreground">{f.weight_kg} kg</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
