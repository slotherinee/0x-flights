export type AdminPriceRow = {
  trackerId: number
  origin: string | null
  destination: string | null
  price: string
  currency: string
  source: string
  fetchedAt: Date
}
