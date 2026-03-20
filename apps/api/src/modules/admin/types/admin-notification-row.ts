export type AdminNotificationRow = {
  id: number
  telegramId: string | null
  username: string | null
  origin: string | null
  destination: string | null
  price: string
  currency: string
  sentAt: Date | null
  createdAt: Date
}
