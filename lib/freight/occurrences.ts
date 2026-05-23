import type { FreightOccurrence, TrackingUpdate } from "@/types"

/** Marcador em tm_tracking_updates.descricao / observacao (backend tracking). */
export const OCCURRENCE_TAG = "[[ocorrencia:"

export function formatOccurrenceObservation(type: string, description: string): string {
  return `${OCCURRENCE_TAG}${type}]] ${description.trim()}`
}

export function isOccurrenceTrackingUpdate(update: TrackingUpdate): boolean {
  return (update.observacao ?? "").includes(OCCURRENCE_TAG)
}

export function parseOccurrenceFromTracking(update: TrackingUpdate): FreightOccurrence | null {
  const text = update.observacao ?? ""
  if (!text.includes(OCCURRENCE_TAG)) return null
  const match = text.match(/\[\[ocorrencia:([^\]]+)\]\]\s*([\s\S]*)/)
  const type = match?.[1]?.trim() ?? "geral"
  const description = match?.[2]?.trim() ?? text
  return {
    id: update.id,
    freight_id: update.freight_id,
    type,
    description,
    created_at: update.evento_at ?? update.created_at,
  }
}

export function trackingUpdatesToOccurrences(updates: TrackingUpdate[]): FreightOccurrence[] {
  return updates
    .filter(isOccurrenceTrackingUpdate)
    .map(parseOccurrenceFromTracking)
    .filter((o): o is FreightOccurrence => o !== null)
}

export function trackingUpdatesWithoutOccurrences(updates: TrackingUpdate[]): TrackingUpdate[] {
  return updates.filter((u) => !isOccurrenceTrackingUpdate(u))
}
