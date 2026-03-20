import { env } from '@0x-flights/config'
import { redis } from '../redis'
import type { AdminWorkerStatus } from '../types'

export async function getPriceWorkerStatus(): Promise<AdminWorkerStatus> {
  const [lastRun, forceFlag] = await redis.mget('worker-prices:last-run', 'worker-prices:force-run')
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

  return {
    lastRun: lastRun ?? null,
    ageMs,
    freshness,
    forcePending: forceFlag != null,
  }
}
