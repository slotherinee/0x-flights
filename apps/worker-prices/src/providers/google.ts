import { join } from 'path'
import type { FlightProvider, FlightSearchParams, FlightSearchResult } from './types'

// Path to the Python scraper relative to repo root
const SCRIPT_PATH = join(import.meta.dir, '../../../../flights-script/flights.py')

interface ScraperFlight {
  price: number | null
  currency: string
  airlines: string | null
  is_direct: boolean
  stops: number
}

export class GoogleFlightsProvider implements FlightProvider {
  readonly name = 'google'

  async searchFlights(params: FlightSearchParams): Promise<FlightSearchResult | null> {
    const currency = params.currency ?? 'EUR'
    const args = [
      params.origin,
      params.destination,
      params.departureDate,
      currency,
    ]

    let stdout = ''
    let stderr = ''

    try {
      const proc = Bun.spawn(['python3', SCRIPT_PATH, ...args], {
        stdout: 'pipe',
        stderr: 'pipe',
      })

      stdout = await new Response(proc.stdout).text()
      stderr = await new Response(proc.stderr).text()

      const code = await proc.exited
      if (code !== 0) {
        console.error(`[Google] scraper exited ${code}: ${stderr.trim()}`)
        return null
      }
    } catch (err) {
      console.error('[Google] failed to spawn python3:', err)
      return null
    }

    let flights: ScraperFlight[]
    try {
      flights = JSON.parse(stdout) as ScraperFlight[]
    } catch {
      console.error('[Google] failed to parse scraper output:', stdout.slice(0, 200))
      return null
    }

    // Find lowest valid price
    const withPrice = flights.filter((f) => f.price !== null && f.price > 0)
    if (!withPrice.length) return null

    const cheapest = withPrice[0]! // already sorted asc by scraper

    return {
      lowestPrice: cheapest.price!,
      currency: cheapest.currency,
      source: 'google',
    }
  }
}
