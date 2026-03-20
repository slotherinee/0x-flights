import { upsertUser } from '@0x-flights/db'

export async function upsertTelegramUser(data: {
  telegramId: string
  username?: string | null
  firstName?: string | null
  lastName?: string | null
}) {
  return upsertUser(data)
}
