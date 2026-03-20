export type { FlightProvider, FlightSearchParams, FlightSearchResult } from './types'

import type { FlightProvider } from './types'
import { StubProvider } from './stub'
import { AmadeusProvider } from './amadeus'

export function createFlightProvider(): FlightProvider {
  const name = process.env['FLIGHT_PROVIDER'] ?? 'stub'
  if (name === 'amadeus') return new AmadeusProvider()
  return new StubProvider()
}
