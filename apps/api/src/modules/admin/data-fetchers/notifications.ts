import { getDb } from '@0x-flights/db'
import { users, trackers, notifications } from '@0x-flights/db'
import { eq, desc, sql } from 'drizzle-orm'
import type { AdminNotificationRow, Paginated, PaginationInput } from '../types'

export async function getRecentNotifications({
  page,
  pageSize,
}: PaginationInput): Promise<Paginated<AdminNotificationRow>> {
  const offset = (page - 1) * pageSize
  const db = getDb()
  const [items, totalRows] = await Promise.all([
    db
    .select({
      id: notifications.id,
      telegramId: users.telegramId,
      username: users.username,
      origin: trackers.origin,
      destination: trackers.destination,
      price: notifications.price,
      currency: notifications.currency,
      sentAt: notifications.sentAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .leftJoin(users, eq(notifications.userId, users.id))
    .leftJoin(trackers, eq(notifications.trackerId, trackers.id))
    .orderBy(desc(notifications.createdAt))
      .offset(offset)
      .limit(pageSize),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(notifications),
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
