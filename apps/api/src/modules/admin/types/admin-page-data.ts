import type { AdminStats } from './admin-stats'
import type { AdminWorkerStatus } from './admin-worker-status'
import type { AdminUserRow } from './admin-user-row'
import type { AdminTrackerRow } from './admin-tracker-row'
import type { AdminPriceRow } from './admin-price-row'
import type { AdminNotificationRow } from './admin-notification-row'
import type { Paginated } from './pagination'

export type AdminPageData = {
  stats: AdminStats
  workerStatus: AdminWorkerStatus
  usersPage: Paginated<AdminUserRow>
  trackersPage: Paginated<AdminTrackerRow>
  pricesPage: Paginated<AdminPriceRow>
  notificationsPage: Paginated<AdminNotificationRow>
}
