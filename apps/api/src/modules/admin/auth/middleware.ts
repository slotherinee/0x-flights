import { Elysia } from 'elysia'
import { checkAuth } from './check-auth'
import { unauth } from './unauth'

export const adminAuthMiddleware = new Elysia().onBeforeHandle(({ headers }) => {
  if (!checkAuth(headers['authorization'])) return unauth()
})
