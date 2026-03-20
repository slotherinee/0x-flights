import type TelegramBot from 'node-telegram-bot-api'
import { getState, setState, clearState } from '../state/conversation'
import { cancelKeyboard } from '../keyboards'
import { apiCreateTracker } from '../api-client'
import { examples, formatCityLabel, resolveCityToIata } from '../utils'

const DATE = /^\d{4}-\d{2}-\d{2}$/

function formatMoney(value: number, currency: string, lang: 'en' | 'ru'): string {
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US'
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
  } catch {
    return `${value} ${currency}`
  }
}

export async function handleTextMessage(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id
  const state = await getState(chatId)
  if (!state) return
  const lang = state.lang ?? 'en'

  const text = (msg.text ?? '').trim()

  switch (state.step) {
    case 'AWAITING_LANGUAGE': {
      await bot.sendMessage(
        chatId,
        lang === 'ru'
          ? 'Выберите язык кнопками EN/RU выше, затем продолжим.'
          : 'Choose language with EN/RU buttons above, then continue.',
      )
      break
    }

    case 'AWAITING_CURRENCY': {
      await bot.sendMessage(
        chatId,
        lang === 'ru'
          ? 'Выберите валюту кнопками USD/EUR/RUB/GBP выше, затем продолжим.'
          : 'Choose currency with USD/EUR/RUB/GBP buttons above, then continue.',
      )
      break
    }

    case 'AWAITING_ORIGIN_CITY': {
      const iata = resolveCityToIata(text, lang)
      if (!iata) {
        await bot.sendMessage(
          chatId,
          lang === 'ru'
            ? `❌ Город не найден. Введите полное название, например: ${examples('ru')}`
            : `❌ City not found. Please enter full city name, e.g.: ${examples('en')}`,
          {
            reply_markup: cancelKeyboard,
          },
        )
        return
      }

      await setState(chatId, {
        ...state,
        step: 'AWAITING_DESTINATION_CITY',
        origin: iata,
        originCity: formatCityLabel(iata, lang),
      })
      await bot.sendMessage(
        chatId,
        lang === 'ru'
          ? `✅ Отправление: *${formatCityLabel(iata, 'ru')}*\n\nУкажите полностью *город прибытия*:`
          : `✅ Origin: *${formatCityLabel(iata, 'en')}*\n\nEnter full *destination city* name:`,
        {
        parse_mode: 'Markdown',
        reply_markup: cancelKeyboard,
        },
      )
      break
    }

    case 'AWAITING_DESTINATION_CITY': {
      const iata = resolveCityToIata(text, lang)
      if (!iata) {
        await bot.sendMessage(
          chatId,
          lang === 'ru'
            ? `❌ Город не найден. Введите полное название, например: ${examples('ru')}`
            : `❌ City not found. Please enter full city name, e.g.: ${examples('en')}`,
          {
            reply_markup: cancelKeyboard,
          },
        )
        return
      }

      await setState(chatId, {
        ...state,
        step: 'AWAITING_DATE',
        destination: iata,
        destinationCity: formatCityLabel(iata, lang),
      })
      await bot.sendMessage(
        chatId,
        lang === 'ru'
          ? `✅ Прибытие: *${formatCityLabel(iata, 'ru')}*\n\n📅 Введите *дату вылета* (YYYY-MM-DD):`
          : `✅ Destination: *${formatCityLabel(iata, 'en')}*\n\n📅 Enter *departure date* (YYYY-MM-DD):`,
        { parse_mode: 'Markdown', reply_markup: cancelKeyboard },
      )
      break
    }

    case 'AWAITING_DATE': {
      if (!DATE.test(text)) {
        await bot.sendMessage(chatId, lang === 'ru' ? '❌ Неверная дата. Используйте `YYYY-MM-DD`' : '❌ Invalid date. Use `YYYY-MM-DD`', {
          parse_mode: 'Markdown',
          reply_markup: cancelKeyboard,
        })
        return
      }
      await setState(chatId, { ...state, step: 'AWAITING_THRESHOLD', departureDate: text })
      await bot.sendMessage(
        chatId,
        lang === 'ru'
          ? `✅ Дата вылета: *${text}*\n\n💰 Введите *максимальную цену* (например, \`350\`):`
          : `✅ Departure: *${text}*\n\n💰 Enter *max price* (e.g. \`350\`):`,
        { parse_mode: 'Markdown', reply_markup: cancelKeyboard },
      )
      break
    }

    case 'AWAITING_THRESHOLD': {
      const price = parseFloat(text)
      if (isNaN(price) || price <= 0) {
        await bot.sendMessage(chatId, lang === 'ru' ? '❌ Неверная цена. Введите положительное число.' : '❌ Invalid price. Enter a positive number.', {
          reply_markup: cancelKeyboard,
        })
        return
      }
      try {
        const tracker = await apiCreateTracker({
          telegramId: String(msg.from!.id),
          origin: state.origin!,
          destination: state.destination!,
          departureDate: state.departureDate!,
          priceThreshold: price,
          currency: state.currency ?? 'USD',
          adults: 1,
        })
        await clearState(chatId)
        await bot.sendMessage(
          chatId,
          lang === 'ru'
            ? `🎉 *Трекер создан!*\n\n` +
              `✈️ ${state.originCity ?? tracker.origin} → ${state.destinationCity ?? tracker.destination}\n` +
              `📅 ${tracker.departureDate}\n` +
              `🎯 Уведомление при цене ниже *${formatMoney(Number(tracker.priceThreshold), tracker.currency, 'ru')}*`
            : `🎉 *Tracker created!*\n\n` +
              `✈️ ${state.originCity ?? tracker.origin} → ${state.destinationCity ?? tracker.destination}\n` +
              `📅 ${tracker.departureDate}\n` +
              `🎯 Alert below *${formatMoney(Number(tracker.priceThreshold), tracker.currency, 'en')}*`,
          { parse_mode: 'Markdown' },
        )
      } catch (e) {
        await clearState(chatId)
        await bot.sendMessage(chatId, lang === 'ru' ? `❌ Ошибка: ${(e as Error).message}` : `❌ Failed: ${(e as Error).message}`)
      }
      break
    }
  }
}
