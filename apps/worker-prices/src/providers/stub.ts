/**
 * Returns random prices for local dev/testing.
 * No API keys needed. Enable via FLIGHT_PROVIDER=stub (default).
 */
import type { FlightProvider, FlightSearchParams, FlightSearchResult } from './types'

export class StubProvider implements FlightProvider {
  readonly name = 'stub'

  async searchFlights(params: FlightSearchParams): Promise<FlightSearchResult> {
    await new Promise((r) => setTimeout(r, 50 + Math.random() * 100))
    return {
      lowestPrice: Math.round((150 + Math.random() * 650) * 100) / 100,
      currency: params.currency ?? 'USD',
      source: 'stub',
    }
  }
}
