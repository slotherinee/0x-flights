import type TelegramBot from 'node-telegram-bot-api'
import { getState, setState, clearState } from '../state/conversation'
import { cancelKeyboard, roundTripKeyboard } from '../keyboards'
import { apiCreateTracker } from '../api-client'

const IATA = /^[A-Z]{3}$/
const DATE = /^\d{4}-\d{2}-\d{2}$/

export async function handleTextMessage(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id
  const state = await getState(chatId)
  if (!state) return

  const text = (msg.text ?? '').trim()

  switch (state.step) {
    case 'AWAITING_ORIGIN': {
      const val = text.toUpperCase()
      if (!IATA.test(val)) {
        await bot.sendMessage(chatId, '❌ Invalid code. Use 3 letters, e.g. `JFK`',
          { parse_mode: 'Markdown', reply_markup: cancelKeyboard })
        return
      }
      await setState(chatId, { ...state, step: 'AWAITING_DESTINATION', origin: val })
      await bot.sendMessage(chatId, `✅ Origin: *${val}*\n\n🛬 Enter *destination* code:`,
        { parse_mode: 'Markdown', reply_markup: cancelKeyboard })
      break
    }

    case 'AWAITING_DESTINATION': {
      const val = text.toUpperCase()
      if (!IATA.test(val)) {
        await bot.sendMessage(chatId, '❌ Invalid code.', { reply_markup: cancelKeyboard })
        return
      }
      await setState(chatId, { ...state, step: 'AWAITING_DATE', destination: val })
      await bot.sendMessage(chatId, `✅ Destination: *${val}*\n\n📅 Enter *departure date* (YYYY-MM-DD):`,
        { parse_mode: 'Markdown', reply_markup: cancelKeyboard })
      break
    }

    case 'AWAITING_DATE': {
      if (!DATE.test(text)) {
        await bot.sendMessage(chatId, '❌ Invalid date. Use `YYYY-MM-DD`',
          { parse_mode: 'Markdown', reply_markup: cancelKeyboard })
        return
      }
      await setState(chatId, { ...state, step: 'AWAITING_RETURN_DATE', departureDate: text })
      await bot.sendMessage(chatId, `✅ Departure: *${text}*\n\nRound trip or one way?`,
        { parse_mode: 'Markdown', reply_markup: roundTripKeyboard })
      break
    }

    case 'AWAITING_RETURN_DATE': {
      if (!DATE.test(text)) {
        await bot.sendMessage(chatId, '❌ Invalid date. Use `YYYY-MM-DD`',
          { parse_mode: 'Markdown', reply_markup: cancelKeyboard })
        return
      }
      await setState(chatId, { ...state, step: 'AWAITING_THRESHOLD', returnDate: text })
      await bot.sendMessage(chatId, `✅ Return: *${text}*\n\n💰 Enter *max price* (e.g. \`350\`):`,
        { parse_mode: 'Markdown', reply_markup: cancelKeyboard })
      break
    }

    case 'AWAITING_THRESHOLD': {
      const price = parseFloat(text)
      if (isNaN(price) || price <= 0) {
        await bot.sendMessage(chatId, '❌ Invalid price. Enter a positive number.',
          { reply_markup: cancelKeyboard })
        return
      }
      try {
        const tracker = await apiCreateTracker({
          telegramId: String(msg.from!.id),
          origin: state.origin!,
          destination: state.destination!,
          departureDate: state.departureDate!,
          returnDate: state.returnDate,
          priceThreshold: price,
          currency: 'USD',
          adults: 1,
        })
        await clearState(chatId)
        await bot.sendMessage(chatId,
          `🎉 *Tracker created!*\n\n` +
          `✈️ ${tracker.origin} → ${tracker.destination}\n` +
          `📅 ${tracker.departureDate}${tracker.returnDate ? ` → ${tracker.returnDate}` : ''}\n` +
          `🎯 Alert below *${price} USD*`,
          { parse_mode: 'Markdown' })
      } catch (e) {
        await clearState(chatId)
        await bot.sendMessage(chatId, `❌ Failed: ${(e as Error).message}`)
      }
      break
    }
  }
}
