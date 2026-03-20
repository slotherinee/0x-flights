import { Elysia, t } from 'elysia'
import { validateCreateTracker } from '../validation/create-tracker'
import {
  createTrackerByTelegram,
  listTrackersByTelegramId,
  deleteTrackerByTelegramId,
  getUserLanguageByTelegramId,
  setUserLanguageByTelegramId,
} from '../service'
import { requireTelegramId } from './http-utils'

export const trackerRoutes = new Elysia({ prefix: '/trackers' })

  .get(
    '/language',
    async ({ query, set }) => {
      const telegramId = requireTelegramId(query)
      if (!telegramId) {
        set.status = 400
        return { error: 'telegramId query param required' }
      }

      const language = await getUserLanguageByTelegramId(telegramId)
      return { language }
    },
    { query: t.Object({ telegramId: t.Optional(t.String()) }) },
  )

  .post(
    '/language',
    async ({ body, set }) => {
      const telegramId = (body as Record<string, unknown>)['telegramId']
      const language = (body as Record<string, unknown>)['language']

      if (typeof telegramId !== 'string' || !telegramId.trim()) {
        set.status = 400
        return { error: 'telegramId required' }
      }
      if (language !== 'en' && language !== 'ru') {
        set.status = 400
        return { error: 'language must be en or ru' }
      }

      const saved = await setUserLanguageByTelegramId(telegramId, language)
      return { language: saved }
    },
    { body: t.Any() },
  )

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
