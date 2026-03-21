import { join } from 'path'
import type { FlightProvider, FlightSearchParams, FlightSearchResult } from './types'

const SCRIPT_PATH = join(import.meta.dir, '../../scraper/av.py')

interface ScraperFlight {
  price: number | null
  currency: string
  source: string
  airlines: string | null
  is_direct: boolean
  stops: number
}

export class AvProvider implements FlightProvider {
  readonly name = 'av'

  async searchFlights(params: FlightSearchParams): Promise<FlightSearchResult | null> {
    const currency = params.currency ?? 'RUB'
    const retDate = params.returnDate ?? '-'
    const adults = String(params.adults ?? 1)
    const args = [params.origin, params.destination, params.departureDate, retDate, adults, currency]

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
        console.error(`[Av] scraper exited ${code}: ${stderr.trim()}`)
        return null
      }
    } catch (err) {
      console.error('[Av] failed to spawn python3:', err)
      return null
    }

    let flights: ScraperFlight[]
    try {
      flights = JSON.parse(stdout) as ScraperFlight[]
    } catch {
      console.error('[Av] failed to parse scraper output:', stdout.slice(0, 200))
      return null
    }

    const withPrice = flights.filter((f) => f.price !== null && f.price > 0)
    if (!withPrice.length) return null

    const cheapest = withPrice[0]!

    return {
      lowestPrice: cheapest.price!,
      currency: cheapest.currency,
      source: 'av',
    }
  }
}
