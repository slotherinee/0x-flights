import type TelegramBot from 'node-telegram-bot-api'
import { clearState, setState } from '../state/conversation'
import { deleteConfirmKeyboard, languageKeyboard } from '../keyboards'
import {
  apiDeleteTracker,
  apiGetUserLanguage,
  apiListTrackers,
  apiSetUserLanguage,
} from '../api-client'
import { examples } from '../utils'

function welcomeText(lang: 'en' | 'ru'): string {
  if (lang === 'ru') {
    return (
      `✈️ *Добро пожаловать в 0x-flights!*\n\n` +
      `Я отслеживаю цены на перелеты и присылаю уведомление при снижении.\n\n` +
      `/track — создать трекер\n` +
      `/list — ваши трекеры\n` +
      `/delete — удалить трекер\n` +
      `/lang — сменить язык RU/EN\n` +
      `/cancel — отменить текущее действие`
    )
  }

  return (
    `✈️ *Welcome to 0x-flights!*\n\n` +
    `I track flight prices and alert you when they drop.\n\n` +
    `/track — create a price alert\n` +
    `/list — view your trackers\n` +
    `/delete — remove a tracker\n` +
    `/lang — toggle RU/EN\n` +
    `/cancel — cancel current action`
  )
}

export async function handleStart(bot: TelegramBot, msg: TelegramBot.Message) {
  const telegramId = String(msg.from!.id)
  const lang = await apiGetUserLanguage(telegramId)

  if (!lang) {
    await clearState(msg.chat.id)
    await setState(msg.chat.id, { step: 'AWAITING_LANGUAGE', intent: 'start' })
    await bot.sendMessage(msg.chat.id, '🌐 Choose your language / Выберите язык:', {
      parse_mode: 'Markdown',
      reply_markup: languageKeyboard,
    })
    return
  }

  await bot.sendMessage(
    msg.chat.id,
    welcomeText(lang),
    { parse_mode: 'Markdown' },
  )
}

export async function handleLang(bot: TelegramBot, msg: TelegramBot.Message) {
  const telegramId = String(msg.from!.id)
  const current = (await apiGetUserLanguage(telegramId)) ?? 'en'
  const next = current === 'ru' ? 'en' : 'ru'
  await apiSetUserLanguage(telegramId, next)

  await bot.sendMessage(
    msg.chat.id,
    next === 'ru'
      ? '🇷🇺 Язык переключен на русский.'
      : '🇬🇧 Language switched to English.',
  )
}

export async function handleTrack(bot: TelegramBot, msg: TelegramBot.Message) {
  const telegramId = String(msg.from!.id)
  const lang = await apiGetUserLanguage(telegramId)

  await clearState(msg.chat.id)
  if (!lang) {
    await setState(msg.chat.id, { step: 'AWAITING_LANGUAGE', intent: 'track' })
    await bot.sendMessage(msg.chat.id, '🌐 Choose your language / Выберите язык:', {
      parse_mode: 'Markdown',
      reply_markup: languageKeyboard,
    })
    return
  }

  await setState(msg.chat.id, { step: 'AWAITING_ORIGIN_CITY', intent: 'track', lang })
  await bot.sendMessage(
    msg.chat.id,
    lang === 'ru'
      ? `Укажите полностью *город отправления*:\nНапример: ${examples('ru')}`
      : `Enter full *origin city* name:\nExample: ${examples('en')}`,
    { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'cancel' }]] } },
  )
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
  const text = trackers
    .map((t, i) => {
      const latestCurrency = t.latestPriceCurrency ?? t.currency
      const price = t.latestPrice ? ` | Latest: *${t.latestPrice} ${latestCurrency}*` : ''
      return `*${i + 1}.* [#${t.id}] ${t.origin}→${t.destination} ${t.departureDate}\n🎯 Alert at ${t.priceThreshold} ${t.currency}${price}`
    })
    .join('\n\n')
  await bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' })
}

export async function handleDelete(bot: TelegramBot, msg: TelegramBot.Message) {
  const telegramId = String(msg.from!.id)
  const trackers = await apiListTrackers(telegramId)
  if (!trackers.length) {
    await bot.sendMessage(msg.chat.id, 'No active trackers to delete.')
    return
  }
  const buttons = trackers.map((t) => [
    {
      text: `#${t.id} ${t.origin}→${t.destination} ${t.departureDate}`,
      callback_data: `del_ask:${t.id}`,
    },
  ])
  buttons.push([{ text: '❌ Cancel', callback_data: 'del_cancel' }])
  await bot.sendMessage(msg.chat.id, '🗑 *Which tracker to delete?*', {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: buttons },
  })
}

export async function handleDeleteAsk(
  bot: TelegramBot,
  chatId: number,
  trackerId: number,
  msgId: number,
) {
  await bot.editMessageText(`Delete tracker #${trackerId}?`, {
    chat_id: chatId,
    message_id: msgId,
    reply_markup: deleteConfirmKeyboard(trackerId),
  })
}

export async function handleDeleteConfirm(
  bot: TelegramBot,
  chatId: number,
  trackerId: number,
  telegramId: string,
  msgId: number,
) {
  try {
    await apiDeleteTracker(trackerId, telegramId)
    await bot.editMessageText(`✅ Tracker #${trackerId} deleted.`, {
      chat_id: chatId,
      message_id: msgId,
    })
  } catch (e) {
    await bot.editMessageText(`❌ Error: ${(e as Error).message}`, {
      chat_id: chatId,
      message_id: msgId,
    })
  }
}
