FROM oven/bun:1-alpine AS base
WORKDIR /app

COPY package.json bun.lockb* ./
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY apps/bot/package.json ./apps/bot/
RUN bun install --frozen-lockfile

COPY packages/config/src ./packages/config/src
COPY packages/shared/src ./packages/shared/src
COPY apps/bot/src ./apps/bot/src

CMD ["bun", "run", "apps/bot/src/index.ts"]
