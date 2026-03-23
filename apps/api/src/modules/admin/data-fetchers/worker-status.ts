import { env } from '@0x-flights/config'
import { redis } from '../redis'
import type { AdminWorkerStatus, PriceCycleMetrics } from '../types'

export async function getPriceWorkerStatus(): Promise<AdminWorkerStatus> {
  const [lastRun, forceFlag, lastCycleRaw, notifLastRun, notifCompleted, notifFailed] =
    await redis.mget(
      'worker-prices:last-run',
      'worker-prices:force-run',
      'worker-prices:last-cycle',
      'worker-notifications:last-run',
      'worker-notifications:jobs-completed',
      'worker-notifications:jobs-failed',
    )

  let ageMs: number | null = null
  let freshness: 'ok' | 'stale' | 'never' = 'never'

  if (lastRun) {
    const parsed = new Date(lastRun).getTime()
    if (!Number.isNaN(parsed)) {
      ageMs = Date.now() - parsed
      const staleAfterMs = Math.max(env.PRICE_WORKER_INTERVAL_MS * 2, 60_000)
      freshness = ageMs <= staleAfterMs ? 'ok' : 'stale'
    }
  }

  let lastCycle: PriceCycleMetrics | null = null
  if (lastCycleRaw) {
    try {
      lastCycle = JSON.parse(lastCycleRaw) as PriceCycleMetrics
    } catch {}
  }

  return {
    lastRun: lastRun ?? null,
    ageMs,
    freshness,
    forcePending: forceFlag != null,
    lastCycle,
    notifWorker: {
      lastRun: notifLastRun ?? null,
      jobsCompleted: parseInt(notifCompleted ?? '0') || 0,
      jobsFailed: parseInt(notifFailed ?? '0') || 0,
    },
  }
}
