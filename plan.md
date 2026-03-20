# 0x-flights — plan

## Stage 1 — Foundation
- [x] Monorepo root (package.json, tsconfig, eslint, prettier, .gitignore, .env.example)
- [ ] packages/config — env parsing with Zod
- [ ] packages/shared — types, Zod schemas, queue names
- [ ] packages/db — Drizzle schema + migrations + query helpers

## Stage 2 — API (Elysia)
- [ ] Scaffold apps/api
- [ ] GET /health
- [ ] POST /trackers
- [ ] GET /trackers
- [ ] DELETE /trackers/:id
- [ ] POST /telegram/webhook

## Stage 3 — Telegram Bot
- [ ] Scaffold apps/bot
- [ ] /start, /cancel commands
- [ ] /track multi-step flow (Redis state)
- [ ] /list, /delete commands
- [ ] Inline keyboards + callback_query handler

## Stage 4 — Price Worker
- [ ] Scaffold apps/worker-prices
- [ ] FlightProvider interface + StubProvider
- [ ] AmadeusProvider (behind interface)
- [ ] Route-grouping + BullMQ enqueue

## Stage 5 — Notification Worker
- [ ] Scaffold apps/worker-notifications
- [ ] BullMQ consumer
- [ ] Rate limiting + Telegram send

## Stage 6 — Docker
- [ ] docker-compose.yml

## Stage 7 — Tests
- [ ] Unit tests: shared schemas
- [ ] Unit tests: state machine
- [ ] Integration tests: API endpoints
