import type TelegramBot from 'node-telegram-bot-api'
import type { Job } from 'bullmq'
import {
  createNotification,
  getUserLanguageByTelegramId,
  markNotificationsSent,
} from '@0x-flights/db'
import {
  buildLocalizedNotificationMessage,
  normalizeLanguage,
  type NotificationJob,
} from '@0x-flights/shared'

export function createJobProcessor(bot: TelegramBot) {
  return async function processJob(job: Job<NotificationJob>): Promise<void> {
    const data = job.data
    const userLang = await getUserLanguageByTelegramId(data.telegramId)
    const message = buildLocalizedNotificationMessage(data, normalizeLanguage(userLang))

    const notification = await createNotification({
      trackerId: data.trackerId,
      userId: data.userId,
      price: data.price,
      currency: data.currency,
      message,
    })

    await bot.sendMessage(data.telegramId, message, { parse_mode: 'Markdown', disable_web_page_preview: true })
    await markNotificationsSent([notification.id])

    console.log(
      `[NotifWorker] Sent to ${data.telegramId}: ${data.origin}->${data.destination} @ ${data.price} ${data.currency}`,
    )
  }
}
