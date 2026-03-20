import { getDb } from '@0x-flights/db'
import { users, trackers, prices, notifications } from '@0x-flights/db'
import { eq, count } from 'drizzle-orm'
import type { AdminStats } from '../types'

export async function getStats(): Promise<AdminStats> {
  const db = getDb()
  const [[u], [t], [p], [n]] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(trackers).where(eq(trackers.isActive, true)),
    db.select({ count: count() }).from(prices),
    db.select({ count: count() }).from(notifications),
  ])

  return {
    users: u?.count ?? 0,
    activeTrackers: t?.count ?? 0,
    priceChecks: p?.count ?? 0,
    notifications: n?.count ?? 0,
  }
}
