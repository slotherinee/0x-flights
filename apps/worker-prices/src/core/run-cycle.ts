import type { Queue } from 'bullmq'
import type { Redis } from 'ioredis'
import { getActiveTrackers, insertPricesBatch, getLastSentNotificationPrices } from '@0x-flights/db'
import type { NotificationJob, Tracker } from '@0x-flights/shared'
import type { FlightProvider } from '../providers'
import { groupTrackersByRoute } from './group-trackers'
import { loadUserTelegramMap } from './load-user-map'
import { convertUsdToCurrency, getUsdRates } from './fx-rates'

type PriceRecord = {
  trackerId: number
  price: number
  currency: string
  source: string
}

type RunPriceCycleDeps = {
  provider: FlightProvider
  redis: Redis
  notifQueue: Queue<NotificationJob>
}

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
  routeCount: number,
  priceCount: number,
  notifCount: number,
) {
  const cycleCount = await redis.incr(CYCLE_COUNT_KEY)
  await redis.set(
    LAST_CYCLE_KEY,
    JSON.stringify({ durationMs, trackers: trackerCount, routes: routeCount, prices: priceCount, notifs: notifCount, cycleCount }),
  )
}

type PendingNotification = {
  tracker: Tracker
  telegramId: string
  price: number
  currency: string
}

function toNotificationJob(
  pending: PendingNotification,
  previousPrice: number | null,
): NotificationJob {
  return {
    trackerId: pending.tracker.id,
    userId: pending.tracker.userId,
    telegramId: pending.telegramId,
    origin: pending.tracker.origin,
    destination: pending.tracker.destination,
    departureDate: pending.tracker.departureDate,
    returnDate: pending.tracker.returnDate,
    price: pending.price,
    currency: pending.currency,
    threshold: pending.tracker.priceThreshold,
    previousPrice,
  }
}

export async function runPriceCycle({
  provider,
  redis,
  notifQueue,
}: RunPriceCycleDeps): Promise<void> {
  const cycleStart = Date.now()
  console.log(`[PriceWorker] Cycle start - provider: ${provider.name}`)

  const trackers = await getActiveTrackers()
  if (!trackers.length) {
    console.log('[PriceWorker] No active trackers, skipping.')
    await saveMetrics(redis, Date.now() - cycleStart, 0, 0, 0, 0)
    await markLastRun(redis)
    return
  }

  const groups = groupTrackersByRoute(trackers)
  console.log(`[PriceWorker] ${trackers.length} trackers -> ${groups.size} unique routes`)

  const usdRates = await getUsdRates(redis)
  if (!usdRates) {
    console.error('[PriceWorker] FX rates unavailable, cycle skipped.')
    await saveMetrics(redis, Date.now() - cycleStart, trackers.length, 0, 0, 0)
    await markLastRun(redis)
    return
  }

  const userMap = await loadUserTelegramMap()
  const priceRecords: PriceRecord[] = []
  const pendingNotifications: PendingNotification[] = []

  for (const [key, group] of groups) {
    const sample = group[0]
    if (!sample) continue

    let result = null
    try {
      result = await provider.searchFlights({
        origin: sample.origin,
        destination: sample.destination,
        departureDate: sample.departureDate,
        returnDate: sample.returnDate,
        adults: sample.adults,
        currency: 'USD',
      })
    } catch (err) {
      console.error(`[PriceWorker] Search error for ${key}:`, err)
      continue
    }

    if (!result) {
      console.log(`[PriceWorker] No result for ${key}`)
      continue
    }

    console.log(`[PriceWorker] ${key} -> ${result.lowestPrice} ${result.currency}`)

    for (const tracker of group) {
      const converted = convertUsdToCurrency(result.lowestPrice, tracker.currency, usdRates)
      if (converted === null) {
        console.error(
          `[PriceWorker] Missing FX rate for ${tracker.currency}; tracker ${tracker.id} skipped`,
        )
        continue
      }

      priceRecords.push({
        trackerId: tracker.id,
        price: converted,
        currency: tracker.currency,
        source: result.source,
      })

      if (converted <= tracker.priceThreshold) {
        const telegramId = userMap.get(tracker.userId)
        if (!telegramId) continue
        pendingNotifications.push({ tracker, telegramId, price: converted, currency: tracker.currency })
      }
    }
  }

  const prevPrices = await getLastSentNotificationPrices(
    pendingNotifications.map((n) => n.tracker.id),
  )
  const notificationJobs: NotificationJob[] = pendingNotifications.map((pending) =>
    toNotificationJob(pending, prevPrices.get(pending.tracker.id) ?? null),
  )

  if (priceRecords.length) {
    await insertPricesBatch(priceRecords)
    console.log(`[PriceWorker] Saved ${priceRecords.length} price records`)
  }

  if (notificationJobs.length) {
    await notifQueue.addBulk(notificationJobs.map((data) => ({ name: 'notify', data })))
    console.log(`[PriceWorker] Enqueued ${notificationJobs.length} notifications`)
  }

  await saveMetrics(redis, Date.now() - cycleStart, trackers.length, groups.size, priceRecords.length, notificationJobs.length)
  await markLastRun(redis)
  console.log('[PriceWorker] Cycle complete.')
}
