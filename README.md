# Tensura

A modular Discord community platform — Cozy Anime Café aesthetic, built for large servers.

See `TENSURA_ARCHITECTURE.md` for the full system design. This repo currently implements
**Phase 1: Foundation** — monorepo scaffold, config/logging/cache/queue plumbing, the
command/event pipeline, and one working command (`/ping`) proving the whole path end to end.

## Stack

pnpm + Turborepo · TypeScript (strict) · discord.js v14 · PostgreSQL + Prisma · Redis + BullMQ
Docker Compose (local) · Railway (production, Dockerfile-based, cloud-agnostic)

## Local setup

**Prereqs:** Node 20+, pnpm 9+, Docker (for Postgres/Redis).

```bash
# 1. Install dependencies
pnpm install

# 2. Start Postgres + Redis
docker compose -f infra/docker-compose.yml up -d postgres redis

# 3. Configure environment
cp .env.example .env
# Fill in DISCORD_TOKEN and DISCORD_CLIENT_ID at minimum
# (Discord Developer Portal -> your application -> Bot / General Information)

# 4. Run migrations
pnpm db:migrate

# 5. Register slash commands to your dev guild
#    Set DISCORD_DEV_GUILD_IDS in .env first for instant registration
pnpm registry:sync

# 6. Start the bot
pnpm dev:bot
```

Run `/ping` in your dev server once the bot logs "Tensura is online".

## Monorepo layout

```
apps/bot        Discord gateway process (this is what runs in Phase 1)
apps/api        (Phase 11+) Fastify + tRPC service for the dashboard
apps/workers    (Phase 2+) BullMQ workers — starts with card rendering
packages/core            Domain services, one folder per module (packages/core/src/modules/*)
packages/database        Prisma schema + client
packages/config          Env validation
packages/logger          Structured logging
packages/cache           Redis client + cache-aside helpers
packages/queue           BullMQ connection/queue registry
packages/types           Shared DTOs, domain event contracts
packages/ui-kit          Embed builders + Cozy Café color tokens
```

## Full-stack commands

```bash
pnpm dev            # run every app in parallel
pnpm build           # build everything via Turborepo
pnpm lint            # lint everything
pnpm typecheck        # typecheck everything
pnpm test              # run all tests
pnpm db:studio         # Prisma Studio GUI (run inside packages/database)
```

## Production (Railway)

Each app (`apps/bot`, later `apps/api`, `apps/workers`) is its own Railway service, built from
its `Dockerfile` with the **repo root as build context** (`railway.json` in each app folder
points `dockerfilePath` back to itself). Add Postgres and Redis as Railway plugins — they inject
`DATABASE_URL` / `REDIS_URL` automatically, matching what `packages/config` expects.

The same Dockerfiles work unmodified on any Docker host (VPS, Render, Fly.io, k8s) — nothing
Railway-specific is baked into the images themselves, only the `railway.json` build pointers.

## What's next

Phase 2 (design system core — `packages/render` + the reference rank-card template) is the next
increment per the roadmap in `TENSURA_ARCHITECTURE.md` §12.
