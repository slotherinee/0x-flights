import type { FlightTicket } from '@0x-flights/shared'

export interface FlightSearchParams {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string | null
  adults?: number
  currency?: string
}

export interface FlightSearchResult {
  lowestPrice: number
  currency: string
  source: string
  tickets: FlightTicket[]
}

export interface FlightProvider {
  name: string
  searchFlights(params: FlightSearchParams): Promise<FlightSearchResult | null>
}
