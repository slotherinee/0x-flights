import type { AdminStats } from './admin-stats'

export type AdminPageViewModel = {
  styles: string
  now: string
  stats: AdminStats
  workerStatus: {
    lastRunText: string
    freshness: 'ok' | 'stale' | 'never'
    forcePending: boolean
  }
  allUsers: Array<{
    id: number
    telegramId: string
    username: string
    fullName: string
    trackerCount: number
    activeTrackerCount: number
    joinedDate: string
    canBan: boolean
  }>
  allTrackers: Array<{
    id: number
    userLabel: string
    route: string
    departureDate: string
    thresholdText: string
    latestPriceText: string
    isActive: boolean
  }>
  recentPrices: Array<{
    trackerId: number
    route: string
    priceText: string
    source: string
    fetchedAt: string
  }>
  recentNotifs: Array<{
    userLabel: string
    route: string
    priceText: string
    isSent: boolean
    createdAt: string
  }>
}
