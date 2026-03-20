import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'

export function createHttpApp() {
  return new Elysia()
    .use(swagger({ path: '/docs' }))
    .onError(({ error, set }) => {
      console.error(error)
      set.status = 500
      return { error: 'Internal server error' }
    })
}
