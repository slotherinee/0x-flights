import type { UserCurrency } from '@0x-flights/shared'
import { findUserCurrencyByTelegramId, saveUserCurrencyByTelegramId } from '../repository'

export async function getUserCurrencyByTelegramId(telegramId: string): Promise<UserCurrency | null> {
  return findUserCurrencyByTelegramId(telegramId)
}

export async function setUserCurrencyByTelegramId(
  telegramId: string,
  currency: UserCurrency,
): Promise<UserCurrency> {
  return saveUserCurrencyByTelegramId(telegramId, currency)
}