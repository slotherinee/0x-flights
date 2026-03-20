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
  if (lang === 'ru') {
    return (
      `🚨 *Снижение цены!*\n\n` +
      `✈️ *${job.origin} → ${job.destination}*\n` +
      `📅 ${job.departureDate}\n` +
      `💰 Текущая цена: *${job.price} ${job.currency}*\n` +
      `🎯 Ваш порог: ${job.threshold} ${job.currency}\n\n` +
      `Проверьте билет сейчас, цена может снова вырасти.`
    )
  }

  return (
    `🚨 *Price Alert!*\n\n` +
    `✈️ *${job.origin} → ${job.destination}*\n` +
    `📅 ${job.departureDate}\n` +
    `💰 Current price: *${job.price} ${job.currency}*\n` +
    `🎯 Your threshold: ${job.threshold} ${job.currency}\n\n` +
    `Book now before it goes back up!`
  )
}
