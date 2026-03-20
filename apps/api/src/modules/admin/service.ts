import {
  getStats,
  getPriceWorkerStatus,
  getAllUsers,
  getAllTrackers,
  getRecentPrices,
  getRecentNotifications,
} from './data-fetchers'
import { activateTracker, deactivateTracker, banUser, unbanUser, triggerPriceWorkerRunNow } from './repository'

type AdminPageParams = {
  usersPage: number
  trackersPage: number
  pricesPage: number
  notificationsPage: number
}

const USERS_PAGE_SIZE = 15
const TRACKERS_PAGE_SIZE = 20
const PRICES_PAGE_SIZE = 30
const NOTIFS_PAGE_SIZE = 30

export async function getAdminPageData(params: AdminPageParams) {
  const [stats, workerStatus, usersPage, trackersPage, pricesPage, notificationsPage] =
    await Promise.all([
      getStats(),
      getPriceWorkerStatus(),
      getAllUsers({ page: params.usersPage, pageSize: USERS_PAGE_SIZE }),
      getAllTrackers({ page: params.trackersPage, pageSize: TRACKERS_PAGE_SIZE }),
      getRecentPrices({ page: params.pricesPage, pageSize: PRICES_PAGE_SIZE }),
      getRecentNotifications({ page: params.notificationsPage, pageSize: NOTIFS_PAGE_SIZE }),
    ])

  return { stats, workerStatus, usersPage, trackersPage, pricesPage, notificationsPage }
}

export async function runPriceWorkerNow() {
  await triggerPriceWorkerRunNow()
}

export async function deactivateTrackerById(id: number) {
  await deactivateTracker(id)
}

export async function activateTrackerById(id: number) {
  await activateTracker(id)
}

export async function banUserById(id: number) {
  await banUser(id)
}

export async function unbanUserById(id: number) {
  await unbanUser(id)
}
