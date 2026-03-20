import type { Redis } from 'ioredis'

const FX_RATES_KEY = 'worker-prices:fx:usd-rates'
const FX_TTL_SECONDS = 60 * 60 * 48 // 48h
const FX_API_URL = 'https://open.er-api.com/v6/latest/USD'

type CachedUsdRates = {
  base: 'USD'
  rates: Record<string, number>
  updatedAt: string
}

function normalizeRates(input: Record<string, unknown>): Record<string, number> {
  const normalized: Record<string, number> = { USD: 1 }
  for (const [currency, value] of Object.entries(input)) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) continue
    normalized[currency.toUpperCase()] = value
  }
  return normalized
}

async function fetchUsdRatesFromApi(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(FX_API_URL)
    if (!res.ok) {
      console.error(`[FX] request failed: HTTP ${res.status}`)
      return null
    }

    const data = (await res.json()) as { rates?: Record<string, unknown> }
    if (!data.rates || typeof data.rates !== 'object') {
      console.error('[FX] invalid response payload: missing rates')
      return null
    }

    return normalizeRates(data.rates)
  } catch (error) {
    console.error('[FX] fetch failed:', error)
    return null
  }
}

async function saveUsdRates(redis: Redis, rates: Record<string, number>): Promise<void> {
  const payload: CachedUsdRates = {
    base: 'USD',
    rates,
    updatedAt: new Date().toISOString(),
  }
  await redis.set(FX_RATES_KEY, JSON.stringify(payload), 'EX', FX_TTL_SECONDS)
}

function parseCachedUsdRates(raw: string | null): CachedUsdRates | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as CachedUsdRates
    if (!parsed || parsed.base !== 'USD' || !parsed.rates || typeof parsed.rates !== 'object') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export async function refreshUsdRates(redis: Redis): Promise<boolean> {
  const rates = await fetchUsdRatesFromApi()
  if (!rates) return false
  await saveUsdRates(redis, rates)
  console.log(`[FX] USD rates refreshed (${Object.keys(rates).length} currencies)`)
  return true
}

export async function getUsdRates(redis: Redis): Promise<Record<string, number> | null> {
  const cached = parseCachedUsdRates(await redis.get(FX_RATES_KEY))
  if (cached) return cached.rates

  const refreshed = await refreshUsdRates(redis)
  if (!refreshed) return null

  const reloaded = parseCachedUsdRates(await redis.get(FX_RATES_KEY))
  return reloaded?.rates ?? null
}

export function convertUsdToCurrency(
  amountUsd: number,
  targetCurrency: string,
  rates: Record<string, number>,
): number | null {
  const rate = rates[targetCurrency.toUpperCase()]
  if (!rate) return null
  return Math.round(amountUsd * rate * 100) / 100
}
