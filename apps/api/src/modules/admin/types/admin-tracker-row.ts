export type AdminTrackerRow = {
  id: number
  userId: number
  telegramId: string | null
  username: string | null
  origin: string
  destination: string
  departureDate: string
  priceThreshold: string
  currency: string
  isActive: boolean
  createdAt: Date
  latestPrice: string | null
}
