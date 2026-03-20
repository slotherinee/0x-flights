import { getDb } from '../client'
import { prices } from '../schema'
import type { Price } from '@0x-flights/shared'

type Row = typeof prices.$inferSelect

const toPrice = (r: Row): Price => ({
  id: r.id,
  trackerId: r.trackerId,
  price: Number(r.price),
  currency: r.currency.trim(),
  source: r.source,
  fetchedAt: r.fetchedAt,
})

export async function insertPricesBatch(
  records: { trackerId: number; price: number; currency: string; source?: string }[],
): Promise<void> {
  if (!records.length) return
  await getDb().insert(prices).values(
    records.map((r) => ({
      trackerId: r.trackerId,
      price: String(r.price),
      currency: r.currency,
      source: r.source ?? 'stub',
    })),
  )
}
