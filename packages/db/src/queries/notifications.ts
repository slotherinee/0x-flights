import { inArray } from 'drizzle-orm'
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

export async function markNotificationsSent(ids: number[]): Promise<void> {
  if (!ids.length) return
  await getDb()
    .update(notifications)
    .set({ sentAt: new Date() })
    .where(inArray(notifications.id, ids))
}
