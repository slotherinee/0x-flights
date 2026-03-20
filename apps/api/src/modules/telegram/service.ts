import { upsertTelegramUser } from './repository.ts'
import { TelegramUpdate } from './types'

export async function processWebhook(update: unknown): Promise<void> {
  const parsed = update as TelegramUpdate
  const from = parsed.message?.from ?? parsed.callback_query?.from
  if (!from || ('is_bot' in from && from.is_bot)) return

  await upsertTelegramUser({
    telegramId: String(from.id),
    username: from.username ?? null,
    firstName: from.first_name ?? null,
    lastName: from.last_name ?? null,
  }).catch(() => {})
}
