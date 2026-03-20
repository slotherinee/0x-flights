import type { CreateTrackerDto } from '@0x-flights/shared'
import { upsertUserByTelegramId, createTrackerForUser } from '../repository'

export async function createTrackerByTelegram(dto: CreateTrackerDto) {
  const { telegramId, ...trackerDto } = dto
  const user = await upsertUserByTelegramId(telegramId)
  return createTrackerForUser(user.id, trackerDto)
}
