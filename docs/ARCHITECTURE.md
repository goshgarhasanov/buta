# Arxitektura

## Sistem diaqramı

```
                          ┌──────────────────┐
                          │   Cloudflare     │
                          │  CDN + R2 + WAF  │
                          └────────┬─────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
        ┌──────────┐         ┌──────────┐         ┌──────────┐
        │   Web    │         │  Admin   │         │  Mobile  │
        │ (Next15) │         │ (Next15) │         │ (Expo)   │
        └────┬─────┘         └────┬─────┘         └────┬─────┘
             └────────────────────┼────────────────────┘
                                  ▼
                          ┌──────────────┐
                          │  API Gateway │ ◄── nginx/Caddy
                          └──────┬───────┘
                                 ▼
            ┌────────────────────┴─────────────────────┐
            │                                          │
            ▼                                          ▼
      ┌──────────┐                              ┌────────────┐
      │   API    │ ◄────── WebSocket ─────────► │  Realtime  │
      │ (NestJS) │                              │ (Socket.IO)│
      └────┬─────┘                              └────────────┘
           │
   ┌───────┼────────┬─────────┬─────────┐
   ▼       ▼        ▼         ▼         ▼
┌─────┐ ┌─────┐ ┌──────┐ ┌─────────┐ ┌────────┐
│  PG │ │Redis│ │MinIO │ │Meili-   │ │BullMQ  │
│     │ │     │ │ / R2 │ │search   │ │queue   │
└─────┘ └─────┘ └──────┘ └─────────┘ └───┬────┘
                                          ▼
                                    ┌──────────┐
                                    │  Worker  │
                                    │ (FFmpeg) │
                                    └──────────┘
```

## Layer və məsuliyyətlər

### Frontend (apps/web, apps/admin)
- **Texnologiya**: Next.js 15 App Router, React 19, Tailwind, shadcn/ui
- **State**: TanStack Query (server state), Zustand (UI state)
- **Auth**: Access token in-memory + refresh token httpOnly cookie
- **Routing**: SSR for public pages, CSR for feed/auth

### Backend (apps/api)
- **Texnologiya**: NestJS 11, Prisma 6, Pino logger
- **Pattern**: Module → Controller → Service → Repository (Prisma)
- **Validation**: class-validator + Zod (zone üçün uyğun olan)
- **Cache**: Redis (sessions, feed cache, rate limit)
- **Queue**: BullMQ (Redis-based) — video transcode, thumbnail, push notification

### Worker (apps/worker)
- **Texnologiya**: Node.js + BullMQ consumer + fluent-ffmpeg
- **İşlər**:
  - `video-transcode` — HLS 3 variant
  - `thumbnail-extract` — JPEG + animated GIF
  - `notification-push` — FCM / Web Push
  - `search-index` — Meilisearch sync
  - `feed-recompute` — hotness score (cron)

### Database (PostgreSQL)
- **Niyə PG?** ACID, joins, indexes, JSON dəstəyi, mature ekosistem
- **Migrations**: Prisma Migrate, hər PR-də yeni miqrasiya
- **Backup**: prod-da hər saatda WAL + gündəlik snapshot
- **Counters**: denormalized (likeCount, viewCount) + periodic recount cron

### Storage
- **Dev**: MinIO (S3-compatible, lokal Docker)
- **Prod**: Cloudflare R2 (no egress fees) və ya Backblaze B2
- **Bucket-lar**:
  - `buta-videos` — original + HLS variants
  - `buta-thumbnails` — JPEG, WebP
  - `buta-avatars` — istifadəçi profil şəkilləri
- **Lifecycle**: original file 30 gündən sonra arxiv class-a köçür

### Search
- **Engine**: Meilisearch (typo-tolerant, sürətli, AZ unicode-u yaxşı handle edir)
- **İndekslər**: users, videos, hashtags, audios
- **Sync**: API yaza-yaza, BullMQ event-lə (eventual consistency)

### CDN / Edge
- **Provider**: Cloudflare
- **Cache**:
  - Static assets: 1 il
  - Thumbnails: 7 gün
  - HLS playlists: 30s (rapid update), .ts segments: 1 saat
- **WAF**: Cloudflare default + custom rules (bot detection, rate limit)

## Auth axını

```
Register/Login
  └─► API.auth.issueTokens()
        ├─► accessToken (JWT, 15min, in-memory client)
        └─► refreshToken (random 96-char, httpOnly cookie, 30d)
              └─► DB.sessions.create() — token sha256 hash saxlanır

Hər API çağırışı:
  ├─► Authorization: Bearer <access>
  └─► 401 alanda:
        └─► POST /auth/refresh (cookie)
              ├─► Köhnə session revoke
              └─► Yeni access + refresh (rotation)

Logout:
  └─► POST /auth/logout
        ├─► refresh session revoke
        └─► cookie sil
```

## Feed alqoritmi (genişlənən)

### MVP — Trending + Recency
```
score(video) = hotness * 0.6 + recency * 0.4
hotness = (likes + comments*3 + shares*5 + saves*4) / max(1, ageHours^1.5)
recency = 1 / (1 + ageHours / 24)
```

### V2 — Engagement-weighted ranking
Watch completion rate ən vacib signal:
```
finishRate(video) = avg(watchPercent across views)
score = α*hotness + β*finishRate + γ*creatorAffinity
```

### V3 — Two-tower retrieval + re-rank
- Tower 1 (user): demoqrafik + watch history embedding
- Tower 2 (video): caption + audio + hashtag + creator embedding
- Re-rank: gradient-boosted tree

## Təhlükəsizlik

| Layer | Qoruma |
|-------|--------|
| Network | Cloudflare WAF + DDoS, rate limit |
| Transport | TLS 1.3, HSTS, secure cookies |
| Auth | Argon2id parol, JWT ES256, refresh rotation |
| Input | Zod/class-validator hər DTO-da |
| Output | React escape + DOMPurify user HTML üçün |
| File | MIME + magic bytes + FFmpeg validation |
| Rate | Redis sliding window per IP+user |
| Audit | Bütün admin əməliyyatları DB-də |
| Secrets | .env (dev), secret manager (prod) |

## Observability

- **Logs**: Pino → stdout → Loki (prod), prettyprint dev
- **Metrics**: Prometheus (NestJS metrics module)
- **Traces**: OpenTelemetry → Tempo
- **Dashboards**: Grafana
- **Alerts**: Slack webhook + email
- **Sentry**: error tracking (frontend + backend)

## Deployment

### Dev
- pnpm dev = Turbo paralel: API, Web, Worker, Admin
- Docker compose dev: postgres, redis, minio, meilisearch, mailhog

### Staging
- Single VPS (Hetzner CX31)
- Docker Compose, Caddy reverse proxy
- GitHub Actions auto-deploy `develop` branch

### Prod
- Hetzner Cloud / DigitalOcean
- K8s (Talos / k3s) — 3 worker node
- Postgres managed (Supabase / Neon) və ya self-hosted with PgBouncer
- Redis managed (Upstash) və ya self
- Cloudflare R2 storage
- Cloudflare CDN + WAF
- Helm chart-lar `infra/k8s/`-də

## Genişlənmə

### Vertikal scale
- Postgres connection pool (PgBouncer)
- Redis cluster
- Read replicas

### Horizontal scale
- API stateless → çoxlu pod
- Worker concurrent → çoxlu pod
- BullMQ partitioned queues (per-priority, per-type)
- Sticky sessions WebSocket üçün

### Database sharding (gələcəkdə)
- User-id ilə hash shard
- Video metadata global, time-series view-logs partitioned
