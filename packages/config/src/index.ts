import { z } from 'zod'

const envSchema = z.object({
  // PostgreSQL
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_DB: z.string().default('flights'),
  POSTGRES_USER: z.string().default('flights'),
  POSTGRES_PASSWORD: z.string().default('flights_secret'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string(),

  // API
  API_PORT: z.coerce.number().default(3000),
  ADMIN_USER: z.string().default('admin'),
  ADMIN_PASSWORD: z.string().default('secret123'),

  // Flight provider
  FLIGHT_PROVIDER: z.enum(['stub', 'google']).default('stub'),

  // Workers
  PRICE_WORKER_INTERVAL_MS: z.coerce.number().default(300_000),
  NOTIFICATION_RATE_LIMIT: z.coerce.number().default(10),
})

export type Env = z.infer<typeof envSchema>

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('❌ Invalid environment variables:')
    for (const err of result.error.errors) {
      console.error(`  ${err.path.join('.')}: ${err.message}`)
    }
    process.exit(1)
  }
  return result.data
}

export const env = parseEnv()

export function getPostgresUrl(): string {
  const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB } = env
  return `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`
}

export function getRedisConfig() {
  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
  }
}
