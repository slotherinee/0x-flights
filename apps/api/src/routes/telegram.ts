import { Elysia, t } from 'elysia'
import { upsertUser } from '@0x-flights/db'

// Receives Telegram updates, persists user, returns 200 immediately.
// Bot service handles the actual command logic separately.
export const telegramRoutes = new Elysia({ prefix: '/telegram' }).post(
  '/webhook',
  async ({ body }) => {
    const update = body as {
      message?: {
        from?: {
          id: number
          first_name: string
          last_name?: string
          username?: string
          is_bot?: boolean
        }
      }
      callback_query?: {
        from: { id: number; first_name: string; last_name?: string; username?: string }
      }
    }

    const from = update.message?.from ?? update.callback_query?.from
    if (from && !('is_bot' in from && from.is_bot)) {
      await upsertUser({
        telegramId: String(from.id),
        username: from.username ?? null,
        firstName: from.first_name ?? null,
        lastName: from.last_name ?? null,
      }).catch(() => {})
    }

    return { ok: true }
  },
  { body: t.Any() },
)
