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

export const deleteConfirmKeyboard = (id: number): TelegramBot.InlineKeyboardMarkup => ({
  inline_keyboard: [
    [
      { text: '🗑 Delete', callback_data: `del_confirm:${id}` },
      { text: '⬅️ Keep', callback_data: 'del_cancel' },
    ],
  ],
})
