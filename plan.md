# 0x-flights — plan

## Stage 1 — Foundation
- [x] Monorepo root (package.json, tsconfig, eslint, prettier, .gitignore, .env.example)
- [x] packages/config — env parsing with Zod
- [x] packages/shared — types, Zod schemas, queue names
- [x] packages/db — Drizzle schema + migrations + query helpers

## Stage 2 — API (Elysia)
- [x] Scaffold apps/api
- [x] GET /health
- [x] POST /trackers
- [x] GET /trackers
- [x] DELETE /trackers/:id
- [x] POST /telegram/webhook

## Stage 3 — Admin page
- [x] GET /adminpage — stats + trackers + Basic Auth
- [x] POST /adminpage/trackers/:id/deactivate
- [x] Users table + ban (deactivate all user trackers)
- [x] Latest price column in trackers table
- [x] Notifications log
- [x] Worker status (last run timestamp from Redis)
- [x] "Run price check now" button (sets Redis trigger flag)

## Stage 4 — Telegram Bot
- [x] Scaffold apps/bot
- [x] /start, /cancel commands
- [x] /track multi-step flow (Redis state)
- [x] /list, /delete commands
- [x] Inline keyboards + callback_query handler

## Stage 5 — Price Worker
- [x] Scaffold apps/worker-prices
- [x] FlightProvider interface + StubProvider
- [ ] AmadeusProvider (behind interface)
- [x] Route-grouping + BullMQ enqueue
- [x] Respect Redis force-run trigger flag from admin
- [x] Write last-run timestamp to Redis for admin status

## Stage 6 — Notification Worker
- [x] Scaffold apps/worker-notifications
- [x] BullMQ consumer
- [x] Rate limiting + Telegram send
- [ ] Priority queue: premium users notified before free users

## Stage 7 — Docker
- [x] docker-compose.yml

## Stage 8 — Tests
- [ ] Unit tests: shared schemas
- [ ] Unit tests: state machine
- [ ] Integration tests: API endpoints

---

## 🔮 Backlog — Premium tier (future)

### User tiers
- `plan` column on users table: 'free' | 'premium'
- Free users: 3 tracker max, notifications at fixed schedule
- Premium users: unlimited trackers, more frequent notifications, silent night alerts

### Scheduled notifications (Moscow time)
- Free users:    08:00 MSK + 20:00 MSK (2x per day)
- Premium users: 08:00 / 12:00 / 16:00 / 20:00 / 00:00 MSK (every 4h, incl. night silent)
- Notifications sent at schedule time — NOT relative to when tracker was created
- At each schedule slot: premium batch runs first, then free batch
- Silent mode flag: if send time is 00:00–08:00 MSK → set disable_notification=true in Telegram API

### Implementation notes
- Replace setInterval in price worker with cron-like scheduler (node-cron or manual)
- Add `is_premium` / `plan` field to users table (migration)
- Notification worker: separate BullMQ queues or job priority for premium vs free
- Timezone: all scheduling in UTC, convert to MSK (UTC+3) for display/logic
