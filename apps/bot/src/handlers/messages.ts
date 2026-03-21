import type TelegramBot from 'node-telegram-bot-api'
import { getState, setState, clearState } from '../state/conversation'
import { cancelKeyboard, tripTypeKeyboard, passengersKeyboard } from '../keyboards'
import { apiCreateTracker } from '../api-client'
import { examples, formatCityLabel, resolveCityToIata, parseHumanDate } from '../utils'

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
          { reply_markup: cancelKeyboard },
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
        { parse_mode: 'Markdown', reply_markup: cancelKeyboard },
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
          { reply_markup: cancelKeyboard },
        )
        return
      }
      await setState(chatId, {
        ...state,
        step: 'AWAITING_TRIP_TYPE',
        destination: iata,
        destinationCity: formatCityLabel(iata, lang),
      })
      await bot.sendMessage(
        chatId,
        lang === 'ru'
          ? `✅ Прибытие: *${formatCityLabel(iata, 'ru')}*\n\n🔄 Тип поездки:`
          : `✅ Destination: *${formatCityLabel(iata, 'en')}*\n\n🔄 Trip type:`,
        { parse_mode: 'Markdown', reply_markup: tripTypeKeyboard(lang) },
      )
      break
    }

    case 'AWAITING_TRIP_TYPE': {
      await bot.sendMessage(
        chatId,
        lang === 'ru' ? 'Выберите тип поездки кнопками выше.' : 'Choose trip type with the buttons above.',
        { reply_markup: tripTypeKeyboard(lang) },
      )
      break
    }

    case 'AWAITING_DATE': {
      const parsed = parseHumanDate(text)
      if (!parsed) {
        await bot.sendMessage(
          chatId,
          lang === 'ru'
            ? '❌ Не удалось распознать дату. Попробуйте:\n`15 июня`, `15.06.2026`, `июнь 15го`, `2026-06-15`'
            : '❌ Could not parse the date. Try:\n`15 june`, `15.06.2026`, `june 15th`, `2026-06-15`',
          { parse_mode: 'Markdown', reply_markup: cancelKeyboard },
        )
        return
      }
      const minDate = new Date()
      minDate.setDate(minDate.getDate() + 2)
      if (parsed < minDate.toISOString().slice(0, 10)) {
        await bot.sendMessage(
          chatId,
          lang === 'ru'
            ? `❌ Дата слишком близко. Трекер можно создать минимум на послезавтра (${minDate.toISOString().slice(0, 10)}).`
            : `❌ Date too soon. Tracker can only be created for the day after tomorrow or later (${minDate.toISOString().slice(0, 10)}).`,
          { reply_markup: cancelKeyboard },
        )
        return
      }

      if (state.tripType === 'roundtrip') {
        await setState(chatId, { ...state, step: 'AWAITING_RETURN_DATE', departureDate: parsed })
        await bot.sendMessage(
          chatId,
          lang === 'ru'
            ? `✅ Дата вылета: *${parsed}*\n\n📅 Теперь введите *дату обратного рейса*:\n_Например: 29 марта, 29.03.2026_`
            : `✅ Departure: *${parsed}*\n\n📅 Now enter the *return date*:\n_E.g.: 29 march, 29.03.2026_`,
          { parse_mode: 'Markdown', reply_markup: cancelKeyboard },
        )
      } else {
        await setState(chatId, { ...state, step: 'AWAITING_PASSENGERS', departureDate: parsed })
        await bot.sendMessage(
          chatId,
          lang === 'ru'
            ? `✅ Дата вылета: *${parsed}*\n\n👤 Сколько пассажиров?`
            : `✅ Departure: *${parsed}*\n\n👤 How many passengers?`,
          { parse_mode: 'Markdown', reply_markup: passengersKeyboard(lang) },
        )
      }
      break
    }

    case 'AWAITING_RETURN_DATE': {
      const parsed = parseHumanDate(text)
      if (!parsed) {
        await bot.sendMessage(
          chatId,
          lang === 'ru'
            ? '❌ Не удалось распознать дату. Попробуйте:\n`29 марта`, `29.03.2026`, `2026-03-29`'
            : '❌ Could not parse the date. Try:\n`29 march`, `29.03.2026`, `2026-03-29`',
          { parse_mode: 'Markdown', reply_markup: cancelKeyboard },
        )
        return
      }
      if (state.departureDate && parsed <= state.departureDate) {
        await bot.sendMessage(
          chatId,
          lang === 'ru'
            ? `❌ Дата обратного рейса должна быть позже даты вылета (${state.departureDate}).`
            : `❌ Return date must be after departure date (${state.departureDate}).`,
          { reply_markup: cancelKeyboard },
        )
        return
      }
      await setState(chatId, { ...state, step: 'AWAITING_PASSENGERS', returnDate: parsed })
      await bot.sendMessage(
        chatId,
        lang === 'ru'
          ? `✅ Обратный рейс: *${parsed}*\n\n👤 Сколько пассажиров?`
          : `✅ Return: *${parsed}*\n\n👤 How many passengers?`,
        { parse_mode: 'Markdown', reply_markup: passengersKeyboard(lang) },
      )
      break
    }

    case 'AWAITING_PASSENGERS': {
      await bot.sendMessage(
        chatId,
        lang === 'ru' ? 'Выберите количество пассажиров кнопками выше.' : 'Choose number of passengers with the buttons above.',
        { reply_markup: passengersKeyboard(lang) },
      )
      break
    }

    case 'AWAITING_THRESHOLD': {
      const price = parseFloat(text)
      if (isNaN(price) || price <= 0) {
        await bot.sendMessage(
          chatId,
          lang === 'ru' ? '❌ Неверная цена. Введите положительное число.' : '❌ Invalid price. Enter a positive number.',
          { reply_markup: cancelKeyboard },
        )
        return
      }
      try {
        const tracker = await apiCreateTracker({
          telegramId: String(msg.from!.id),
          origin: state.origin!,
          destination: state.destination!,
          departureDate: state.departureDate!,
          returnDate: state.returnDate ?? null,
          priceThreshold: price,
          currency: state.currency ?? 'USD',
          adults: state.adults ?? 1,
        })
        await clearState(chatId)

        const isRoundTrip = !!tracker.returnDate
        const dateLabel = isRoundTrip
          ? (lang === 'ru' ? `${tracker.departureDate} → ${tracker.returnDate}` : `${tracker.departureDate} → ${tracker.returnDate}`)
          : tracker.departureDate
        const tripLabel = isRoundTrip
          ? (lang === 'ru' ? '🔄 Туда-обратно' : '🔄 Round-trip')
          : (lang === 'ru' ? '✈️ В одну сторону' : '✈️ One-way')
        const adultsLabel = `👤 ${tracker.adults}`

        await bot.sendMessage(
          chatId,
          lang === 'ru'
            ? `🎉 *Трекер создан!*\n\n` +
              `✈️ ${state.originCity ?? tracker.origin} → ${state.destinationCity ?? tracker.destination}\n` +
              `📅 ${dateLabel}\n` +
              `${tripLabel}  ${adultsLabel}\n` +
              `🎯 Уведомление при цене ниже *${formatMoney(Number(tracker.priceThreshold), tracker.currency, 'ru')}*`
            : `🎉 *Tracker created!*\n\n` +
              `✈️ ${state.originCity ?? tracker.origin} → ${state.destinationCity ?? tracker.destination}\n` +
              `📅 ${dateLabel}\n` +
              `${tripLabel}  ${adultsLabel}\n` +
              `🎯 Alert below *${formatMoney(Number(tracker.priceThreshold), tracker.currency, 'en')}*`,
          { parse_mode: 'Markdown' },
        )
      } catch (e) {
        await clearState(chatId)
        await bot.sendMessage(
          chatId,
          lang === 'ru' ? `❌ Ошибка: ${(e as Error).message}` : `❌ Failed: ${(e as Error).message}`,
        )
      }
      break
    }
  }
}
