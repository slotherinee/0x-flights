import { Elysia, t } from 'elysia'
import { validateCreateTracker } from '../validation/create-tracker'
import {
  createTrackerByTelegram,
  listTrackersByTelegramId,
  deleteTrackerByTelegramId,
} from '../service'
import { requireTelegramId } from './http-utils'

export const trackerRoutes = new Elysia({ prefix: '/trackers' })

  .post(
    '/',
    async ({ body, set }) => {
      const parsed = validateCreateTracker(body)
      if (!parsed.success) {
        set.status = 400
        return { error: 'Validation failed', details: parsed.error.flatten() }
      }

      const tracker = await createTrackerByTelegram(parsed.data)
      set.status = 201
      return tracker
    },
    { body: t.Any() },
  )

  .get(
    '/',
    async ({ query, set }) => {
      const telegramId = requireTelegramId(query)
      if (!telegramId) {
        set.status = 400
        return { error: 'telegramId query param required' }
      }

      return listTrackersByTelegramId(telegramId)
    },
    { query: t.Object({ telegramId: t.Optional(t.String()) }) },
  )

  .delete(
    '/:id',
    async ({ params, query, set }) => {
      const telegramId = requireTelegramId(query)
      if (!telegramId) {
        set.status = 400
        return { error: 'telegramId query param required' }
      }

      const result = await deleteTrackerByTelegramId(Number(params.id), telegramId)
      if (!result.ok) {
        set.status = 404
        return {
          error: result.reason === 'USER_NOT_FOUND' ? 'User not found' : 'Tracker not found',
        }
      }

      return { success: true }
    },
    { query: t.Object({ telegramId: t.Optional(t.String()) }) },
  )
