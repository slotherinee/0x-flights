import { pingDb } from './repository.ts'

export async function checkHealth(): Promise<{ status: 'ok' | 'error'; timestamp: string }> {
  try {
    await pingDb()
    return { status: 'ok', timestamp: new Date().toISOString() }
  } catch {
    return { status: 'error', timestamp: new Date().toISOString() }
  }
}
