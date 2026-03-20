import { findUserByTelegramId, findTrackersByUserId } from '../repository'

export async function listTrackersByTelegramId(telegramId: string) {
  const user = await findUserByTelegramId(telegramId)
  if (!user) return []
  return findTrackersByUserId(user.id)
}
