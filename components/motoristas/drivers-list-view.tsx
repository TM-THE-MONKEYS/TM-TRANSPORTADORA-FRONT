"use client"

import Link from "next/link"
import useSWR from "swr"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { listDrivers } from "@/lib/api/services/drivers"
import { formatDateBR } from "@/lib/format/dates"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"

export function DriversListView() {
  const canWrite = usePermission(PERMISSIONS.driversWrite)
  const { data, isLoading } = useSWR("drivers", () => listDrivers(1, 50))

  return (
    <div>
      <PageHeader
        title="Motoristas"
        description="CNH, jornada e documentação"
        actions={
          canWrite && (
            <Button asChild>
              <Link href="/dashboard/motoristas/novo">
                <Plus className="mr-2 h-4 w-4" />
                Novo motorista
              </Link>
            </Button>
          )
        }
      />
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : !data?.items.length ? (
        <EmptyState title="Sem motoristas" description="Cadastre motoristas da frota." actionLabel="Novo" onAction={() => (window.location.href = "/dashboard/motoristas/novo")} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.items.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <Link href={`/dashboard/motoristas/${d.id}`} className="font-semibold hover:underline">
                    {d.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">CNH {d.cnh_category} · {d.cnh_number}</p>
                  <p className="text-xs text-muted-foreground">Validade: {formatDateBR(d.cnh_expires_at)}</p>
                </div>
                <Badge>{d.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
