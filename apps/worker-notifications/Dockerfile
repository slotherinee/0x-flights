FROM oven/bun:1-alpine AS base
WORKDIR /app

COPY package.json bun.lockb* ./
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/worker-notifications/package.json ./apps/worker-notifications/
RUN bun install --frozen-lockfile

COPY packages/config/src ./packages/config/src
COPY packages/shared/src ./packages/shared/src
COPY packages/db/src ./packages/db/src
COPY apps/worker-notifications/src ./apps/worker-notifications/src

CMD ["bun", "run", "apps/worker-notifications/src/index.ts"]
