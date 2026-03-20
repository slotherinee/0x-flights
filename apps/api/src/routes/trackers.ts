import { Elysia, t } from 'elysia'
import { upsertUser, getUserByTelegramId, createTracker, getTrackersByUserId, softDeleteTracker } from '@0x-flights/db'
import { createTrackerSchema } from '@0x-flights/shared'

export const trackerRoutes = new Elysia({ prefix: '/trackers' })

  // POST /trackers
  .post('/', async ({ body, set }) => {
    const parsed = createTrackerSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 400
      return { error: 'Validation failed', details: parsed.error.flatten() }
    }
    const { telegramId, ...dto } = parsed.data
    const user = await upsertUser({ telegramId })
    const tracker = await createTracker(user.id, dto)
    set.status = 201
    return tracker
  }, { body: t.Any() })

  // GET /trackers?telegramId=xxx
  .get('/', async ({ query, set }) => {
    const telegramId = (query as Record<string, string>)['telegramId']
    if (!telegramId) {
      set.status = 400
      return { error: 'telegramId query param required' }
    }
    const user = await getUserByTelegramId(telegramId)
    if (!user) return []
    return getTrackersByUserId(user.id)
  }, { query: t.Object({ telegramId: t.Optional(t.String()) }) })

  // DELETE /trackers/:id?telegramId=xxx
  .delete('/:id', async ({ params, query, set }) => {
    const telegramId = (query as Record<string, string>)['telegramId']
    if (!telegramId) {
      set.status = 400
      return { error: 'telegramId query param required' }
    }
    const user = await getUserByTelegramId(telegramId)
    if (!user) { set.status = 404; return { error: 'User not found' } }

    const deleted = await softDeleteTracker(Number(params.id), user.id)
    if (!deleted) { set.status = 404; return { error: 'Tracker not found' } }
    return { success: true }
  }, { query: t.Object({ telegramId: t.Optional(t.String()) }) })
