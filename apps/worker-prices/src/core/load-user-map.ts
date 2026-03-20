import { getDb, users } from '@0x-flights/db'

export async function loadUserTelegramMap(): Promise<Map<number, string>> {
  const rows = await getDb().select({ id: users.id, telegramId: users.telegramId }).from(users)
  return new Map(rows.map((row) => [row.id, row.telegramId]))
}
