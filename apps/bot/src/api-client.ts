/**
 * All bot→API communication goes through here.
 * Bot contains ZERO business logic — only calls the API.
 */
import { env } from '@0x-flights/config'
import type { CreateTrackerDto, TrackerResponse } from '@0x-flights/shared'

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
