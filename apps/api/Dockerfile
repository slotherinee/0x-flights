FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install deps
COPY package.json bun.lockb* ./
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/
RUN bun install --frozen-lockfile

# Copy source
COPY packages/config/src ./packages/config/src
COPY packages/shared/src ./packages/shared/src
COPY packages/db/src ./packages/db/src
COPY packages/db/migrations ./packages/db/migrations
COPY apps/api/src ./apps/api/src

EXPOSE 3000
CMD ["bun", "run", "apps/api/src/index.ts"]
