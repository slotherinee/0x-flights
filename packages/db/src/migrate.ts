import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { join } from 'path'
import { getDb, closeDb } from './client'

export async function runMigrations(): Promise<void> {
  const migrationsFolder = join(import.meta.dir, '../migrations')
  await migrate(getDb(), { migrationsFolder })
}

// standalone: bun run packages/db/src/migrate.ts
if (import.meta.main) {
  await runMigrations()
  await closeDb()
  console.log('Migrations complete.')
}
