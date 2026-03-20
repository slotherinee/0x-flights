import {
  getStats,
  getPriceWorkerStatus,
  getAllUsers,
  getAllTrackers,
  getRecentPrices,
  getRecentNotifications,
} from './data-fetchers'
import { deactivateTracker, banUser, triggerPriceWorkerRunNow } from './repository'

export async function getAdminPageData() {
  const [stats, workerStatus, allUsers, allTrackers, recentPrices, recentNotifs] = await Promise.all([
    getStats(),
    getPriceWorkerStatus(),
    getAllUsers(),
    getAllTrackers(),
    getRecentPrices(),
    getRecentNotifications(),
  ])

  return { stats, workerStatus, allUsers, allTrackers, recentPrices, recentNotifs }
}

export async function runPriceWorkerNow() {
  await triggerPriceWorkerRunNow()
}

export async function deactivateTrackerById(id: number) {
  await deactivateTracker(id)
}

export async function banUserById(id: number) {
  await banUser(id)
}
