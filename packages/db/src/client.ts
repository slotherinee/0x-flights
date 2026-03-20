import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { getPostgresUrl } from '@0x-flights/config'
import * as schema from './schema'

let _pg: ReturnType<typeof postgres> | null = null
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getPg() {
  if (!_pg) {
    _pg = postgres(getPostgresUrl(), { max: 20, idle_timeout: 30 })
  }
  return _pg
}

export function getDb() {
  if (!_db) {
    _db = drizzle(getPg(), { schema })
  }
  return _db
}

export async function closeDb() {
  if (_pg) {
    await _pg.end()
    _pg = null
    _db = null
  }
}
