import { createTrackerSchema } from '@0x-flights/shared'

export function validateCreateTracker(body: unknown) {
  return createTrackerSchema.safeParse(body)
}
