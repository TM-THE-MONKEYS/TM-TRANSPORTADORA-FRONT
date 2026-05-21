"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { getTruck } from "@/lib/api/services/fleet"
import { formatDateBR } from "@/lib/format/dates"

export function TruckDetailView({ id }: { id: string }) {
  const { data: truck } = useSWR(["truck", id], () => getTruck(id))
  const implements_: { id: string; type: string; identifier: string }[] = []

  if (!truck) return <Skeleton className="h-96 w-full" />

  return (
    <div>
      <PageHeader title={truck.plate} description={`${truck.brand} ${truck.model}`} />
      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="documentacao">Documentação</TabsTrigger>
          <TabsTrigger value="implementos">Implementos</TabsTrigger>
        </TabsList>
        <TabsContent value="dados" className="mt-4">
          <Card>
            <CardContent className="grid gap-2 pt-6 sm:grid-cols-2">
              <p><span className="text-muted-foreground">Status:</span> {truck.status}</p>
              <p><span className="text-muted-foreground">Km:</span> {truck.mileage_km.toLocaleString("pt-BR")}</p>
              <p><span className="text-muted-foreground">Capacidade:</span> {truck.capacity_kg ?? "—"} kg</p>
              <p><span className="text-muted-foreground">Consumo médio:</span> {truck.avg_consumption_km_l ?? "—"} km/l</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documentacao" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-2">
              <p>Seguro: {formatDateBR(truck.insurance_expires_at)}</p>
              <p>Licenciamento: {formatDateBR(truck.license_expires_at)}</p>
              <p className="text-xs text-muted-foreground">Renavam: {truck.renavam ?? "—"}</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="implementos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Implementos</CardTitle>
            </CardHeader>
            <CardContent>
              {(implements_ ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum implemento cadastrado.</p>
              ) : (
                <ul className="space-y-2">
                  {implements_!.map((imp) => (
                    <li key={imp.id} className="text-sm">
                      {imp.type} — {imp.identifier}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
