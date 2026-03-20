import { env } from '@0x-flights/config'

export function checkAuth(h: string | undefined): boolean {
  if (!h?.startsWith('Basic ')) return false
  const [user, ...rest] = atob(h.slice(6)).split(':')
  return user === env.ADMIN_USER && rest.join(':') === env.ADMIN_PASSWORD
}
