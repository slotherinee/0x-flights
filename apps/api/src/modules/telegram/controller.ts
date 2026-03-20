import { Elysia, t } from 'elysia'
import { processWebhook } from './service.ts'

export const telegramRoutes = new Elysia({ prefix: '/telegram' }).post(
  '/webhook',
  async ({ body }) => {
    await processWebhook(body)
    return { ok: true }
  },
  { body: t.Any() },
)
