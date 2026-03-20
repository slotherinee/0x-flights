/**
 * Price Worker
 *
 * Strategy:
 * 1. Load all active trackers from DB
 * 2. Group by unique route (origin+destination+date+returnDate+adults+currency)
 *    → 1 API call per unique route regardless of how many users track it
 * 3. Batch-insert all price records
 * 4. Enqueue notification jobs for trackers where price <= threshold
 *
 * Redis key `worker-prices:last-run` is updated after each cycle
 * so the admin page can show worker status.
 * Redis key `worker-prices:force-run` triggers an immediate cycle
 * when set by the admin page.
 */
import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import { env, getRedisConfig } from '@0x-flights/config'
import { getActiveTrackers, insertPricesBatch, getDb, closeDb } from '@0x-flights/db'
import { users } from '@0x-flights/db'
import { QUEUE_NAMES } from '@0x-flights/shared'
import type { NotificationJob, Tracker } from '@0x-flights/shared'
import { createFlightProvider } from './providers'

const provider = createFlightProvider()
const redis = new Redis(getRedisConfig())

const notifQueue = new Queue<NotificationJob>(QUEUE_NAMES.NOTIFICATIONS, {
  connection: getRedisConfig(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
})

const routeKey = (t: Tracker) =>
  `${t.origin}:${t.destination}:${t.departureDate}:${t.returnDate ?? ''}:${t.adults}:${t.currency}`

async function runCycle() {
  console.log(`[PriceWorker] Cycle start — provider: ${provider.name}`)

  const trackers = await getActiveTrackers()
  if (!trackers.length) {
    console.log('[PriceWorker] No active trackers, skipping.')
    await redis.set('worker-prices:last-run', new Date().toISOString())
    return
  }

  // Group trackers by unique route
  const groups = new Map<string, Tracker[]>()
  for (const t of trackers) {
    const key = routeKey(t)
    groups.set(key, [...(groups.get(key) ?? []), t])
  }
  console.log(`[PriceWorker] ${trackers.length} trackers → ${groups.size} unique routes`)

  // Load telegram IDs for notification jobs
  const db = getDb()
  const userRows = await db.select({ id: users.id, telegramId: users.telegramId }).from(users)
  const userMap = new Map(userRows.map((u) => [u.id, u.telegramId]))

  const priceRecords: { trackerId: number; price: number; currency: string; source: string }[] = []
  const notifJobs: NotificationJob[] = []

  for (const [key, group] of groups) {
    const sample = group[0]!
    let result = null

    try {
      result = await provider.searchFlights({
        origin: sample.origin,
        destination: sample.destination,
        departureDate: sample.departureDate,
        returnDate: sample.returnDate,
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

    console.log(`[PriceWorker] ${key} → ${result.lowestPrice} ${result.currency}`)

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
        notifJobs.push({
          trackerId: tracker.id,
          userId: tracker.userId,
          telegramId,
          origin: tracker.origin,
          destination: tracker.destination,
          departureDate: tracker.departureDate,
          price: result.lowestPrice,
          currency: result.currency,
          threshold: tracker.priceThreshold,
        })
      }
    }
  }

  // Batch-insert prices
  if (priceRecords.length) {
    await insertPricesBatch(priceRecords)
    console.log(`[PriceWorker] Saved ${priceRecords.length} price records`)
  }

  // Enqueue notifications
  if (notifJobs.length) {
    await notifQueue.addBulk(notifJobs.map((data) => ({ name: 'notify', data })))
    console.log(`[PriceWorker] Enqueued ${notifJobs.length} notifications`)
  }

  await redis.set('worker-prices:last-run', new Date().toISOString())
  console.log('[PriceWorker] Cycle complete.')
}

// ─── Main loop ────────────────────────────────────────────────────────────────
console.log(`[PriceWorker] Starting. Interval: ${env.PRICE_WORKER_INTERVAL_MS}ms`)

await runCycle()

// Check for admin force-run flag every 30s, otherwise run on interval
setInterval(async () => {
  const force = await redis.getdel('worker-prices:force-run')
  if (force) {
    console.log('[PriceWorker] Force-run triggered by admin.')
    await runCycle()
  }
}, 30_000)

setInterval(runCycle, env.PRICE_WORKER_INTERVAL_MS)

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const shutdown = async () => {
  console.log('[PriceWorker] Shutting down...')
  await notifQueue.close()
  await redis.quit()
  if ('close' in provider) await (provider as { close(): Promise<void> }).close()
  await closeDb()
  process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
