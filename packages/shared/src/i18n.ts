import type { NotificationJob, UserCurrency, UserLanguage } from './types'

export const SUPPORTED_CURRENCIES: UserCurrency[] = ['USD', 'EUR', 'RUB', 'GBP']

export function normalizeLanguage(lang: string | null | undefined): UserLanguage {
  return lang === 'ru' ? 'ru' : 'en'
}

export function normalizeCurrency(value: string | null | undefined): UserCurrency {
  const normalized = (value ?? '').toUpperCase().trim()
  if (normalized === 'EUR' || normalized === 'RUB' || normalized === 'GBP') return normalized
  return 'USD'
}

export function isSupportedCurrency(value: string | null | undefined): value is UserCurrency {
  const normalized = (value ?? '').toUpperCase().trim()
  return normalized === 'USD' || normalized === 'EUR' || normalized === 'RUB' || normalized === 'GBP'
}

export function buildLocalizedNotificationMessage(
  job: NotificationJob,
  lang: UserLanguage,
): string {
  const dateLabel = job.returnDate
    ? `${job.departureDate} → ${job.returnDate}`
    : job.departureDate

  if (lang === 'ru') {
    const tripLabel = job.returnDate ? '🔄 Туда-обратно' : '✈️ В одну сторону'
    const diffLine =
      job.previousPrice != null && job.previousPrice !== job.price
        ? `📉 Изменение: *${job.previousPrice > job.price ? '-' : '+'}${Math.abs(Math.round((job.previousPrice - job.price) * 100) / 100)} ${job.currency}* (было ${job.previousPrice})\n`
        : ''
    return (
      `🚨 *Снижение цены!*\n\n` +
      `✈️ *${job.origin} → ${job.destination}*\n` +
      `📅 ${dateLabel}  ${tripLabel}\n` +
      `💰 Текущая цена: *${job.price} ${job.currency}*\n` +
      diffLine +
      `🎯 Ваш порог: ${job.threshold} ${job.currency}\n\n` +
      `Проверьте билет сейчас, цена может снова вырасти.`
    )
  }

  const tripLabel = job.returnDate ? '🔄 Round-trip' : '✈️ One-way'
  const diffLine =
    job.previousPrice != null && job.previousPrice !== job.price
      ? `📉 Change: *${job.previousPrice > job.price ? '-' : '+'}${Math.abs(Math.round((job.previousPrice - job.price) * 100) / 100)} ${job.currency}* (was ${job.previousPrice})\n`
      : ''
  return (
    `🚨 *Price Alert!*\n\n` +
    `✈️ *${job.origin} → ${job.destination}*\n` +
    `📅 ${dateLabel}  ${tripLabel}\n` +
    `💰 Current price: *${job.price} ${job.currency}*\n` +
    diffLine +
    `🎯 Your threshold: ${job.threshold} ${job.currency}\n\n` +
    `Book now before it goes back up!`
  )
}
