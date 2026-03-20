import {
  buildLocalizedNotificationMessage,
  normalizeLanguage,
  type NotificationJob,
  type UserLanguage,
} from '@0x-flights/shared'

export function buildNotificationMessage(job: NotificationJob, lang?: UserLanguage | null): string {
  return buildLocalizedNotificationMessage(job, normalizeLanguage(lang))
}
