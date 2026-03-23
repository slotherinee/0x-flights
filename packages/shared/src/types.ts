export type UserLanguage = 'en' | 'ru'
export type UserCurrency = 'USD' | 'EUR' | 'RUB' | 'GBP'

export interface User {
  id: number
  telegramId: string
  language: UserLanguage
  currency: UserCurrency
  username: string | null
  firstName: string | null
  lastName: string | null
  createdAt: Date
}

export interface Tracker {
  id: number
  userId: number
  origin: string
  destination: string
  departureDate: string
  returnDate: string | null
  priceThreshold: number
  currency: string
  adults: number
  departureOffset: number
  returnOffset: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TrackerResponse extends Tracker {
  latestPrice?: number | null
  latestPriceCurrency?: string | null
}

export interface Price {
  id: number
  trackerId: number
  price: number
  currency: string
  source: string
  fetchedAt: Date
}

export interface Notification {
  id: number
  trackerId: number
  userId: number
  price: number
  currency: string
  message: string
  sentAt: Date | null
  createdAt: Date
}

export interface NotificationJob {
  trackerId: number
  userId: number
  telegramId: string
  origin: string
  destination: string
  departureDate: string
  returnDate: string | null
  adults: number
  departureOffset: number
  returnOffset: number
  price: number
  currency: string
  threshold: number
  previousPrice?: number | null
  ticketUrl: string | null
}

export interface CreateTrackerDto {
  telegramId: string
  origin: string
  destination: string
  departureDate: string
  returnDate?: string | null
  priceThreshold: number
  currency?: string
  adults?: number
  departureOffset?: number
  returnOffset?: number
}
