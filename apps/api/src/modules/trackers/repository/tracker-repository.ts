import { createTracker, getTrackersByUserId, softDeleteTracker } from '@0x-flights/db'
import type { CreateTrackerDto } from '@0x-flights/shared'

export async function createTrackerForUser(userId: number, dto: Omit<CreateTrackerDto, 'telegramId'>) {
  return createTracker(userId, dto)
}

export async function findTrackersByUserId(userId: number) {
  return getTrackersByUserId(userId)
}

export async function softDeleteTrackerForUser(trackerId: number, userId: number) {
  return softDeleteTracker(trackerId, userId)
}
