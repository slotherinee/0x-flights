import type { NotificationJob } from '@0x-flights/shared'

export function buildNotificationMessage(job: NotificationJob): string {
  const trip = job.departureDate
  return (
    `🚨 *Price Alert!*\n\n` +
    `✈️ *${job.origin} → ${job.destination}*\n` +
    `📅 ${trip}\n` +
    `💰 Current price: *${job.price} ${job.currency}*\n` +
    `🎯 Your threshold: ${job.threshold} ${job.currency}\n\n` +
    `Book now before it goes back up!`
  )
}
