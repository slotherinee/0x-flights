import type { Queue } from 'bullmq'
import type { Redis } from 'ioredis'
import { getActiveTrackers, insertPricesBatch, getLastSentNotificationPrices } from '@0x-flights/db'
import type { FlightTicket, NotificationJob, Tracker } from '@0x-flights/shared'
import { env } from '@0x-flights/config'
import type { FlightProvider } from '../providers'
import { buildSearchPlan } from './group-trackers'
import { loadUserTelegramMap } from './load-user-map'
import { convertUsdToCurrency, getUsdRates } from './fx-rates'

// ─── URL builder ─────────────────────────────────────────────────────────────

function dateToDDMM(date: string): string {
  const parts = date.split('-')
  return `${parts[2] ?? ''}${parts[1] ?? ''}`
}

function buildTicketUrl(tracker: Tracker): string | null {
  const base = env.PROVIDER_SEARCH_BASE_URL
  if (!base) return null
  const dep = dateToDDMM(tracker.departureDate)
  const adults = tracker.adults

  if (tracker.departureOffset > 0 || (tracker.returnDate && tracker.returnOffset > 0)) {
    // Flexible URL: /?params=...&departure_offset=N&return_offset=M
    const origin = base.replace(/\/search\/?$/, '')
    const params = tracker.returnDate
      ? `${tracker.origin}${dep}${tracker.destination}${dateToDDMM(tracker.returnDate)}${adults}`
      : `${tracker.origin}${dep}${tracker.destination}${adults}`
    const retOffset = tracker.returnDate ? tracker.returnOffset : 0
    return `${origin}/?params=${params}&departure_offset=${tracker.departureOffset}&return_offset=${retOffset}`
  }

  if (tracker.returnDate) {
    return `${base}/${tracker.origin}${dep}${tracker.destination}${dateToDDMM(tracker.returnDate)}${adults}`
  }
  return `${base}/${tracker.origin}${dep}${tracker.destination}${adults}`
}

// ─── Redis metrics ────────────────────────────────────────────────────────────

const LAST_RUN_KEY = 'worker-prices:last-run'
const CYCLE_COUNT_KEY = 'worker-prices:cycle-count'
const LAST_CYCLE_KEY = 'worker-prices:last-cycle'

async function markLastRun(redis: Redis) {
  await redis.set(LAST_RUN_KEY, new Date().toISOString())
}

