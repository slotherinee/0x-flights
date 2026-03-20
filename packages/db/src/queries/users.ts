import { eq } from 'drizzle-orm'
import { getDb } from '../client'
import { users } from '../schema'
import type { User } from '@0x-flights/shared'

type Row = typeof users.$inferSelect

const toUser = (r: Row): User => ({
  id: r.id,
  telegramId: r.telegramId,
  username: r.username,
  firstName: r.firstName,
  lastName: r.lastName,
  createdAt: r.createdAt,
})

export async function upsertUser(data: {
  telegramId: string
  username?: string | null
  firstName?: string | null
  lastName?: string | null
}): Promise<User> {
  const [row] = await getDb()
    .insert(users)
    .values({ telegramId: data.telegramId, username: data.username ?? null, firstName: data.firstName ?? null, lastName: data.lastName ?? null })
    .onConflictDoUpdate({
      target: users.telegramId,
      set: { username: data.username ?? null, firstName: data.firstName ?? null, lastName: data.lastName ?? null },
    })
    .returning()
  return toUser(row!)
}

export async function getUserByTelegramId(telegramId: string): Promise<User | null> {
  const [row] = await getDb().select().from(users).where(eq(users.telegramId, telegramId))
  return row ? toUser(row) : null
}
