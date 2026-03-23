import type TelegramBot from 'node-telegram-bot-api'
import { getState, setState, clearState } from '../state/conversation'
import { cancelKeyboard, tripTypeKeyboard, passengersKeyboard, flexibilityKeyboard } from '../keyboards'
import { apiCreateTracker, apiUpdateTracker } from '../api-client'
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
      const today = new Date().toISOString().slice(0, 10)
      const minDate = new Date()
      minDate.setDate(minDate.getDate() + 2)
      const minDateStr = minDate.toISOString().slice(0, 10)
      if (parsed < today) {
        await bot.sendMessage(
          chatId,
          lang === 'ru'
            ? `❌ Эта дата уже прошла. Укажите дату в будущем, например: \`${minDateStr}\``
            : `❌ This date has already passed. Please enter a future date, e.g. \`${minDateStr}\``,
          { parse_mode: 'Markdown', reply_markup: cancelKeyboard },
        )
        return
      }
      if (parsed < minDateStr) {
        await bot.sendMessage(
          chatId,
          lang === 'ru'
            ? `❌ Дата слишком близко. Трекер можно создать минимум на послезавтра (\`${minDateStr}\`).`
            : `❌ Date too soon. Minimum date is the day after tomorrow (\`${minDateStr}\`).`,
          { parse_mode: 'Markdown', reply_markup: cancelKeyboard },
        )
        return
      }
      await setState(chatId, { ...state, step: 'AWAITING_DEP_FLEXIBILITY', departureDate: parsed })
      await bot.sendMessage(
        chatId,
        lang === 'ru'
          ? `✅ Дата вылета: *${parsed}*\n\n📅 Проверять точную дату или гибкий диапазон?`
          : `✅ Departure: *${parsed}*\n\n📅 Exact date or flexible range?`,
        { parse_mode: 'Markdown', reply_markup: flexibilityKeyboard(lang) },
      )
      break
    }

    case 'AWAITING_DEP_FLEXIBILITY':
    case 'AWAITING_RET_FLEXIBILITY': {
      await bot.sendMessage(
        chatId,
        lang === 'ru' ? 'Выберите вариант кнопками выше.' : 'Choose an option with the buttons above.',
        { reply_markup: flexibilityKeyboard(lang) },
      )
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
      await setState(chatId, { ...state, step: 'AWAITING_RET_FLEXIBILITY', returnDate: parsed })
      await bot.sendMessage(
        chatId,
        lang === 'ru'
          ? `✅ Обратный рейс: *${parsed}*\n\n📅 Проверять точную дату или гибкий диапазон?`
          : `✅ Return: *${parsed}*\n\n📅 Exact date or flexible range?`,
        { parse_mode: 'Markdown', reply_markup: flexibilityKeyboard(lang) },
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
          departureOffset: state.departureOffset ?? 0,
          returnOffset: state.returnOffset ?? 0,
        })
        await clearState(chatId)

        const isRoundTrip = !!tracker.returnDate
        const fmtDep = tracker.departureOffset > 0 ? `~${tracker.departureDate} ±${tracker.departureOffset}` : tracker.departureDate
        const fmtRet = tracker.returnDate
          ? (tracker.returnOffset > 0 ? `~${tracker.returnDate} ±${tracker.returnOffset}` : tracker.returnDate)
          : null
        const dateLabel = fmtRet ? `${fmtDep} → ${fmtRet}` : fmtDep
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

    case 'AWAITING_EDIT_VALUE': {
      if (!state.editTrackerId || !state.editField) {
        await clearState(chatId)
        return
      }
      const trackerId = state.editTrackerId
      const field = state.editField
      const telegramId = String(msg.from!.id)

      try {
        if (field === 'origin') {
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
          await apiUpdateTracker(trackerId, { origin: iata }, telegramId)
          await clearState(chatId)
          await bot.sendMessage(
            chatId,
            lang === 'ru'
              ? `✅ Трекер обновлен!\n✈️ Откуда: *${formatCityLabel(iata, 'ru')}*`
              : `✅ Tracker updated!\n✈️ Origin: *${formatCityLabel(iata, 'en')}*`,
            { parse_mode: 'Markdown' },
          )
          return
        }

        if (field === 'destination') {
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
          await apiUpdateTracker(trackerId, { destination: iata }, telegramId)
          await clearState(chatId)
          await bot.sendMessage(
            chatId,
            lang === 'ru'
              ? `✅ Трекер обновлен!\n✈️ Куда: *${formatCityLabel(iata, 'ru')}*`
              : `✅ Tracker updated!\n✈️ Destination: *${formatCityLabel(iata, 'en')}*`,
            { parse_mode: 'Markdown' },
          )
          return
        }

        if (field === 'departureDate') {
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
          const today = new Date().toISOString().slice(0, 10)
          if (parsed < today) {
            await bot.sendMessage(
              chatId,
              lang === 'ru'
                ? `❌ Эта дата уже прошла. Укажите дату в будущем, например: ${today}`
                : `❌ This date has already passed. Please enter a future date, e.g. ${today}`,
              { parse_mode: 'Markdown', reply_markup: cancelKeyboard },
            )
            return
          }
          await apiUpdateTracker(trackerId, { departureDate: parsed }, telegramId)
          await clearState(chatId)
          await bot.sendMessage(
            chatId,
            lang === 'ru'
              ? `✅ Трекер обновлен!\n📅 Дата вылета: *${parsed}*`
              : `✅ Tracker updated!\n📅 Departure: *${parsed}*`,
            { parse_mode: 'Markdown' },
          )
          return
        }

        if (field === 'returnDate') {
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
          await apiUpdateTracker(trackerId, { returnDate: parsed }, telegramId)
          await clearState(chatId)
          await bot.sendMessage(
            chatId,
            lang === 'ru'
              ? `✅ Трекер обновлен!\n📅 Дата возврата: *${parsed}*`
              : `✅ Tracker updated!\n📅 Return: *${parsed}*`,
            { parse_mode: 'Markdown' },
          )
          return
        }

        if (field === 'priceThreshold') {
          const price = parseFloat(text)
          if (isNaN(price) || price <= 0) {
            await bot.sendMessage(
              chatId,
              lang === 'ru' ? '❌ Неверная цена. Введите положительное число.' : '❌ Invalid price. Enter a positive number.',
              { reply_markup: cancelKeyboard },
            )
            return
          }
          await apiUpdateTracker(trackerId, { priceThreshold: price }, telegramId)
          await clearState(chatId)
          await bot.sendMessage(
            chatId,
            lang === 'ru'
              ? `✅ Трекер обновлен!\n💰 Новый порог: *${formatMoney(price, state.currency ?? 'USD', 'ru')}*`
              : `✅ Tracker updated!\n💰 New threshold: *${formatMoney(price, state.currency ?? 'USD', 'en')}*`,
            { parse_mode: 'Markdown' },
          )
          return
        }
      } catch (e) {
        await clearState(chatId)
        await bot.sendMessage(
          chatId,
          lang === 'ru' ? `❌ Ошибка: ${(e as Error).message}` : `❌ Error: ${(e as Error).message}`,
        )
      }
      break
    }
  }
}
