import { getPg } from '@0x-flights/db'

export async function pingDb(): Promise<void> {
  await getPg()`SELECT 1`
}
