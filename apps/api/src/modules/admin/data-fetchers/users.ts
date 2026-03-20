import { getDb } from '@0x-flights/db'
import { users, trackers } from '@0x-flights/db'
import { eq, desc, sql } from 'drizzle-orm'
import type { AdminUserRow } from '../types'

export async function getAllUsers(): Promise<AdminUserRow[]> {
  const db = getDb()
  return db
    .select({
      id: users.id,
      telegramId: users.telegramId,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      createdAt: users.createdAt,
      trackerCount: sql<number>`cast(count(${trackers.id}) as int)`,
      activeTrackerCount: sql<number>`cast(sum(case when ${trackers.isActive} then 1 else 0 end) as int)`,
    })
    .from(users)
    .leftJoin(trackers, eq(trackers.userId, users.id))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt))
    .limit(200)
}
