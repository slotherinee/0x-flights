import type { AdminStats } from './admin-stats'
import type { AdminWorkerStatus } from './admin-worker-status'
import type { AdminUserRow } from './admin-user-row'
import type { AdminTrackerRow } from './admin-tracker-row'
import type { AdminPriceRow } from './admin-price-row'
import type { AdminNotificationRow } from './admin-notification-row'

export type AdminPageData = {
  stats: AdminStats
  workerStatus: AdminWorkerStatus
  allUsers: AdminUserRow[]
  allTrackers: AdminTrackerRow[]
  recentPrices: AdminPriceRow[]
  recentNotifs: AdminNotificationRow[]
}
