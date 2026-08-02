# Build from the monorepo root: docker build -f apps/bot/Dockerfile .
FROM node:20-slim AS base
RUN corepack enable
WORKDIR /repo

# ── deps: install once, cached across builds ─────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/bot/package.json apps/bot/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/logger/package.json packages/logger/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/cache/package.json packages/cache/package.json
COPY packages/queue/package.json packages/queue/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/ui-kit/package.json packages/ui-kit/package.json
COPY packages/types/package.json packages/types/package.json
RUN pnpm install --frozen-lockfile

# ── build: compile TS for the bot and every package it depends on ─
FROM deps AS build
COPY . .
RUN pnpm --filter @tensura/database run generate
RUN pnpm turbo run build --filter=@tensura/bot...

# ── runtime: slim image, production deps only ──────────────────
FROM node:20-slim AS runtime
RUN corepack enable
WORKDIR /repo
ENV NODE_ENV=production

COPY --from=build /repo .
RUN pnpm install --frozen-lockfile --prod

WORKDIR /repo/apps/bot
CMD ["node", "dist/shard-manager.js"]
