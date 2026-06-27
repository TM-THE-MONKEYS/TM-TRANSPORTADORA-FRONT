import type { FreightOrder, FreightStop } from "@/types"

function cityState(city: string, state: string): string {
  return `${city}/${state}`
}

function stopLabel(stop: Pick<FreightStop, "city" | "state">): string {
  return cityState(stop.city, stop.state)
}

/** Rota resumida: SP → Campinas → Santos/SP */
export function formatFreightRouteShort(freight: Pick<
  FreightOrder,
  "origin_city" | "origin_state" | "destination_city" | "destination_state" | "stops"
>): string {
  const parts = [cityState(freight.origin_city, freight.origin_state)]
  for (const stop of freight.stops ?? []) {
    parts.push(stopLabel(stop))
  }
  parts.push(cityState(freight.destination_city, freight.destination_state))
  return parts.join(" → ")
}

export function formatFreightRouteStops(freight: FreightOrder): Array<{
  label: string
  kind: "origin" | "stop" | "destination"
  sequence?: number
  detail?: string
}> {
  const items: Array<{
    label: string
    kind: "origin" | "stop" | "destination"
    sequence?: number
    detail?: string
  }> = [
    {
      kind: "origin",
      label: formatPlace(freight.origin_street, freight.origin_city, freight.origin_state),
    },
  ]

  for (const stop of freight.stops ?? []) {
    items.push({
      kind: "stop",
      sequence: stop.sequence,
      label: formatPlace(stop.street, stop.city, stop.state),
      detail: [stop.cargo_description, stop.weight_kg ? `${stop.weight_kg.toLocaleString("pt-BR")} kg` : null]
        .filter(Boolean)
        .join(" · ") || undefined,
    })
  }

  items.push({
    kind: "destination",
    label: formatPlace(
      freight.destination_street,
      freight.destination_city,
      freight.destination_state,
    ),
  })

  return items
}

function formatPlace(street: string | null | undefined, city: string, state: string): string {
  return street?.trim() ? `${street}, ${city}/${state}` : `${city}/${state}`
}
