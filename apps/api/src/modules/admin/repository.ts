import { getDb, trackers } from '@0x-flights/db'
import { eq } from 'drizzle-orm'
import { redis } from './redis'

export async function triggerPriceWorkerRunNow() {
  await redis.set('worker-prices:force-run', '1', 'EX', 300)
}

export async function deactivateTracker(trackerId: number) {
  await getDb().update(trackers).set({ isActive: false }).where(eq(trackers.id, trackerId))
}

export async function banUser(userId: number) {
  await getDb().update(trackers).set({ isActive: false }).where(eq(trackers.userId, userId))
}
