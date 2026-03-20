import {
  upsertUser,
  getUserByTelegramId,
  getUserLanguageByTelegramId,
  setUserLanguageByTelegramId,
} from '@0x-flights/db'
import type { UserLanguage } from '@0x-flights/shared'

export async function upsertUserByTelegramId(telegramId: string) {
  return upsertUser({ telegramId })
}

export async function findUserByTelegramId(telegramId: string) {
  return getUserByTelegramId(telegramId)
}

export async function findUserLanguageByTelegramId(telegramId: string) {
  return getUserLanguageByTelegramId(telegramId)
}

export async function saveUserLanguageByTelegramId(telegramId: string, language: UserLanguage) {
  return setUserLanguageByTelegramId(telegramId, language)
}
