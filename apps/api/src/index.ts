import { env } from '@0x-flights/config'
import { runMigrations, closeDb } from '@0x-flights/db'
import { createHttpApp } from './infrastructure/http/create-app.ts'
import { registerModules } from './infrastructure/http/register-modules.ts'

await runMigrations()

const app = registerModules(createHttpApp()).listen(env.API_PORT)

console.log(`🚀 API running on http://localhost:${env.API_PORT}`)

const shutdown = async () => {
  await app.stop()
  await closeDb()
  process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
