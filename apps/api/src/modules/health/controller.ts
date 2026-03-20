import { Elysia } from 'elysia'
import { checkHealth } from './service.ts'

export const healthRoutes = new Elysia().get('/health', async ({ set }) => {
  const result = await checkHealth()
  if (result.status === 'error') set.status = 503
  return result
})
