import type TelegramBot from 'node-telegram-bot-api'
import type { Job } from 'bullmq'
import { createNotification, markNotificationsSent } from '@0x-flights/db'
import type { NotificationJob } from '@0x-flights/shared'
import { buildNotificationMessage } from './build-message'

export function createJobProcessor(bot: TelegramBot) {
  return async function processJob(job: Job<NotificationJob>): Promise<void> {
    const data = job.data
    const message = buildNotificationMessage(data)

    const notification = await createNotification({
      trackerId: data.trackerId,
      userId: data.userId,
      price: data.price,
      currency: data.currency,
      message,
    })

    await bot.sendMessage(data.telegramId, message, { parse_mode: 'Markdown' })
    await markNotificationsSent([notification.id])

    console.log(`[NotifWorker] Sent to ${data.telegramId}: ${data.origin}->${data.destination} @ ${data.price} ${data.currency}`)
  }
}
