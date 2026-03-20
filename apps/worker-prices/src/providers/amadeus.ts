import { Redis } from 'ioredis'
import { env, getRedisConfig } from '@0x-flights/config'
import type { FlightProvider, FlightSearchParams, FlightSearchResult } from './types'

const BASE = 'https://test.api.amadeus.com'

export class AmadeusProvider implements FlightProvider {
  readonly name = 'amadeus'
  private redis = new Redis(getRedisConfig())

  private async getToken(): Promise<string> {
    const cached = await this.redis.get('amadeus:token')
    if (cached) return cached

    const res = await fetch(`${BASE}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: env.AMADEUS_CLIENT_ID ?? '',
        client_secret: env.AMADEUS_CLIENT_SECRET ?? '',
      }).toString(),
    })
    if (!res.ok) throw new Error(`Amadeus auth failed: ${res.status}`)
    const data = await res.json() as { access_token: string }
    await this.redis.setex('amadeus:token', 1740, data.access_token) // 29min
    return data.access_token
  }

  async searchFlights(params: FlightSearchParams): Promise<FlightSearchResult | null> {
    const cacheKey = `amadeus:price:${params.origin}:${params.destination}:${params.departureDate}:${params.returnDate ?? 'one'}:${params.adults ?? 1}:${params.currency ?? 'USD'}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as FlightSearchResult

    const token = await this.getToken()
    const qs = new URLSearchParams({
      originLocationCode: params.origin,
      destinationLocationCode: params.destination,
      departureDate: params.departureDate,
      adults: String(params.adults ?? 1),
      currencyCode: params.currency ?? 'USD',
      max: '5',
    })
    if (params.returnDate) qs.set('returnDate', params.returnDate)

    const res = await fetch(`${BASE}/v2/shopping/flight-offers?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.status === 401) {
      await this.redis.del('amadeus:token')
      return this.searchFlights(params) // retry once
    }
    if (res.status === 429) { console.warn('[Amadeus] rate limited'); return null }
    if (!res.ok) { console.error(`[Amadeus] ${res.status}`); return null }

    const data = await res.json() as { data: { price: { total: string; currency: string } }[] }
    if (!data.data?.length) return null

    const result: FlightSearchResult = {
      lowestPrice: Math.min(...data.data.map((o) => parseFloat(o.price.total))),
      currency: data.data[0]!.price.currency,
      source: 'amadeus',
    }
    await this.redis.setex(cacheKey, 300, JSON.stringify(result))
    return result
  }

  async close() { await this.redis.quit() }
}
