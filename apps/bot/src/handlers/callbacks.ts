import type TelegramBot from 'node-telegram-bot-api'
import { getState, setState, clearState } from '../state/conversation'
import { handleDeleteAsk, handleDeleteConfirm } from './commands'

export async function handleCallbackQuery(bot: TelegramBot, query: TelegramBot.CallbackQuery) {
  const chatId = query.message?.chat.id
  const msgId = query.message?.message_id
  const data = query.data ?? ''
  const telegramId = String(query.from.id)

  await bot.answerCallbackQuery(query.id)
  if (!chatId || !msgId) return

  // trip type buttons (inside /track flow)
  if (data === 'trip:round') {
    const state = await getState(chatId)
    if (!state) return
    await setState(chatId, { ...state, step: 'AWAITING_RETURN_DATE', isRoundTrip: true })
    await bot.editMessageText('📅 Enter *return date* (YYYY-MM-DD):',
      { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown' })
    return
  }

  if (data === 'trip:one') {
    const state = await getState(chatId)
    if (!state) return
    await setState(chatId, { ...state, step: 'AWAITING_THRESHOLD', isRoundTrip: false })
    await bot.editMessageText('💰 Enter *max price* (e.g. `350`):',
      { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown' })
    return
  }

  // delete flow
  if (data.startsWith('del_ask:')) {
    await handleDeleteAsk(bot, chatId, Number(data.split(':')[1]), msgId)
    return
  }
  if (data.startsWith('del_confirm:')) {
    await handleDeleteConfirm(bot, chatId, Number(data.split(':')[1]), telegramId, msgId)
    return
  }
  if (data === 'del_cancel') {
    await bot.editMessageText('❌ Cancelled.', { chat_id: chatId, message_id: msgId })
    return
  }

  // global cancel
  if (data === 'cancel') {
    await clearState(chatId)
    await bot.editMessageText('❌ Cancelled.', { chat_id: chatId, message_id: msgId })
  }
}
