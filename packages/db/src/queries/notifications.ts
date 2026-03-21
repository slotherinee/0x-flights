import { inArray, isNotNull, desc, and } from 'drizzle-orm'
import { getDb } from '../client'
import { notifications } from '../schema'
import type { Notification } from '@0x-flights/shared'

export async function createNotification(data: {
  trackerId: number
  userId: number
  price: number
  currency: string
  message: string
}): Promise<Notification> {
  const [row] = await getDb()
    .insert(notifications)
    .values({
      trackerId: data.trackerId,
      userId: data.userId,
      price: String(data.price),
      currency: data.currency,
      message: data.message,
    })
    .returning()
  const r = row!
  return {
    id: r.id,
    trackerId: r.trackerId,
    userId: r.userId,
    price: Number(r.price),
    currency: r.currency.trim(),
    message: r.message,
    sentAt: r.sentAt ?? null,
    createdAt: r.createdAt,
  }
}

export async function getLastSentNotificationPrices(
  trackerIds: number[],
): Promise<Map<number, number>> {
  if (!trackerIds.length) return new Map()
  const rows = await getDb()
    .select({ trackerId: notifications.trackerId, price: notifications.price })
    .from(notifications)
    .where(and(inArray(notifications.trackerId, trackerIds), isNotNull(notifications.sentAt)))
    .orderBy(desc(notifications.sentAt))
  const map = new Map<number, number>()
  for (const row of rows) {
    if (!map.has(row.trackerId)) {
      map.set(row.trackerId, Number(row.price))
    }
  }
  return map
}

export async function markNotificationsSent(ids: number[]): Promise<void> {
  if (!ids.length) return
  await getDb()
    .update(notifications)
    .set({ sentAt: new Date() })
    .where(inArray(notifications.id, ids))
}
