import type { Tracker } from '@0x-flights/shared'

export function routeKey(t: Tracker): string {
  return `${t.origin}:${t.destination}:${t.departureDate}:${t.returnDate ?? ''}:${t.adults}:${t.currency}`
}

export function groupTrackersByRoute(trackers: Tracker[]): Map<string, Tracker[]> {
  const groups = new Map<string, Tracker[]>()
  for (const tracker of trackers) {
    const key = routeKey(tracker)
    groups.set(key, [...(groups.get(key) ?? []), tracker])
  }
  return groups
}
