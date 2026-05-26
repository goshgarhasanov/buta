# Buta 🌿

> An Azerbaijani short-video platform. The TikTok model — but faster, more transparent, and fully local.

[![Status](https://img.shields.io/badge/status-active%20development-orange)](#)
[![Stack](https://img.shields.io/badge/stack-NestJS%20%2B%20Next.js%2015-blue)](#)
[![License](https://img.shields.io/badge/license-AGPL--3.0-green)](#)

---

## Why Buta?

**Buta** — named after the *buta* (paisley), a symbol of Azerbaijani culture — gives young users a short-video sharing platform in their own language. The goals:

- A fully **Azerbaijani** UI/UX
- Support for **local content creators**
- **Algorithm transparency** — users know what they see and why
- **Independent infrastructure** — Cloudflare R2 / self-hosted CDN
- All of TikTok's core functionality, plus:
  - Local moderation (Azerbaijani-language NLP)
  - Optional anonymous messaging
  - Watermark-free downloads (with credit to the original author)
  - Creator analytics open to everyone

---

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Monorepo** | pnpm workspaces + Turborepo | Fast builds, caching, shared code |
| **API** | NestJS (TypeScript) | Modular, DI, enterprise-grade |
| **Web** | Next.js 15 (App Router) + React 19 | SSR/RSC, SEO, speed |
| **UI** | TailwindCSS + shadcn/ui + Radix | Accessible, fast, modern |
| **Mobile** | Expo / React Native (Phase 2) | Code sharing, iOS/Android |
| **Worker** | BullMQ + FFmpeg | Video transcoding pipeline |
| **DB** | PostgreSQL 16 + Prisma ORM | ACID, joins, type-safe |
| **Cache/Queue** | Redis 7 | Sessions, feed cache, BullMQ |
| **Storage** | S3 API (MinIO in dev → Cloudflare R2 in prod) | Cheap, fast, CDN integration |
| **Search** | Meilisearch | Fast, with Azerbaijani-language support |
| **Real-time** | Socket.IO | DMs, notifications, live counts |
| **Auth** | JWT (access + refresh), Argon2id, OTP | Secure, frictionless UX |
| **Observability** | OpenTelemetry + Grafana + Loki | Production-ready monitoring |
| **CI/CD** | GitHub Actions + Docker | Automated test + deploy |

> **Why not MERN?** MongoDB is slow without joins for a social graph (followers, mutual likes, feed ranking). PostgreSQL + Prisma deliver type safety *and* performance. NestJS beats bare Express for enterprise needs (DI, guards, decorators, modularity).

---

## Project Structure

```
buta/
├── apps/
│   ├── api/                # NestJS backend (REST + WebSocket)
│   ├── web/                # Next.js — user-facing web app
│   ├── admin/              # Next.js — admin panel
│   └── worker/             # Node.js — video processing, queue consumer
├── packages/
│   ├── shared-types/       # Zod schemas + TypeScript types
│   ├── ui/                 # Shared React components
│   ├── i18n/               # Azerbaijani translations
│   └── config/             # ESLint, Prettier, base tsconfig
├── infra/
│   ├── docker/             # docker-compose.dev.yml (postgres, redis, minio, meili)
│   └── k8s/                # Production manifests (Phase 3)
├── docs/
│   ├── ARCHITECTURE.md     # System design
│   ├── ROADMAP.md          # Phases and milestones
│   ├── API.md              # API contract
│   └── PROJECT_PROMPT.md   # Full project specification
└── .github/workflows/      # CI: test, lint, build, deploy
```

---

## Quick Start (Developers)

### Requirements
- Node.js 22+
- pnpm 11+
- Docker Desktop (for postgres, redis, minio, meilisearch)
- FFmpeg (for the worker)

### Setup

```bash
# Clone the repo
git clone https://github.com/goshgarhasanov/buta.git
cd buta

# Install dependencies
pnpm install

# Bring up infrastructure (postgres, redis, minio, meilisearch)
pnpm infra:up

# Prepare environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Migrate the database
pnpm db:migrate
pnpm db:seed

# Run everything at once (Turbo, in parallel)
pnpm dev
```

### Ports (development)

| Service | Port | URL |
|---------|------|-----|
| Web | 3000 | http://localhost:3000 |
| Admin | 3001 | http://localhost:3001 |
| API | 4000 | http://localhost:4000 |
| WebSocket | 4001 | ws://localhost:4001 |
| Postgres | 5432 | — |
| Redis | 6379 | — |
| MinIO | 9000 / 9001 | http://localhost:9001 |
| Meilisearch | 7700 | http://localhost:7700 |

---

## Core Features (MVP)

- [x] User registration (phone + OTP, email + password, social OAuth)
- [x] Profile (avatar, bio, statistics)
- [x] Video upload (60s limit, FFmpeg transcoding → HLS, thumbnail, preview)
- [x] Vertical feed (For You + Following)
- [x] Like, comment, save, share
- [x] Follow / unfollow
- [x] Hashtags and audio (sound) system
- [x] Notifications (real-time + push)
- [x] Direct messages (1-to-1)
- [x] Search (users, videos, hashtags, audio)
- [x] Admin panel (moderation, statistics, bans)

## Roadmap (Phase 2+)

- Live streaming (RTMP → HLS)
- Effects/filters (WebGL + MediaPipe)
- Stitch, Duet
- Creator monetization (virtual gifts)
- Mobile app (Expo)
- AI moderation (NSFW + Azerbaijani-language hate-speech detection)

---

## License

AGPL-3.0 — a separate license can be negotiated for commercial use.

---

## Team

- **Tech Lead / Founder**: [@goshgarhasanov](https://github.com/goshgarhasanov)

Want to contribute? See `CONTRIBUTING.md` or open an issue.
