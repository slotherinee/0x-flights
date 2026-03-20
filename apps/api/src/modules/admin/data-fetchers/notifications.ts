import { getDb } from '@0x-flights/db'
import { users, trackers, notifications } from '@0x-flights/db'
import { eq, desc } from 'drizzle-orm'
import type { AdminNotificationRow } from '../types'

export async function getRecentNotifications(): Promise<AdminNotificationRow[]> {
  const db = getDb()
  return db
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
    .limit(30)
}
