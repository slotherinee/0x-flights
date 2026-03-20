import { getRedisConfig } from '@0x-flights/config'
import { Redis } from 'ioredis'

export const redis = new Redis({
  ...getRedisConfig(),
  lazyConnect: true,
  maxRetriesPerRequest: 1,
})

redis.on('error', (err) => {
  console.error('[admin redis] error:', err.message)
})
