# Tensura — Discord Community Bot

> A modular Discord community platform with a cozy anime-cafe aesthetic, built for large servers.

---

## What It Does

Tensura is a production-grade Discord bot platform built to handle large communities with:
- **Leveling system** — XP gain on messages with cooldown enforcement via Redis atomic locks
- **Rank cards** — Canvas-rendered user rank cards with anime-themed branding
- **Guild configuration** — Per-server settings stored in PostgreSQL
- **Command pipeline** — Middleware-based command execution with module gating
- **Background workers** — BullMQ job queues for async tasks (Redis-backed)

---

## Architecture

`
Monorepo (pnpm + Turborepo)
├── apps/
│   ├── bot/          # discord.js v14 client, commands, events, sharding
│   ├── api/          # REST API (planned Phase 2)
│   └── workers/      # BullMQ background workers (planned Phase 2)
└── packages/
    ├── database/     # Prisma ORM + PostgreSQL schema
    ├── cache/        # Redis client (ioredis)
    ├── config/       # Zod-validated environment config
    ├── logger/       # Pino structured logging
    ├── render/       # Canvas-based image rendering
    ├── design-system/# Brand tokens, color palettes
    └── types/        # Shared TypeScript types
`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+, TypeScript (strict) |
| Discord | discord.js v14, slash commands |
| Database | PostgreSQL + Prisma ORM |
| Cache/Queue | Redis (ioredis) + BullMQ |
| Build | pnpm + Turborepo |
| Deployment | Railway (Dockerfile-based) |
| Rendering | canvas (rank cards) |

---

## Local Setup

**Prerequisites:** Node.js 20+, pnpm 9+, Docker (for Postgres + Redis locally)

`ash
# 1. Clone
git clone https://github.com/B-Jai12/tensura.git
cd tensura

# 2. Install dependencies
pnpm install

# 3. Start Postgres + Redis (Docker)
docker compose -f infra/docker-compose.yml up -d postgres redis

# 4. Configure environment
cp .env.example .env
# Edit .env and fill in DISCORD_TOKEN and DISCORD_CLIENT_ID

# 5. Run database migrations
pnpm db:migrate

# 6. Register slash commands (dev guild)
pnpm -F @tensura/bot registry:sync

# 7. Start the bot in development mode
pnpm -F @tensura/bot dev
`

---

## Environment Variables

Copy .env.example to .env and fill in:

| Variable | Description |
|----------|------------|
| DISCORD_TOKEN | Bot token from Discord Developer Portal |
| DISCORD_CLIENT_ID | Application ID from Discord Developer Portal |
| DISCORD_DEV_GUILD_IDS | Comma-separated guild IDs for dev command registration |
| DATABASE_URL | PostgreSQL connection string |
| REDIS_URL | Redis connection string |

**Never commit .env — it is already in .gitignore.**

---

## Deployment (Railway)

1. Push to GitHub
2. Create a Railway project
3. Add PostgreSQL and Redis plugins
4. Set DISCORD_TOKEN, DISCORD_CLIENT_ID as environment variables
5. Railway auto-detects the Dockerfile and deploys

---

## Current Status

**Phase 1 Complete:**
- Full monorepo scaffold
- Config, logging, cache, queue plumbing
- Command/event pipeline with middleware
- Guild initialization and configuration
- XP leveling with Redis atomic cooldowns
- Rank card rendering
- /ping, /help, /config, /rank commands

**Phase 2 Planned:**
- REST API for web dashboard
- Moderation commands
- Music queue integration
- Economy system

---

## Author

Built by [B-Jai12](https://github.com/B-Jai12)