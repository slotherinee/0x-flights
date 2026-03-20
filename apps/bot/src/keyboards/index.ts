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

export const deleteConfirmKeyboard = (id: number): TelegramBot.InlineKeyboardMarkup => ({
  inline_keyboard: [
    [
      { text: '🗑 Delete', callback_data: `del_confirm:${id}` },
      { text: '⬅️ Keep', callback_data: 'del_cancel' },
    ],
  ],
})
