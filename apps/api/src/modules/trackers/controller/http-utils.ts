export function requireTelegramId(query: unknown): string | null {
  return (query as Record<string, string>)['telegramId'] ?? null
}
