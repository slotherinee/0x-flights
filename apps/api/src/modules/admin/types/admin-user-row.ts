export type AdminUserRow = {
  id: number
  telegramId: string
  username: string | null
  firstName: string | null
  lastName: string | null
  createdAt: Date
  trackerCount: number
  activeTrackerCount: number
}
