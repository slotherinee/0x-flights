import type { UserLanguage } from '@0x-flights/shared'
import { findUserLanguageByTelegramId, saveUserLanguageByTelegramId } from '../repository'

export async function getUserLanguageByTelegramId(telegramId: string): Promise<UserLanguage | null> {
  return findUserLanguageByTelegramId(telegramId)
}

export async function setUserLanguageByTelegramId(
  telegramId: string,
  language: UserLanguage,
): Promise<UserLanguage> {
  return saveUserLanguageByTelegramId(telegramId, language)
}
