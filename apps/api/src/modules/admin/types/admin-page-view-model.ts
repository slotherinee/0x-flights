import type { AdminStats } from './admin-stats'
import type { PaginationMeta } from './pagination'

export type AdminPageViewModel = {
  styles: string
  now: string
  activeTab: 'overview' | 'users' | 'trackers' | 'prices' | 'notifications'
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
    canUnban: boolean
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
  usersPagination: PaginationMeta
  trackersPagination: PaginationMeta
  pricesPagination: PaginationMeta
  notificationsPagination: PaginationMeta
  usersPrevHref: string
  usersNextHref: string
  trackersPrevHref: string
  trackersNextHref: string
  pricesPrevHref: string
  pricesNextHref: string
  notificationsPrevHref: string
  notificationsNextHref: string
}
