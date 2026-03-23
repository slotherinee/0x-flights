/**
 * All bot→API communication goes through here.
 * Bot contains ZERO business logic — only calls the API.
 */
import { env } from '@0x-flights/config'
import type { CreateTrackerDto, UpdateTrackerDto, TrackerResponse, UserCurrency, UserLanguage } from '@0x-flights/shared'

const BASE = process.env['API_BASE_URL'] ?? `http://localhost:${env.API_PORT}`

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

export const apiCreateTracker = (dto: CreateTrackerDto) =>
  req<TrackerResponse>('/trackers', { method: 'POST', body: JSON.stringify(dto) })

export const apiListTrackers = (telegramId: string) =>
  req<TrackerResponse[]>(`/trackers?telegramId=${encodeURIComponent(telegramId)}`)

export const apiDeleteTracker = (id: number, telegramId: string) =>
  req(`/trackers/${id}?telegramId=${encodeURIComponent(telegramId)}`, { method: 'DELETE' })

export const apiUpdateTracker = (id: number, updates: UpdateTrackerDto, telegramId: string) =>
  req<TrackerResponse>(`/trackers/${id}?telegramId=${encodeURIComponent(telegramId)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })

export const apiGetUserLanguage = async (telegramId: string): Promise<UserLanguage | null> => {
  const res = await req<{ language: UserLanguage | null }>(
    `/trackers/language?telegramId=${encodeURIComponent(telegramId)}`,
  )
  return res.language
}

export const apiSetUserLanguage = async (
  telegramId: string,
  language: UserLanguage,
): Promise<UserLanguage> => {
  const res = await req<{ language: UserLanguage }>('/trackers/language', {
    method: 'POST',
    body: JSON.stringify({ telegramId, language }),
  })
  return res.language
}

export const apiGetUserCurrency = async (telegramId: string): Promise<UserCurrency | null> => {
  const res = await req<{ currency: UserCurrency | null }>(
    `/trackers/currency?telegramId=${encodeURIComponent(telegramId)}`,
  )
  return res.currency
}

export const apiSetUserCurrency = async (
  telegramId: string,
  currency: UserCurrency,
): Promise<UserCurrency> => {
  const res = await req<{ currency: UserCurrency }>('/trackers/currency', {
    method: 'POST',
    body: JSON.stringify({ telegramId, currency }),
  })
  return res.currency
}
