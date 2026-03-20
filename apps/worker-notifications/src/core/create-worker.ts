import { Worker } from 'bullmq'
import { env, getRedisConfig } from '@0x-flights/config'
import { QUEUE_NAMES, type NotificationJob } from '@0x-flights/shared'
import type TelegramBot from 'node-telegram-bot-api'
import { createJobProcessor } from './process-job'

export function createNotificationWorker(bot: TelegramBot): Worker<NotificationJob> {
  const worker = new Worker<NotificationJob>(QUEUE_NAMES.NOTIFICATIONS, createJobProcessor(bot), {
    connection: getRedisConfig(),
    concurrency: 1,
    limiter: {
      max: env.NOTIFICATION_RATE_LIMIT,
      duration: 1000,
    },
  })

  worker.on('completed', (job) => console.log(`[NotifWorker] Job ${job.id} done`))
  worker.on('failed', (job, err) =>
    console.error(`[NotifWorker] Job ${job?.id} failed:`, err.message),
  )
  worker.on('error', (err) => console.error('[NotifWorker] Error:', err))

  return worker
}
