import type TelegramBot from 'node-telegram-bot-api'
import { clearState, setState } from '../state/conversation'
import { cancelKeyboard, deleteConfirmKeyboard } from '../keyboards'
import { apiListTrackers, apiDeleteTracker } from '../api-client'

export async function handleStart(bot: TelegramBot, msg: TelegramBot.Message) {
  await bot.sendMessage(msg.chat.id,
    `✈️ *Welcome to 0x-flights!*\n\n` +
    `I track flight prices and alert you when they drop.\n\n` +
    `/track — create a price alert\n` +
    `/list — view your trackers\n` +
    `/delete — remove a tracker\n` +
    `/cancel — cancel current action`,
    { parse_mode: 'Markdown' })
}

export async function handleTrack(bot: TelegramBot, msg: TelegramBot.Message) {
  await clearState(msg.chat.id)
  await setState(msg.chat.id, { step: 'AWAITING_ORIGIN' })
  await bot.sendMessage(msg.chat.id,
    '🛫 Enter *origin* airport code (e.g. `JFK`):',
    { parse_mode: 'Markdown', reply_markup: cancelKeyboard })
}

export async function handleCancel(bot: TelegramBot, msg: TelegramBot.Message) {
  await clearState(msg.chat.id)
  await bot.sendMessage(msg.chat.id, '❌ Cancelled.')
}

export async function handleList(bot: TelegramBot, msg: TelegramBot.Message) {
  const telegramId = String(msg.from!.id)
  const trackers = await apiListTrackers(telegramId)
  if (!trackers.length) {
    await bot.sendMessage(msg.chat.id, 'No active trackers. Use /track to create one.')
    return
  }
  const text = trackers.map((t, i) => {
    const price = t.latestPrice ? ` | Latest: *${t.latestPrice} ${t.currency}*` : ''
    return `*${i + 1}.* [#${t.id}] ${t.origin}→${t.destination} ${t.departureDate}\n🎯 Alert at ${t.priceThreshold} ${t.currency}${price}`
  }).join('\n\n')
  await bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' })
}

export async function handleDelete(bot: TelegramBot, msg: TelegramBot.Message) {
  const telegramId = String(msg.from!.id)
  const trackers = await apiListTrackers(telegramId)
  if (!trackers.length) {
    await bot.sendMessage(msg.chat.id, 'No active trackers to delete.')
    return
  }
  const buttons = trackers.map((t) => ([{
    text: `#${t.id} ${t.origin}→${t.destination} ${t.departureDate}`,
    callback_data: `del_ask:${t.id}`,
  }]))
  buttons.push([{ text: '❌ Cancel', callback_data: 'del_cancel' }])
  await bot.sendMessage(msg.chat.id, '🗑 *Which tracker to delete?*',
    { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } })
}

export async function handleDeleteAsk(bot: TelegramBot, chatId: number, trackerId: number, msgId: number) {
  await bot.editMessageText(`Delete tracker #${trackerId}?`, {
    chat_id: chatId, message_id: msgId,
    reply_markup: deleteConfirmKeyboard(trackerId),
  })
}

export async function handleDeleteConfirm(bot: TelegramBot, chatId: number, trackerId: number, telegramId: string, msgId: number) {
  try {
    await apiDeleteTracker(trackerId, telegramId)
    await bot.editMessageText(`✅ Tracker #${trackerId} deleted.`, { chat_id: chatId, message_id: msgId })
  } catch (e) {
    await bot.editMessageText(`❌ Error: ${(e as Error).message}`, { chat_id: chatId, message_id: msgId })
  }
}
