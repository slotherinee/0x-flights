export function formatRelativeAge(ageMs: number | null): string {
  if (ageMs == null) return 'never'
  if (ageMs < 60_000) return 'just now'

  const totalMinutes = Math.floor(ageMs / 60_000)
  if (totalMinutes < 60) return `${totalMinutes} min ago`

  const totalHours = Math.floor(totalMinutes / 60)
  if (totalHours < 24) return `${totalHours} h ago`

  const totalDays = Math.floor(totalHours / 24)
  return `${totalDays} d ago`
}
