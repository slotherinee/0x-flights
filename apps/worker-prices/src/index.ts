import { Queue } from 'bullmq'
import cron from 'node-cron'
import { Redis } from 'ioredis'
import { getRedisConfig } from '@0x-flights/config'
import { closeDb, expirePreDepartureTrackers } from '@0x-flights/db'
import { QUEUE_NAMES } from '@0x-flights/shared'
import type { NotificationJob } from '@0x-flights/shared'
import { createFlightProvider } from './providers'
import { refreshUsdRates } from './core/fx-rates'
import { runPriceCycle } from './core/run-cycle'
import { closeProviderIfSupported } from './core/provider-utils'

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

const runCycle = () => runPriceCycle({ provider, redis, notifQueue })
const MOSCOW_TZ = 'Europe/Moscow'
const FORCE_RUN_CHECK_INTERVAL_MS = 30_000

await refreshUsdRates(redis)

// ─── Main loop ────────────────────────────────────────────────────────────────
console.log('[PriceWorker] Starting. Cron schedule: 0 8,20 * * * (Europe/Moscow)')

const scheduledTask = cron.schedule(
  '0 8,20 * * *',
  async () => {
    console.log('[PriceWorker] Cron run at 08:00/20:00 MSK')
    await runCycle()
  },
  { timezone: MOSCOW_TZ },
)

const expireTrackersTask = cron.schedule(
  '0 9 * * *',
  async () => {
    console.log('[PriceWorker] Expiring pre-departure trackers...')
    const count = await expirePreDepartureTrackers()
    console.log(`[PriceWorker] Expired ${count} trackers departing tomorrow or earlier`)
  },
  { timezone: MOSCOW_TZ },
)

const fxRefreshTask = cron.schedule(
  '0 12 * * *',
  async () => {
    console.log('[PriceWorker] Refreshing FX rates at 12:00 MSK')
    const ok = await refreshUsdRates(redis)
    if (!ok) {
      console.error('[PriceWorker] FX refresh failed')
    }
  },
  { timezone: MOSCOW_TZ },
)

setInterval(async () => {
  const force = await redis.getdel('worker-prices:force-run')
  if (force) {
    console.log('[PriceWorker] Force-run triggered by admin.')
    await runCycle()
  }
}, FORCE_RUN_CHECK_INTERVAL_MS)

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const shutdown = async () => {
  console.log('[PriceWorker] Shutting down...')
  scheduledTask.stop()
  scheduledTask.destroy()
  expireTrackersTask.stop()
  expireTrackersTask.destroy()
  fxRefreshTask.stop()
  fxRefreshTask.destroy()
  await notifQueue.close()
  await redis.quit()
  await closeProviderIfSupported(provider)
  await closeDb()
  process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
