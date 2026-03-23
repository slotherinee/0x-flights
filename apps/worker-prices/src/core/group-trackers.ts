import type { Tracker } from '@0x-flights/shared'

export type SearchQuery = {
  origin: string
  destination: string
  departureDate: string
  returnDate: string | null
  adults: number
  departureOffset: number
  returnOffset: number
}

export type SearchPlan = {
  queries: Map<string, SearchQuery>       // queryKey → SearchQuery
  trackerQueryKeys: Map<number, string[]> // trackerId → queryKeys
}


function queryKey(origin: string, dest: string, dep: string, ret: string | null, adults: number): string {
  return `${origin}:${dest}:${dep}:${ret ?? ''}:${adults}`
}

export function buildSearchPlan(trackers: Tracker[]): SearchPlan {
  const queries = new Map<string, SearchQuery>()
  const trackerQueryKeys = new Map<number, string[]>()

  for (const tracker of trackers) {
    const key = queryKey(tracker.origin, tracker.destination, tracker.departureDate, tracker.returnDate, tracker.adults)
    if (!queries.has(key)) {
      queries.set(key, {
        origin: tracker.origin,
        destination: tracker.destination,
        departureDate: tracker.departureDate,
        returnDate: tracker.returnDate,
        adults: tracker.adults,
        departureOffset: tracker.departureOffset,
        returnOffset: tracker.returnOffset,
      })
    }
    trackerQueryKeys.set(tracker.id, [key])
  }

  return { queries, trackerQueryKeys }
}
