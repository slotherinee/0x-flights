export type { FlightProvider, FlightSearchParams, FlightSearchResult } from './types'

import type { FlightProvider } from './types'
import { StubProvider } from './stub'
import { GoogleFlightsProvider } from './google'
import { AvProvider } from './av'

export function createFlightProvider(): FlightProvider {
  const name = process.env['FLIGHT_PROVIDER'] ?? 'stub'
  if (name === 'google') return new GoogleFlightsProvider()
  if (name === 'av') return new AvProvider()
  return new StubProvider()
}
