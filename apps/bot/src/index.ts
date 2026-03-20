import TelegramBot from 'node-telegram-bot-api'
import { env } from '@0x-flights/config'
import { closeRedis } from './state/conversation'
import {
  handleStart,
  handleLang,
  handleTrack,
  handleCancel,
  handleList,
  handleDelete,
} from './handlers/commands'
import { handleTextMessage } from './handlers/messages'
import { handleCallbackQuery } from './handlers/callbacks'

const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: true })
console.log('🤖 Bot started (polling)')

bot.onText(/^\/start/, (msg) => handleStart(bot, msg).catch(console.error))
bot.onText(/^\/lang/, (msg) => handleLang(bot, msg).catch(console.error))
bot.onText(/^\/track/, (msg) => handleTrack(bot, msg).catch(console.error))
bot.onText(/^\/cancel/, (msg) => handleCancel(bot, msg).catch(console.error))
bot.onText(/^\/list/, (msg) => handleList(bot, msg).catch(console.error))
bot.onText(/^\/delete/, (msg) => handleDelete(bot, msg).catch(console.error))

bot.on('message', (msg) => {
  if (msg.text?.startsWith('/')) return
  handleTextMessage(bot, msg).catch(console.error)
})

bot.on('callback_query', (q) => handleCallbackQuery(bot, q).catch(console.error))
bot.on('polling_error', (err) => console.error('Polling error:', err.message))

const shutdown = async () => {
  await bot.stopPolling()
  await closeRedis()
  process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
