import { eq, and, gte, desc, sql } from 'drizzle-orm'
import { getDb } from '../client'
import { trackers } from '../schema'
import type { Tracker, TrackerResponse, CreateTrackerDto } from '@0x-flights/shared'

type Row = typeof trackers.$inferSelect

const toTracker = (r: Row): Tracker => ({
  id: r.id,
  userId: r.userId,
  origin: r.origin.trim(),
  destination: r.destination.trim(),
  departureDate: r.departureDate,
  returnDate: r.returnDate ?? null,
  priceThreshold: Number(r.priceThreshold),
  currency: r.currency.trim(),
  adults: r.adults,
  isActive: r.isActive,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
})

export async function createTracker(
  userId: number,
  dto: Omit<CreateTrackerDto, 'telegramId'>,
): Promise<Tracker> {
  const [row] = await getDb()
    .insert(trackers)
    .values({
      userId,
      origin: dto.origin.toUpperCase(),
      destination: dto.destination.toUpperCase(),
      departureDate: dto.departureDate,
      returnDate: dto.returnDate ?? null,
      priceThreshold: String(dto.priceThreshold),
      currency: (dto.currency ?? 'USD').toUpperCase(),
      adults: dto.adults ?? 1,
    })
    .returning()
  return toTracker(row!)
}

export async function getTrackersByUserId(userId: number): Promise<TrackerResponse[]> {
  const rows = await getDb()
    .select({
      tracker: trackers,
      latestPrice: sql<string | null>`(
        SELECT p.price::text FROM prices p
        WHERE p.tracker_id = ${trackers.id}
        ORDER BY p.fetched_at DESC LIMIT 1
      )`,
    })
    .from(trackers)
    .where(and(eq(trackers.userId, userId), eq(trackers.isActive, true)))
    .orderBy(desc(trackers.createdAt))

  return rows.map(({ tracker, latestPrice }) => ({
    ...toTracker(tracker),
    latestPrice: latestPrice != null ? Number(latestPrice) : null,
  }))
}

export async function getActiveTrackers(): Promise<Tracker[]> {
  const today = new Date().toISOString().slice(0, 10)
  const rows = await getDb()
    .select()
    .from(trackers)
    .where(and(eq(trackers.isActive, true), gte(trackers.departureDate, today)))
  return rows.map(toTracker)
}

export async function softDeleteTracker(id: number, userId: number): Promise<boolean> {
  const result = await getDb()
    .update(trackers)
    .set({ isActive: false })
    .where(and(eq(trackers.id, id), eq(trackers.userId, userId)))
    .returning({ id: trackers.id })
  return result.length > 0
}
