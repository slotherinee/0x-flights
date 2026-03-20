/**
 * Notification Worker
 *
 * Consumes the BullMQ "notifications" queue.
 * Rate limit: max NOTIFICATION_RATE_LIMIT messages per second (default 10).
 * Each job: persist notification to DB → send Telegram message → mark sent.
 */
import { Worker, type Job } from 'bullmq'
import TelegramBot from 'node-telegram-bot-api'
import { env, getRedisConfig } from '@0x-flights/config'
import { createNotification, markNotificationsSent } from '@0x-flights/db'
import { QUEUE_NAMES, type NotificationJob } from '@0x-flights/shared'

const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: false })

function buildMessage(job: NotificationJob): string {
  const trip = job.departureDate
  return (
    `🚨 *Price Alert!*\n\n` +
    `✈️ *${job.origin} → ${job.destination}*\n` +
    `📅 ${trip}\n` +
    `💰 Current price: *${job.price} ${job.currency}*\n` +
    `🎯 Your threshold: ${job.threshold} ${job.currency}\n\n` +
    `Book now before it goes back up!`
  )
}

async function processJob(job: Job<NotificationJob>): Promise<void> {
  const data = job.data
  const message = buildMessage(data)

  // 1. Persist to DB
  const notification = await createNotification({
    trackerId: data.trackerId,
    userId: data.userId,
    price: data.price,
    currency: data.currency,
    message,
  })

  // 2. Send via Telegram
  await bot.sendMessage(data.telegramId, message, { parse_mode: 'Markdown' })

  // 3. Mark as sent
  await markNotificationsSent([notification.id])

  console.log(`[NotifWorker] Sent to ${data.telegramId}: ${data.origin}→${data.destination} @ ${data.price} ${data.currency}`)
}

const worker = new Worker<NotificationJob>(
  QUEUE_NAMES.NOTIFICATIONS,
  processJob,
  {
    connection: getRedisConfig(),
    // concurrency=1 + limiter gives us clean rate limiting
    concurrency: 1,
    limiter: {
      max: env.NOTIFICATION_RATE_LIMIT,
      duration: 1000,
    },
  },
)

worker.on('completed', (job) => console.log(`[NotifWorker] Job ${job.id} done`))
worker.on('failed', (job, err) => console.error(`[NotifWorker] Job ${job?.id} failed:`, err.message))
worker.on('error', (err) => console.error('[NotifWorker] Error:', err))

console.log(`[NotifWorker] Started — rate limit: ${env.NOTIFICATION_RATE_LIMIT} msg/sec`)

const shutdown = async () => {
  console.log('[NotifWorker] Shutting down...')
  await worker.close()
  process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
