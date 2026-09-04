"use client"

import { useMemo } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CompetenciaNavigator } from "@/components/shared/competencia-navigator"
import { EntityFilterSelect } from "@/components/shared/entity-filter-select"
import { useOperationContext } from "@/hooks/use-operation-context"
import { getTruckLabel } from "@/lib/freight/active-trip"

interface ListFilterBarProps {
  /** Competência selecionada */
  competencia: { mes: number; ano: number }
  onCompetenciaShift: (delta: number) => void
  /** ID do motorista selecionado */
  driverId?: string
  onDriverChange: (id: string | undefined) => void
  /** ID do caminhão selecionado */
  truckId?: string
  onTruckChange: (id: string | undefined) => void
  /** Exibir seletor de caminhão (ocultar em páginas onde o caminhão já é a entidade principal) */
  showTruckFilter?: boolean
  /** Exibir seletor de motorista (ocultar em páginas onde o motorista já é a entidade principal) */
  showDriverFilter?: boolean
  className?: string
}

/**
 * Barra de filtros compartilhada entre Fretes, Frota e Motoristas.
 *
 * Regra de convergência:
 * - Motorista é a atribuição principal; caminhão é refinamento dentro dos fretes do motorista.
 * - Quando um motorista está selecionado, a lista de caminhões é restrita aos que aparecem
 *   nos fretes desse motorista.
 */
export function ListFilterBar({
  competencia,
  onCompetenciaShift,
  driverId,
  onDriverChange,
  truckId,
  onTruckChange,
  showTruckFilter = true,
  showDriverFilter = true,
  className,
}: ListFilterBarProps) {
  const { trucks, drivers, freights } = useOperationContext()

  const hasFilters = Boolean(driverId || truckId)

  /** Lista de caminhões filtrada: quando há motorista selecionado, mostra só os trucks
   *  que aparecem em fretes desse motorista — mesma regra de driver-payment-sheet. */
  const truckItems = useMemo(() => {
    const allTrucks = trucks.map((t) => ({
      id: t.id,
      label: getTruckLabel(trucks, t.id) ?? `${t.plate} — ${t.model}`,
    }))
    if (!driverId) return allTrucks
    const trucksInDriverFreights = new Set(
      freights
        .filter((f) => f.driver_id === driverId && f.truck_id)
        .map((f) => f.truck_id as string),
    )
    return allTrucks.filter((t) => trucksInDriverFreights.has(t.id))
  }, [trucks, freights, driverId])

  const driverItems = useMemo(
    () => drivers.map((d) => ({ id: d.id, label: d.name })),
    [drivers],
  )

  function handleDriverChange(id: string | undefined) {
    onDriverChange(id)
    // Ao trocar motorista, limpar o caminhão para evitar combinação inválida
    if (truckId) onTruckChange(undefined)
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <CompetenciaNavigator
        mes={competencia.mes}
        ano={competencia.ano}
        onPrevious={() => onCompetenciaShift(-1)}
        onNext={() => onCompetenciaShift(1)}
      />

      {showDriverFilter && (
        <EntityFilterSelect
          value={driverId}
          onValueChange={handleDriverChange}
          items={driverItems}
          allLabel="Todos motoristas"
          className="w-[165px]"
          disabled={drivers.length === 0}
        />
      )}

      {showTruckFilter && (
        <EntityFilterSelect
          value={truckId}
          onValueChange={onTruckChange}
          items={truckItems}
          allLabel="Todos caminhões"
          className="w-[170px]"
          disabled={truckItems.length === 0}
        />
      )}

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            onDriverChange(undefined)
            onTruckChange(undefined)
          }}
        >
          <X className="h-3 w-3" />
          Limpar
        </Button>
      )}
    </div>
  )
}
