import type { Config } from 'drizzle-kit'

export default {
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ??
      `postgresql://${process.env['POSTGRES_USER'] ?? 'flights'}:${process.env['POSTGRES_PASSWORD'] ?? 'flights_secret'}@${process.env['POSTGRES_HOST'] ?? 'localhost'}:${process.env['POSTGRES_PORT'] ?? '5432'}/${process.env['POSTGRES_DB'] ?? 'flights'}`,
  },
} satisfies Config
