import {
  getUserCurrencyByTelegramId,
  upsertUser,
  getUserByTelegramId,
  getUserLanguageByTelegramId,
  setUserCurrencyByTelegramId,
  setUserLanguageByTelegramId,
} from '@0x-flights/db'
import type { UserCurrency, UserLanguage } from '@0x-flights/shared'

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

export async function findUserCurrencyByTelegramId(telegramId: string) {
  return getUserCurrencyByTelegramId(telegramId)
}

export async function saveUserCurrencyByTelegramId(telegramId: string, currency: UserCurrency) {
  return setUserCurrencyByTelegramId(telegramId, currency)
}
