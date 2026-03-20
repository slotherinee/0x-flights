export type TelegramFrom = {
  id: number
  first_name: string
  last_name?: string
  username?: string
  is_bot?: boolean
}

export type TelegramUpdate = {
  message?: { from?: TelegramFrom }
  callback_query?: { from: TelegramFrom }
}