import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { env } from '@0x-flights/config'
import { runMigrations, closeDb } from '@0x-flights/db'
import { healthRoutes } from './routes/health'
import { trackerRoutes } from './routes/trackers'

await runMigrations()

const app = new Elysia()
  .use(swagger({ path: '/docs' }))
  .onError(({ error, set }) => {
    console.error(error)
    set.status = 500
    return { error: 'Internal server error' }
  })
  .use(healthRoutes)
  .use(trackerRoutes)
  .listen(env.API_PORT)

console.log(`🚀 API running on http://localhost:${env.API_PORT}`)

const shutdown = async () => {
  await app.stop()
  await closeDb()
  process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
