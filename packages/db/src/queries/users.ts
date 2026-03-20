import { eq } from 'drizzle-orm'
import { getDb } from '../client'
import { users } from '../schema'
import type { User, UserCurrency, UserLanguage } from '@0x-flights/shared'
import { normalizeCurrency } from '@0x-flights/shared'

type Row = typeof users.$inferSelect

const toUser = (r: Row): User => ({
  id: r.id,
  telegramId: r.telegramId,
  language: (r.language.trim().toLowerCase() as UserLanguage) || 'en',
  currency: normalizeCurrency(r.currency),
  username: r.username,
  firstName: r.firstName,
  lastName: r.lastName,
  createdAt: r.createdAt,
})

export async function upsertUser(data: {
  telegramId: string
  language?: UserLanguage
  currency?: UserCurrency
  username?: string | null
  firstName?: string | null
  lastName?: string | null
}): Promise<User> {
  const [row] = await getDb()
    .insert(users)
    .values({
      telegramId: data.telegramId,
      language: data.language ?? 'en',
      currency: data.currency ?? 'USD',
      username: data.username ?? null,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
    })
    .onConflictDoUpdate({
      target: users.telegramId,
      set: {
        username: data.username ?? null,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        ...(data.language ? { language: data.language } : {}),
        ...(data.currency ? { currency: data.currency } : {}),
      },
    })
    .returning()
  return toUser(row!)
}

export async function getUserByTelegramId(telegramId: string): Promise<User | null> {
  const [row] = await getDb().select().from(users).where(eq(users.telegramId, telegramId))
  return row ? toUser(row) : null
}

export async function getUserLanguageByTelegramId(telegramId: string): Promise<UserLanguage | null> {
  const [row] = await getDb()
    .select({ language: users.language })
    .from(users)
    .where(eq(users.telegramId, telegramId))
  if (!row) return null
  const lang = row.language.trim().toLowerCase()
  return lang === 'ru' ? 'ru' : 'en'
}

export async function setUserLanguageByTelegramId(
  telegramId: string,
  language: UserLanguage,
): Promise<UserLanguage> {
  await getDb()
    .insert(users)
    .values({ telegramId, language })
    .onConflictDoUpdate({
      target: users.telegramId,
      set: { language },
    })

  return language
}

export async function getUserCurrencyByTelegramId(telegramId: string): Promise<UserCurrency | null> {
  const [row] = await getDb()
    .select({ currency: users.currency })
    .from(users)
    .where(eq(users.telegramId, telegramId))
  if (!row) return null
  return normalizeCurrency(row.currency)
}

export async function setUserCurrencyByTelegramId(
  telegramId: string,
  currency: UserCurrency,
): Promise<UserCurrency> {
  await getDb()
    .insert(users)
    .values({ telegramId, currency })
    .onConflictDoUpdate({
      target: users.telegramId,
      set: { currency },
    })

  return currency
}
