import { createTracker, getTrackersByUserId, softDeleteTracker, updateTracker } from '@0x-flights/db'
import type { CreateTrackerDto, UpdateTrackerDto } from '@0x-flights/shared'

export async function createTrackerForUser(
  userId: number,
  dto: Omit<CreateTrackerDto, 'telegramId'>,
) {
  return createTracker(userId, dto)
}

export async function findTrackersByUserId(userId: number) {
  return getTrackersByUserId(userId)
}

export async function updateTrackerForUser(trackerId: number, userId: number, updates: UpdateTrackerDto) {
  return updateTracker(trackerId, userId, updates)
}

export async function softDeleteTrackerForUser(trackerId: number, userId: number) {
  return softDeleteTracker(trackerId, userId)
}
