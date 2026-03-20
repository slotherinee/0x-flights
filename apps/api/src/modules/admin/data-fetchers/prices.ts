import { getDb } from '@0x-flights/db'
import { trackers, prices } from '@0x-flights/db'
import { eq, desc } from 'drizzle-orm'
import type { AdminPriceRow } from '../types'

export async function getRecentPrices(): Promise<AdminPriceRow[]> {
  const db = getDb()
  return db
    .select({
      trackerId: prices.trackerId,
      origin: trackers.origin,
      destination: trackers.destination,
      price: prices.price,
      currency: prices.currency,
      source: prices.source,
      fetchedAt: prices.fetchedAt,
    })
    .from(prices)
    .leftJoin(trackers, eq(prices.trackerId, trackers.id))
    .orderBy(desc(prices.fetchedAt))
    .limit(30)
}
