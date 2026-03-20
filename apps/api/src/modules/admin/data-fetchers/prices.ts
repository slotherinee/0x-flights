import { getDb } from '@0x-flights/db'
import { trackers, prices } from '@0x-flights/db'
import { eq, desc, sql } from 'drizzle-orm'
import type { AdminPriceRow, Paginated, PaginationInput } from '../types'

export async function getRecentPrices({ page, pageSize }: PaginationInput): Promise<Paginated<AdminPriceRow>> {
  const offset = (page - 1) * pageSize
  const db = getDb()
  const [items, totalRows] = await Promise.all([
    db
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
      .offset(offset)
      .limit(pageSize),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(prices),
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
