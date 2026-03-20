import type { Queue } from 'bullmq'
import type { Redis } from 'ioredis'
import { getActiveTrackers, insertPricesBatch } from '@0x-flights/db'
import type { NotificationJob, Tracker } from '@0x-flights/shared'
import type { FlightProvider } from '../providers'
import { groupTrackersByRoute } from './group-trackers'
import { loadUserTelegramMap } from './load-user-map'

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

async function markLastRun(redis: Redis) {
  await redis.set(LAST_RUN_KEY, new Date().toISOString())
}

function toNotificationJob(
  tracker: Tracker,
  telegramId: string,
  price: number,
  currency: string,
): NotificationJob {
  return {
    trackerId: tracker.id,
    userId: tracker.userId,
    telegramId,
    origin: tracker.origin,
    destination: tracker.destination,
    departureDate: tracker.departureDate,
    price,
    currency,
    threshold: tracker.priceThreshold,
  }
}

export async function runPriceCycle({
  provider,
  redis,
  notifQueue,
}: RunPriceCycleDeps): Promise<void> {
  console.log(`[PriceWorker] Cycle start - provider: ${provider.name}`)

  const trackers = await getActiveTrackers()
  if (!trackers.length) {
    console.log('[PriceWorker] No active trackers, skipping.')
    await markLastRun(redis)
    return
  }

  const groups = groupTrackersByRoute(trackers)
  console.log(`[PriceWorker] ${trackers.length} trackers -> ${groups.size} unique routes`)

  const userMap = await loadUserTelegramMap()
  const priceRecords: PriceRecord[] = []
  const notificationJobs: NotificationJob[] = []

  for (const [key, group] of groups) {
    const sample = group[0]
    if (!sample) continue

    let result = null
    try {
      result = await provider.searchFlights({
        origin: sample.origin,
        destination: sample.destination,
        departureDate: sample.departureDate,
        adults: sample.adults,
        currency: sample.currency,
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
      priceRecords.push({
        trackerId: tracker.id,
        price: result.lowestPrice,
        currency: result.currency,
        source: result.source,
      })

      if (result.lowestPrice <= tracker.priceThreshold) {
        const telegramId = userMap.get(tracker.userId)
        if (!telegramId) continue
        notificationJobs.push(
          toNotificationJob(tracker, telegramId, result.lowestPrice, result.currency),
        )
      }
    }
  }

  if (priceRecords.length) {
    await insertPricesBatch(priceRecords)
    console.log(`[PriceWorker] Saved ${priceRecords.length} price records`)
  }

  if (notificationJobs.length) {
    await notifQueue.addBulk(notificationJobs.map((data) => ({ name: 'notify', data })))
    console.log(`[PriceWorker] Enqueued ${notificationJobs.length} notifications`)
  }

  await markLastRun(redis)
  console.log('[PriceWorker] Cycle complete.')
}
