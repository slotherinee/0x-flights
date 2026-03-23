import { Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { env, getRedisConfig } from '@0x-flights/config'
import { QUEUE_NAMES, type NotificationJob } from '@0x-flights/shared'
import type TelegramBot from 'node-telegram-bot-api'
import { createJobProcessor } from './process-job'

export function createNotificationWorker(bot: TelegramBot): Worker<NotificationJob> {
  const redis = new Redis(getRedisConfig())

  const worker = new Worker<NotificationJob>(QUEUE_NAMES.NOTIFICATIONS, createJobProcessor(bot), {
    connection: getRedisConfig(),
    concurrency: 1,
    limiter: {
      max: env.NOTIFICATION_RATE_LIMIT,
      duration: 1000,
    },
  })

  worker.on('completed', (job) => {
    console.log(`[NotifWorker] Job ${job.id} done`)
    redis.incr('worker-notifications:jobs-completed').catch(() => {})
    redis.set('worker-notifications:last-run', new Date().toISOString()).catch(() => {})
  })
  worker.on('failed', (job, err) => {
    console.error(`[NotifWorker] Job ${job?.id} failed:`, err.message)
    redis.incr('worker-notifications:jobs-failed').catch(() => {})
  })
  worker.on('error', (err) => console.error('[NotifWorker] Error:', err))

  return worker
}
