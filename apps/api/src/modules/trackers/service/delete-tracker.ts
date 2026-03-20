import { findUserByTelegramId, softDeleteTrackerForUser } from '../repository'
import type { DeleteTrackerResult } from '../types'

export async function deleteTrackerByTelegramId(
  trackerId: number,
  telegramId: string,
): Promise<DeleteTrackerResult> {
  const user = await findUserByTelegramId(telegramId)
  if (!user) return { ok: false, reason: 'USER_NOT_FOUND' }

  const deleted = await softDeleteTrackerForUser(trackerId, user.id)
  if (!deleted) return { ok: false, reason: 'TRACKER_NOT_FOUND' }

  return { ok: true }
}
