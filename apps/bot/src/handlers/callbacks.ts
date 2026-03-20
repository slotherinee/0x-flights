import type TelegramBot from 'node-telegram-bot-api'
import { isSupportedCurrency } from '@0x-flights/shared'
import { clearState, getState, setState } from '../state/conversation'
import { currencyKeyboard } from '../keyboards'
import { handleDeleteAsk, handleDeleteConfirm } from './commands'
import { examples } from '../utils'
import { apiGetUserLanguage, apiSetUserCurrency, apiSetUserLanguage } from '../api-client'

export async function handleCallbackQuery(bot: TelegramBot, query: TelegramBot.CallbackQuery) {
  const chatId = query.message?.chat.id
  const msgId = query.message?.message_id
  const data = query.data ?? ''
  const telegramId = String(query.from.id)

  await bot.answerCallbackQuery(query.id)
  if (!chatId || !msgId) return

  if (data === 'lang:en' || data === 'lang:ru') {
    const lang = data === 'lang:ru' ? 'ru' : 'en'
    await apiSetUserLanguage(telegramId, lang)

    const state = await getState(chatId)
    if (state) {
      await setState(chatId, { ...state, step: 'AWAITING_CURRENCY', lang })

      const text =
        lang === 'ru'
          ? '🇷🇺 Язык: *Русский*\n\n💱 Выберите валюту по умолчанию:'
          : '🇬🇧 Language: *English*\n\n💱 Choose default currency:'

      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: msgId,
        parse_mode: 'Markdown',
        reply_markup: currencyKeyboard,
      })
      return
    }

    await clearState(chatId)
    await bot.editMessageText(
      lang === 'ru'
        ? '🇷🇺 Язык сохранен. Используйте /track чтобы создать трекер.'
        : '🇬🇧 Language saved. Use /track to create a tracker.',
      { chat_id: chatId, message_id: msgId },
    )
    return
  }

  if (data.startsWith('curr:')) {
    const state = await getState(chatId)

    const parsed = data.split(':')[1]?.toUpperCase()
    if (!isSupportedCurrency(parsed)) {
      await bot.editMessageText('❌ Unsupported currency.', { chat_id: chatId, message_id: msgId })
      return
    }

    await apiSetUserCurrency(telegramId, parsed)

    if (state?.intent === 'track') {
      await setState(chatId, { ...state, step: 'AWAITING_ORIGIN_CITY', currency: parsed })
      const text =
        (state.lang ?? 'en') === 'ru'
          ? `✅ Валюта: *${parsed}*\n\nУкажите полностью *город отправления*:\nНапример: ${examples('ru')}`
          : `✅ Currency: *${parsed}*\n\nEnter full *origin city* name:\nExample: ${examples('en')}`
      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: msgId,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'cancel' }]] },
      })
      return
    }

    if (state) {
      await clearState(chatId)
    }
    const lang = (state?.lang ?? (await apiGetUserLanguage(telegramId)) ?? 'en')
    await bot.editMessageText(
      lang === 'ru'
        ? `✅ Валюта сохранена: *${parsed}*. Используйте /track чтобы создать трекер.`
        : `✅ Currency saved: *${parsed}*. Use /track to create a tracker.`,
      { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown' },
    )
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
