<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,25,30&height=220&section=header&text=Tensura&fontSize=80&fontAlignY=38&desc=Modular%20Discord%20Community%20Platform%20%7C%20Cozy%20Anime%20Caf%C3%A9%20Aesthetic&descAlignY=60&animation=fadeIn&fontColor=ffffff" width="100%"/>

<br/>

[![Discord.js](https://img.shields.io/badge/Discord.js-v14.15-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)](https://turbo.build/repo)
[![pnpm](https://img.shields.io/badge/pnpm-v9.1-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io)
[![Prisma](https://img.shields.io/badge/Prisma-PostgreSQL-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://prisma.io)
[![Redis](https://img.shields.io/badge/Redis-ioredis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)

<br/>

> **A high-concurrency, modular Discord community engine designed with a cozy anime-café theme.**  
> Engineered from the ground up as a production-ready TypeScript monorepo featuring sharded gateway connections, atomic Redis rate-limiting, and dynamic Canvas-rendered rank cards.

<br/>

**[⚡ Architecture Overview](#-monorepo-architecture) &nbsp;•&nbsp; [🎮 Key Systems](#-core-systems) &nbsp;•&nbsp; [🛠️ Tech Stack](#-technology-stack) &nbsp;•&nbsp; [🚀 Quickstart](#-getting-started) &nbsp;•&nbsp; [📦 Package Ecosystem](#-workspace-packages)**

<br/>

</div>

---

## ☕ What is Tensura?

Tensura is an enterprise-grade community platform tailored for large-scale Discord servers. Rather than a monolithic single-file bot script, Tensura is structured as a **Turborepo monorepo** with decoupled workspaces for database access, caching, graphics rendering, structured logging, and sharded gateway execution.

It blends robust backend distributed systems practices (concurrency management, atomic Redis cooldown locks, sharded process supervision) with an engaging anime-café visual identity.

---

## 🎮 Core Systems

### 1. Leveling & Atomic Redis Locks
- Earn XP dynamically on chat interactions with configurable multipliers.
- Redis (`ioredis`) enforces distributed cooldown locks to prevent spam exploits without hammering the primary database.
- Level-up announcements with customizable server roles and notifications.

### 2. Canvas-Rendered Rank Cards
- Custom `@tensura/render` graphic pipeline using Canvas.
- Generates dynamic, stylized anime-themed player profile and rank cards on the fly.
- Displays server avatar, level progress bar, rank number, and custom badges.

### 3. Guild Configuration Pipeline
- Per-server configuration stored in PostgreSQL via Prisma ORM.
- Granular module gating: toggle specific command groups, set audit log channels, and assign reward roles.

### 4. Sharded Process Architecture
- Built-in `shard-manager.ts` splits gateway connections across multiple CPU processes.
- Automatic shard respawning and load balancing for high-density Discord servers.

### 5. Structured Telemetry & Diagnostics
- High-throughput logging via `@tensura/logger` powered by **Pino**.
- Traceable request lifecycles and event handler timings.

---

## ⚡ Monorepo Architecture

Tensura is managed via **Turborepo** and **pnpm workspaces**:

```
tensura/
├── apps/
│   ├── bot/                 # Discord gateway client, commands, sharding supervisor
│   ├── api/                 # REST API gateway (Phase 2)
│   └── workers/             # Asynchronous task workers via BullMQ (Phase 2)
├── packages/
│   ├── database/            # Prisma schema, migrations, and typed client
│   ├── cache/               # Redis connection manager and caching helpers (ioredis)
│   ├── core/                # Shared domain logic, command handlers, permissions
│   ├── render/              # Canvas graphic rendering for dynamic rank cards
│   ├── logger/              # Pino high-performance structured JSON logging
│   ├── config/              # Zod-validated environment configurations
│   ├── design-system/       # Anime café theme tokens, color palettes, typography
│   ├── queue/               # Job queue contracts
│   ├── types/               # Shared TypeScript type definitions
│   └── ui-kit/              # Shared UI components
├── turbo.json               # Pipeline build graph and task caching
└── pnpm-workspace.yaml      # Multi-package workspace definition
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Bot Framework** | `discord.js` v14.15 | Discord Gateway & REST interactions |
| **Language** | TypeScript 5.5 | Type safety across entire monorepo |
| **Monorepo Tooling** | Turborepo + pnpm 9.1 | Fast incremental builds & parallel task execution |
| **Database** | PostgreSQL | Persistent storage for users, guilds, and levels |
| **ORM** | Prisma | Type-safe database client and automated migrations |
| **Cache & Cooldowns** | Redis (`ioredis`) | High-speed cache, XP rate-limiting & atomic locks |
| **Image Generation** | Canvas / Node Canvas | Server-side rendering for custom anime rank cards |
| **Logging** | Pino | Zero-overhead structured logging |

---

## 🚀 Getting Started

### Prerequisites
- Node.js `>= 20.0.0`
- pnpm `>= 9.1.0` (`corepack enable pnpm` or `npm i -g pnpm`)
- PostgreSQL instance
- Redis instance
- Discord Bot Token & Application ID ([Discord Developer Portal](https://discord.com/developers/applications))

### 1. Installation

```bash
git clone https://github.com/B-Jai12/tensura.git
cd tensura
pnpm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your credentials:
```env
DISCORD_TOKEN=your_bot_token_here
APPLICATION_ID=your_discord_app_id
DATABASE_URL=postgresql://user:password@localhost:5432/tensura
REDIS_URL=redis://localhost:6379
```

### 3. Database Sync

Generate Prisma client and push schema to PostgreSQL:
```bash
pnpm --filter @tensura/database run db:push
```

*(Optional: launch Prisma Studio to visually inspect tables)*
```bash
pnpm --filter @tensura/database run db:studio
```

### 4. Running the Development Bot

Run the bot with hot-reloading:
```bash
pnpm dev:bot
```

To build all packages across the entire monorepo:
```bash
pnpm build
```

---

## 👤 Author

**Jaideep Botla** ([@B-Jai12](https://github.com/B-Jai12))  
B.Tech AIML Student & Systems Builder • Architecting scalable distributed systems and interactive developer experiences.