import TelegramBot from 'node-telegram-bot-api'
import { env } from '@0x-flights/config'
import { createNotificationWorker } from './core/create-worker'

const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: false })
const worker = createNotificationWorker(bot)

console.log(`[NotifWorker] Started — rate limit: ${env.NOTIFICATION_RATE_LIMIT} msg/sec`)

const shutdown = async () => {
  console.log('[NotifWorker] Shutting down...')
  await worker.close()
  process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
