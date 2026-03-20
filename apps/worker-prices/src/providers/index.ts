export type { FlightProvider, FlightSearchParams, FlightSearchResult } from './types'

import type { FlightProvider } from './types'
import { StubProvider } from './stub'
import { GoogleFlightsProvider } from './google'

export function createFlightProvider(): FlightProvider {
  const name = process.env['FLIGHT_PROVIDER'] ?? 'stub'
  if (name === 'google') return new GoogleFlightsProvider()
  return new StubProvider()
}
