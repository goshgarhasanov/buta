# Buta 🌿

> Azərbaycan dilində qısa video platforması. TikTok modeli — amma daha sürətli, daha şəffaf, tam yerli.

[![Status](https://img.shields.io/badge/status-active%20development-orange)](#)
[![Stack](https://img.shields.io/badge/stack-NestJS%20%2B%20Next.js%2015-blue)](#)
[![License](https://img.shields.io/badge/license-AGPL--3.0-green)](#)

---

## Nə üçün Buta?

**Buta** — Azərbaycan mədəniyyətinin simvolu olan butadan ilhamlanmış adla, gənc istifadəçilərə öz dilində qısa video bölüşmə platforması təqdim edir. Məqsəd:

- Tam **Azərbaycan dilində** UI/UX
- **Yerli kontent yaradıcılarına** dəstək
- **Algoritm şəffaflığı** — istifadəçi nə görür və niyə bilir
- **Müstəqil infrastruktur** — Cloudflare R2 / öz CDN-i
- TikTok-un bütün əsas funksionallığı + əlavə olaraq:
  - Yerli moderasiya (AZ dili NLP)
  - Anonim mesajlaşma seçimi
  - Watermark-suz yüklənmə (orijinal müəllifə kreditə qarşı)
  - Yaradıcı analitika hamı üçün açıq

---

## Texnoloji Stek

| Layer | Texnologiya | Səbəb |
|-------|-------------|-------|
| **Monorepo** | pnpm workspaces + Turborepo | Sürətli build, cache, shared code |
| **API** | NestJS (TypeScript) | Modular, DI, enterprise-grade |
| **Web** | Next.js 15 (App Router) + React 19 | SSR/RSC, SEO, sürət |
| **UI** | TailwindCSS + shadcn/ui + Radix | Accessible, sürətli, modern |
| **Mobile** | Expo / React Native (Faza 2) | Code share, iOS/Android |
| **Worker** | BullMQ + FFmpeg | Video transcoding pipeline |
| **DB** | PostgreSQL 16 + Prisma ORM | ACID, joins, type-safe |
| **Cache/Queue** | Redis 7 | Session, feed cache, BullMQ |
| **Storage** | S3-API (MinIO dev → Cloudflare R2 prod) | Ucuz, sürətli, CDN inteqrasiya |
| **Search** | Meilisearch | Sürətli, AZ dili dəstəyi |
| **Real-time** | Socket.IO | DM, notification, live count |
| **Auth** | JWT (access+refresh), Argon2id, OTP | Təhlükəsiz, sessiz UX |
| **Observability** | OpenTelemetry + Grafana + Loki | Prod-ready monitoring |
| **CI/CD** | GitHub Actions + Docker | Automated test+deploy |

> **MERN niyə yox?** MongoDB social graph (followers, mutual likes, feed ranking) üçün join-suz yavaşdır. PostgreSQL + Prisma type-safe + performans verir. NestJS Express-dən enterprise üçün üstün (DI, guards, decorators, modular).

---

## Layihə Strukturu

```
buta/
├── apps/
│   ├── api/                # NestJS backend (REST + WebSocket)
│   ├── web/                # Next.js — istifadəçi web tətbiqi
│   ├── admin/              # Next.js — admin paneli
│   └── worker/             # Node.js — video processing, queue consumer
├── packages/
│   ├── shared-types/       # Zod schemas + TypeScript types
│   ├── ui/                 # Paylaşılan React komponentləri
│   ├── i18n/               # Azərbaycan dili tərcümələri
│   └── config/             # ESLint, Prettier, tsconfig base
├── infra/
│   ├── docker/             # docker-compose.dev.yml (postgres, redis, minio, meili)
│   └── k8s/                # Production manifests (Faza 3)
├── docs/
│   ├── ARCHITECTURE.md     # Sistem dizaynı
│   ├── ROADMAP.md          # Fazalar və milestone-lar
│   ├── API.md              # API müqaviləsi
│   └── PROJECT_PROMPT.md   # Tam layihə spesifikasiyası
└── .github/workflows/      # CI: test, lint, build, deploy
```

---

## Sürətli Başlanğıc (Developer)

### Tələblər
- Node.js 22+
- pnpm 11+
- Docker Desktop (postgres, redis, minio, meilisearch üçün)
- FFmpeg (worker üçün)

### Quraşdırma

```bash
# Repo-nu klonla
git clone https://github.com/goshgarhasanov/buta.git
cd buta

# Asılılıqları quraşdır
pnpm install

# İnfrastrukturu qaldır (postgres, redis, minio, meilisearch)
pnpm infra:up

# Mühit dəyişənlərini hazırla
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Verilənlər bazasını miqrasiya et
pnpm db:migrate
pnpm db:seed

# Hamısını birdən işə sal (Turbo paralel)
pnpm dev
```

### Portlar (development)

| Servis | Port | URL |
|--------|------|-----|
| Web | 3000 | http://localhost:3000 |
| Admin | 3001 | http://localhost:3001 |
| API | 4000 | http://localhost:4000 |
| WebSocket | 4001 | ws://localhost:4001 |
| Postgres | 5432 | — |
| Redis | 6379 | — |
| MinIO | 9000 / 9001 | http://localhost:9001 |
| Meilisearch | 7700 | http://localhost:7700 |

---

## Əsas Funksiyalar (MVP)

- [x] İstifadəçi qeydiyyatı (telefon + OTP, email + parol, sosial OAuth)
- [x] Profil (avatar, bio, statistika)
- [x] Video yüklə (60s limit, FFmpeg transcoding → HLS, thumbnail, preview)
- [x] Vertical feed (For You + Following)
- [x] Like, comment, save, share
- [x] Follow / unfollow
- [x] Hashtag və ses (audio) sistemi
- [x] Bildirişlər (real-time + push)
- [x] DM (1-1 mesajlaşma)
- [x] Search (istifadəçi, video, hashtag, audio)
- [x] Admin paneli (moderasiya, statistika, ban)

## Genişlənmə (Faza 2+)

- Live streaming (RTMP → HLS)
- Effekt/filter (WebGL + MediaPipe)
- Stitch, Duet
- Yaradıcı monetizasiyası (virtual hədiyyə)
- Mobil tətbiq (Expo)
- AI moderasiya (NSFW, AZ dili nifrət nitqi detection)

---

## Lisenziya

AGPL-3.0 — Kommersiya istifadəsi üçün ayrıca lisenziya müzakirə oluna bilər.

---

## Komanda

- **Tech Lead / Founder**: [@goshgarhasanov](https://github.com/goshgarhasanov)

Töhfə vermək istəyirsiniz? `CONTRIBUTING.md` faylına baxın və ya issue açın.
