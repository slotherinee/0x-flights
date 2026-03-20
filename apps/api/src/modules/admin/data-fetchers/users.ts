import { getDb } from '@0x-flights/db'
import { users, trackers } from '@0x-flights/db'
import { eq, desc, sql } from 'drizzle-orm'
import type { AdminUserRow, Paginated, PaginationInput } from '../types'

export async function getAllUsers({ page, pageSize }: PaginationInput): Promise<Paginated<AdminUserRow>> {
  const offset = (page - 1) * pageSize
  const db = getDb()
  const [items, totalRows] = await Promise.all([
    db
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
      .offset(offset)
      .limit(pageSize),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(users),
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
