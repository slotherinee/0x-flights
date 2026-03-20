import { Elysia } from 'elysia'
import { getPg } from '@0x-flights/db'

export const healthRoutes = new Elysia().get('/health', async ({ set }) => {
  try {
    await getPg()`SELECT 1`
    return { status: 'ok', timestamp: new Date().toISOString() }
  } catch {
    set.status = 503
    return { status: 'error', timestamp: new Date().toISOString() }
  }
})
