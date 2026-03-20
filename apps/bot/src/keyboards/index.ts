import type TelegramBot from 'node-telegram-bot-api'

export const cancelKeyboard: TelegramBot.InlineKeyboardMarkup = {
  inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'cancel' }]],
}

export const roundTripKeyboard: TelegramBot.InlineKeyboardMarkup = {
  inline_keyboard: [[
    { text: '🔁 Round trip', callback_data: 'trip:round' },
    { text: '➡️ One way', callback_data: 'trip:one' },
  ]],
}

export const deleteConfirmKeyboard = (id: number): TelegramBot.InlineKeyboardMarkup => ({
  inline_keyboard: [[
    { text: '🗑 Delete', callback_data: `del_confirm:${id}` },
    { text: '⬅️ Keep', callback_data: 'del_cancel' },
  ]],
})
