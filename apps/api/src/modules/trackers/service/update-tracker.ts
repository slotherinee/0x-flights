import type { Tracker, UpdateTrackerDto } from '@0x-flights/shared'
import { findUserByTelegramId, updateTrackerForUser } from '../repository'

type UpdateResult =
  | { ok: true; tracker: Tracker }
  | { ok: false; reason: 'USER_NOT_FOUND' | 'TRACKER_NOT_FOUND' }

export async function updateTrackerByTelegramId(
  trackerId: number,
  telegramId: string,
  updates: UpdateTrackerDto,
): Promise<UpdateResult> {
  const user = await findUserByTelegramId(telegramId)
  if (!user) return { ok: false, reason: 'USER_NOT_FOUND' }

  const tracker = await updateTrackerForUser(trackerId, user.id, updates)
  if (!tracker) return { ok: false, reason: 'TRACKER_NOT_FOUND' }

  return { ok: true, tracker }
}
