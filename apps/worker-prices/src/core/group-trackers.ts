import type { Tracker } from '@0x-flights/shared'

export type SearchQuery = {
  origin: string
  destination: string
  departureDate: string
  returnDate: string | null
  adults: number
}

export type SearchPlan = {
  queries: Map<string, SearchQuery>       // queryKey → SearchQuery
  trackerQueryKeys: Map<number, string[]> // trackerId → queryKeys
}

function expandDate(date: string, offset: number): string[] {
  if (offset === 0) return [date]
  const base = new Date(date)
  const dates: string[] = []
  for (let i = -offset; i <= offset; i++) {
    const d = new Date(base)
    d.setUTCDate(d.getUTCDate() + i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

function queryKey(origin: string, dest: string, dep: string, ret: string | null, adults: number): string {
  return `${origin}:${dest}:${dep}:${ret ?? ''}:${adults}`
}

export function buildSearchPlan(trackers: Tracker[]): SearchPlan {
  const queries = new Map<string, SearchQuery>()
  const trackerQueryKeys = new Map<number, string[]>()

  for (const tracker of trackers) {
    const depDates = expandDate(tracker.departureDate, tracker.departureOffset)
    const retDates = tracker.returnDate
      ? expandDate(tracker.returnDate, tracker.returnOffset)
      : [null]

    const keys: string[] = []
    for (const dep of depDates) {
      for (const ret of retDates) {
        const key = queryKey(tracker.origin, tracker.destination, dep, ret, tracker.adults)
        if (!queries.has(key)) {
          queries.set(key, {
            origin: tracker.origin,
            destination: tracker.destination,
            departureDate: dep,
            returnDate: ret,
            adults: tracker.adults,
          })
        }
        keys.push(key)
      }
    }
    trackerQueryKeys.set(tracker.id, keys)
  }

  return { queries, trackerQueryKeys }
}
