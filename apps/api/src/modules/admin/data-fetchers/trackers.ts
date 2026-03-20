import { getDb } from '@0x-flights/db'
import { users, trackers } from '@0x-flights/db'
import { eq, desc, sql } from 'drizzle-orm'
import type { AdminTrackerRow, Paginated, PaginationInput } from '../types'

export async function getAllTrackers({ page, pageSize }: PaginationInput): Promise<Paginated<AdminTrackerRow>> {
  const offset = (page - 1) * pageSize
  const db = getDb()
  const [items, totalRows] = await Promise.all([
    db
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
      .offset(offset)
      .limit(pageSize),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(trackers),
  ])

  const total = totalRows[0]?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    items,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
    },
  }
}