async function saveMetrics(
  redis: Redis,
  durationMs: number,
  trackerCount: number,
  queryCount: number,
  priceCount: number,
  notifCount: number,
) {
  const cycleCount = await redis.incr(CYCLE_COUNT_KEY)
  await redis.set(
    LAST_CYCLE_KEY,
    JSON.stringify({ durationMs, trackers: trackerCount, routes: queryCount, prices: priceCount, notifs: notifCount, cycleCount }),
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

type PriceRecord = { trackerId: number; price: number; currency: string; source: string }

type PendingNotification = { tracker: Tracker; telegramId: string; price: number; currency: string; tickets?: FlightTicket[] }

type RunPriceCycleDeps = { provider: FlightProvider; redis: Redis; notifQueue: Queue<NotificationJob> }

function toNotificationJob(pending: PendingNotification, previousPrice: number | null): NotificationJob {
  return {
    trackerId: pending.tracker.id,
    userId: pending.tracker.userId,
    telegramId: pending.telegramId,
    origin: pending.tracker.origin,
    destination: pending.tracker.destination,
    departureDate: pending.tracker.departureDate,
    returnDate: pending.tracker.returnDate,
    adults: pending.tracker.adults,
    departureOffset: pending.tracker.departureOffset,
    returnOffset: pending.tracker.returnOffset,
    price: pending.price,
    currency: pending.currency,
    threshold: pending.tracker.priceThreshold,
    previousPrice,
    ticketUrl: buildTicketUrl(pending.tracker),
    tickets: pending.tickets,
  }
}

// ─── Main cycle ───────────────────────────────────────────────────────────────

export async function runPriceCycle({ provider, redis, notifQueue }: RunPriceCycleDeps): Promise<void> {
  const cycleStart = Date.now()
  console.log(`[PriceWorker] Cycle start - provider: ${provider.name}`)

  const trackers = await getActiveTrackers()
  if (!trackers.length) {
    console.log('[PriceWorker] No active trackers, skipping.')
    await saveMetrics(redis, Date.now() - cycleStart, 0, 0, 0, 0)
    await markLastRun(redis)
    return
  }

  const { queries, trackerQueryKeys } = buildSearchPlan(trackers)
  console.log(`[PriceWorker] ${trackers.length} trackers -> ${queries.size} unique searches`)

  const usdRates = await getUsdRates(redis)
  if (!usdRates) {
    console.error('[PriceWorker] FX rates unavailable, cycle skipped.')
    await saveMetrics(redis, Date.now() - cycleStart, trackers.length, 0, 0, 0)
    await markLastRun(redis)
    return
  }

  // Preload data needed for per-tracker processing
  const userMap = await loadUserTelegramMap()
  const prevPrices = await getLastSentNotificationPrices(trackers.map((t) => t.id))

  // Execute queries and process each tracker as soon as all its queries are ready
  type SearchResult = { lowestPrice: number; source: string; tickets: FlightTicket[] }
  const queryResults = new Map<string, SearchResult | null>()
  const processedTrackers = new Set<number>()
  const priceRecords: PriceRecord[] = []
  let notifCount = 0

  for (const [key, query] of queries) {
    try {
      const result = await provider.searchFlights({ ...query, currency: 'USD' })
      queryResults.set(key, result ? { lowestPrice: result.lowestPrice, source: result.source, tickets: result.tickets ?? [] } : null)
      if (result) console.log(`[PriceWorker] ${key} -> ${result.lowestPrice} USD`)
      else console.log(`[PriceWorker] No result for ${key}`)
    } catch (err) {
      console.error(`[PriceWorker] Search error for ${key}:`, err)
      queryResults.set(key, null)
    }

    // Process any tracker whose queries are all complete
    for (const tracker of trackers) {
      if (processedTrackers.has(tracker.id)) continue
      const keys = trackerQueryKeys.get(tracker.id) ?? []
      if (!keys.every((k) => queryResults.has(k))) continue

      processedTrackers.add(tracker.id)

      let best: SearchResult | null = null
      for (const k of keys) {
        const r = queryResults.get(k)
        if (r && (best === null || r.lowestPrice < best.lowestPrice)) best = r
      }
      if (!best) continue

      const converted = convertUsdToCurrency(best.lowestPrice, tracker.currency, usdRates)
      if (converted === null) {
        console.error(`[PriceWorker] Missing FX rate for ${tracker.currency}; tracker ${tracker.id} skipped`)
        continue
      }

      priceRecords.push({ trackerId: tracker.id, price: converted, currency: tracker.currency, source: best.source })

      if (converted <= tracker.priceThreshold) {
        const telegramId = userMap.get(tracker.userId)
        if (telegramId) {
          const ratio = converted / best.lowestPrice
          const convertedTickets = best.tickets.map((t) => ({ ...t, price: Math.round(t.price * ratio * 100) / 100 }))
          const job = toNotificationJob(
            { tracker, telegramId, price: converted, currency: tracker.currency, tickets: convertedTickets },
            prevPrices.get(tracker.id) ?? null,
          )
          await notifQueue.add('notify', job)
          notifCount++
          console.log(`[PriceWorker] Enqueued notification for tracker ${tracker.id}`)
        }
      }
    }
  }

  if (priceRecords.length) {
    await insertPricesBatch(priceRecords)
    console.log(`[PriceWorker] Saved ${priceRecords.length} price records`)
  }

  await saveMetrics(redis, Date.now() - cycleStart, trackers.length, queries.size, priceRecords.length, notifCount)
  await markLastRun(redis)
  console.log('[PriceWorker] Cycle complete.')
}
