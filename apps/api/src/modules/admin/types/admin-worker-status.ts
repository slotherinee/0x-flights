export type AdminWorkerStatus = {
  lastRun: string | null
  ageMs: number | null
  freshness: 'ok' | 'stale' | 'never'
  forcePending: boolean
}
