import type TelegramBot from 'node-telegram-bot-api'

export const cancelKeyboard: TelegramBot.InlineKeyboardMarkup = {
  inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'cancel' }]],
}

export const languageKeyboard: TelegramBot.InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '🇬🇧 EN', callback_data: 'lang:en' },
      { text: '🇷🇺 RU', callback_data: 'lang:ru' },
    ],
  ],
}

export const currencyKeyboard: TelegramBot.InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: 'USD', callback_data: 'curr:USD' },
      { text: 'EUR', callback_data: 'curr:EUR' },
    ],
    [
      { text: 'RUB', callback_data: 'curr:RUB' },
      { text: 'GBP', callback_data: 'curr:GBP' },
    ],
  ],
}

export const tripTypeKeyboard = (lang: 'en' | 'ru'): TelegramBot.InlineKeyboardMarkup => ({
  inline_keyboard: [
    [
      { text: lang === 'ru' ? '✈️ В одну сторону' : '✈️ One-way', callback_data: 'trip:oneway' },
      { text: lang === 'ru' ? '🔄 Туда-обратно' : '🔄 Round-trip', callback_data: 'trip:roundtrip' },
    ],
    [{ text: '❌ Cancel', callback_data: 'cancel' }],
  ],
})

export const passengersKeyboard = (lang: 'en' | 'ru'): TelegramBot.InlineKeyboardMarkup => ({
  inline_keyboard: [
    [
      { text: '1', callback_data: 'pax:1' },
      { text: '2', callback_data: 'pax:2' },
      { text: '3', callback_data: 'pax:3' },
      { text: '4', callback_data: 'pax:4' },
    ],
    [
      { text: '5', callback_data: 'pax:5' },
      { text: '6', callback_data: 'pax:6' },
      { text: '7', callback_data: 'pax:7' },
      { text: '8', callback_data: 'pax:8' },
    ],
    [{ text: '❌ Cancel', callback_data: 'cancel' }],
  ],
})

export const deleteConfirmKeyboard = (id: number): TelegramBot.InlineKeyboardMarkup => ({
  inline_keyboard: [
    [
      { text: '🗑 Delete', callback_data: `del_confirm:${id}` },
      { text: '⬅️ Keep', callback_data: 'del_cancel' },
    ],
  ],
})
