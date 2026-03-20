import { upsertUser, getUserByTelegramId } from '@0x-flights/db'

export async function upsertUserByTelegramId(telegramId: string) {
  return upsertUser({ telegramId })
}

export async function findUserByTelegramId(telegramId: string) {
  return getUserByTelegramId(telegramId)
}
