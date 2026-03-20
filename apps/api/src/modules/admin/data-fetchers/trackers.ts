import { getDb } from '@0x-flights/db'
import { users, trackers } from '@0x-flights/db'
import { eq, desc, sql } from 'drizzle-orm'
import type { AdminTrackerRow } from '../types'

export async function getAllTrackers(): Promise<AdminTrackerRow[]> {
  const db = getDb()
  return db
    .select({
      id: trackers.id,
      userId: trackers.userId,
      telegramId: users.telegramId,
      username: users.username,
      origin: trackers.origin,
      destination: trackers.destination,
      departureDate: trackers.departureDate,
      priceThreshold: trackers.priceThreshold,
      currency: trackers.currency,
      isActive: trackers.isActive,
      createdAt: trackers.createdAt,
      latestPrice: sql<string | null>`(
        SELECT p.price::text FROM prices p
        WHERE p.tracker_id = ${trackers.id}
        ORDER BY p.fetched_at DESC LIMIT 1
      )`,
    })
    .from(trackers)
    .leftJoin(users, eq(trackers.userId, users.id))
    .orderBy(desc(trackers.createdAt))
    .limit(100)
}
