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
import { listTrucks } from "@/lib/api/services/fleet"
import { formatDateBR } from "@/lib/format/dates"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/rbac/permissions"

const statusLabel: Record<string, string> = {
  disponivel: "Disponível",
  em_viagem: "Em viagem",
  em_manutencao: "Manutenção",
  inativo: "Inativo",
}

export function FleetListView() {
  const canWrite = usePermission(PERMISSIONS.fleetWrite)
  const { data, isLoading } = useSWR("trucks", () => listTrucks(1, 50))

  return (
    <div>
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
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !data?.items.length ? (
        <EmptyState title="Frota vazia" description="Cadastre o primeiro caminhão." actionLabel="Novo caminhão" onAction={() => (window.location.href = "/dashboard/frota/novo")} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.items.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Link href={`/dashboard/frota/${t.id}`} className="text-lg font-semibold hover:underline">
                      {t.plate}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {t.brand} {t.model} · {t.year}
                    </p>
                  </div>
                  <Badge variant={t.status === "disponivel" ? "success" : "secondary"}>
                    {statusLabel[t.status] ?? t.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm">{t.mileage_km.toLocaleString("pt-BR")} km</p>
                {t.license_expires_at && (
                  <p className="text-xs text-muted-foreground">
                    Licenciamento: {formatDateBR(t.license_expires_at)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
