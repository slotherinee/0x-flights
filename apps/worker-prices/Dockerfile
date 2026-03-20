FROM oven/bun:1-debian AS base
WORKDIR /app

# Install Python + pip + Playwright system deps
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright + chromium
COPY apps/worker-prices/scraper/requirements.txt ./scraper/requirements.txt
RUN pip3 install --break-system-packages -r ./scraper/requirements.txt \
    && python3 -m playwright install chromium \
    && python3 -m playwright install-deps chromium

# Install Bun deps
COPY package.json bun.lockb* ./
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/worker-prices/package.json ./apps/worker-prices/
RUN bun install --frozen-lockfile

# Copy source
COPY packages/config/src ./packages/config/src
COPY packages/shared/src ./packages/shared/src
COPY packages/db/src ./packages/db/src
COPY packages/db/migrations ./packages/db/migrations
COPY apps/worker-prices/src ./apps/worker-prices/src
COPY apps/worker-prices/scraper ./apps/worker-prices/scraper

CMD ["bun", "run", "apps/worker-prices/src/index.ts"]
