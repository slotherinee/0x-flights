export type PriceCycleMetrics = {
  cycleCount: number
  durationMs: number
  trackers: number
  routes: number
  prices: number
  notifs: number
}

export type AdminWorkerStatus = {
  lastRun: string | null
  ageMs: number | null
  freshness: 'ok' | 'stale' | 'never'
  forcePending: boolean
  lastCycle: PriceCycleMetrics | null
  notifWorker: {
    lastRun: string | null
    jobsCompleted: number
    jobsFailed: number
  }
}
