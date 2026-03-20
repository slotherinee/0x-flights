import type { NotificationJob, UserLanguage } from './types'

export function normalizeLanguage(lang: string | null | undefined): UserLanguage {
  return lang === 'ru' ? 'ru' : 'en'
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
