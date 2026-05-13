# Buta — Layihə Tam Spesifikasiyası

> Bu sənəd Buta layihəsinin tam texniki və məhsul spesifikasiyasıdır. AI asistent və ya yeni komanda üzvü üçün **vahid həqiqət mənbəyi (single source of truth)**.

---

## 1. Layihə Xülasəsi

**Buta** — Azərbaycan dilində qısa video paylaşım platforması. TikTok modeli, lakin yerli auditoriya, şəffaf alqoritm və müstəqil infrastruktur ilə.

### Hədəf istifadəçi
- 16-35 yaş Azərbaycandilli auditoriya
- Diaspor (Türkiyə, Rusiya, Avropa)
- Yerli kontent yaradıcıları (musiqi, komediya, təhsil, blogger)

### Uğur metrikləri
- **MVP**: 1000 aktiv istifadəçi, gündə 100 video
- **6 ay**: 50k MAU, gündə 5000 video
- **1 il**: 500k MAU, monetizasiya başlangıcı

---

## 2. Texniki Arxitektura

### 2.1 Stack qərarları və əsaslandırma

#### Backend — NestJS
- **Niyə Express deyil?** Enterprise app-larda DI, decorators, modul sistemi vaxtı qoruyur. Express manuel route+middleware composition tələb edir.
- **Niyə Fastify deyil?** NestJS Fastify adapter ilə Fastify-i istifadə edə bilir — istəsək keçə bilərik. Fastify-in benchmark üstünlüyü I/O bound app-larda çox da hiss edilmir.
- **Niyə Go/Rust deyil?** Komanda Node.js bilir; deyiş-rüstlər (developer velocity) prod yetişməyə kömək edir. Hot path (video processing) üçün Go-ya bir-bir servisi daha sonra köçürmək olar.

#### Frontend — Next.js 15 + React 19
- App Router + RSC = SEO + performans
- TanStack Query for client cache
- Zustand for global UI state (modallar, sidebar)
- Tailwind + shadcn/ui — yerli, copy-paste, customizable

#### Database — PostgreSQL + Prisma
- **Niyə MongoDB yox?** Social graph (followers, comments tree, feed ranking) join-ler və complex query tələb edir. MongoDB pipeline yavaş və qəliz olur.
- **Niyə Prisma?** Type-safe queries, miqrasiya yönetimi, schema-first.
- **Hibrid yanaşma**: Mesaj loglar, analytics events üçün **ClickHouse** (Faza 2).

#### Storage — S3-compatible
- Dev: MinIO (lokal Docker)
- Prod: Cloudflare R2 (no egress fees, sürətli CDN)
- Alternativ: Bunny CDN + Storage (ucuz)

#### Video pipeline
1. Web/mobile-dən raw upload (multipart → API) → MinIO
2. API yüklə tamamlananda BullMQ-yə job qoyur
3. Worker FFmpeg ilə:
   - HLS variantlar (480p, 720p, 1080p)
   - WebP thumbnail (3 frame: 0%, 25%, 50%)
   - Animated preview (3s GIF, autoplay üçün)
   - Audio fingerprint (gələcək telif hüquqları üçün)
4. Hazır olunca status `READY` → feed-də göstərilir

### 2.2 Servislər və portlar

```
┌─────────────────────────────────────────────────────┐
│                   Cloudflare CDN                     │
│  (videos, thumbnails, static assets via R2)         │
└─────────────────────────────────────────────────────┘
              │                       │
              ▼                       ▼
   ┌──────────────────┐    ┌──────────────────┐
   │  Web (Next.js)   │    │  Admin (Next.js) │
   │  :3000           │    │  :3001           │
   └────────┬─────────┘    └────────┬─────────┘
            │                       │
            └───────────┬───────────┘
                        ▼
              ┌──────────────────┐
              │  API Gateway     │   ◄── WAF / Rate limit
              │  (Caddy/nginx)   │
              └────────┬─────────┘
                       ▼
   ┌───────────────────────────────────────────┐
   │  API (NestJS) :4000                       │
   │  - REST endpoints                          │
   │  - WebSocket gateway (:4001)               │
   │  - GraphQL (optional, Faza 2)              │
   └──┬────────────┬─────────────┬──────────────┘
      │            │             │
      ▼            ▼             ▼
   ┌──────┐    ┌──────┐    ┌────────────┐
   │ PG   │    │Redis │    │ Meilisearch│
   │ :5432│    │:6379 │    │ :7700      │
   └──────┘    └──┬───┘    └────────────┘
                  │
                  ▼
            ┌──────────────────┐
            │  Worker (Node)   │
            │  BullMQ consumer │
            │  + FFmpeg        │
            └────────┬─────────┘
                     ▼
            ┌──────────────────┐
            │  MinIO / R2      │
            │  Object storage  │
            └──────────────────┘
```

---

## 3. Verilənlər Modeli (Prisma)

Ətraflı schema `apps/api/prisma/schema.prisma` faylındadır. Əsas entitilər:

### User
- `id`, `username` (unique), `phone`, `email`, `passwordHash`
- `displayName`, `bio`, `avatarUrl`, `verified`
- `followerCount`, `followingCount`, `videoCount`, `likeCount` (denormalized)
- `language` (default: 'az')
- `createdAt`, `lastSeenAt`

### Video
- `id`, `userId`, `caption`, `hashtags[]`, `audioId?`
- `originalUrl`, `hlsUrl`, `thumbnailUrl`, `previewGifUrl`
- `duration`, `width`, `height`, `aspectRatio`
- `status` (UPLOADING | PROCESSING | READY | FAILED | REMOVED)
- `viewCount`, `likeCount`, `commentCount`, `shareCount`, `saveCount`
- `visibility` (PUBLIC | FOLLOWERS | PRIVATE)
- `createdAt`

### Follow
- `followerId`, `followingId`, `createdAt`
- Composite PK: (followerId, followingId)

### Like
- `userId`, `videoId`, `createdAt`
- Composite PK

### Comment
- `id`, `videoId`, `userId`, `parentId?`, `text`, `likeCount`
- Threaded (parent → replies)

### Hashtag
- `id`, `name` (unique, lowercase), `videoCount`, `trending`

### Audio
- `id`, `name`, `artistName`, `originalVideoId?`, `url`, `duration`
- `videoCount`

### Notification
- `id`, `userId`, `type` (LIKE | COMMENT | FOLLOW | MENTION | SYSTEM)
- `actorId?`, `videoId?`, `commentId?`, `read`, `createdAt`

### Chat / Message
- `Chat`: `id`, `userAId`, `userBId`, `lastMessageAt`
- `Message`: `id`, `chatId`, `senderId`, `text`, `mediaUrl?`, `readAt?`

### Report
- `id`, `reporterId`, `targetType`, `targetId`, `reason`, `status`, `resolvedBy?`

---

## 4. API Dizaynı

REST + WebSocket. GraphQL Faza 2-də qoşula bilər.

### Convention
- Base URL: `https://api.buta.az/v1`
- Auth: `Authorization: Bearer <access_token>`
- Refresh: cookie ilə (httpOnly, secure)
- Errors: RFC 7807 Problem Details format
- Versionlama: URL prefix (`/v1`, `/v2`)

### Əsas endpoint qrupları
- `/auth` — register, login, refresh, otp, logout
- `/users` — profile, follow, unfollow, search
- `/videos` — upload, feed, video detail, delete
- `/feed` — `/feed/foryou`, `/feed/following`
- `/comments` — list, create, delete, like
- `/likes` — like, unlike
- `/hashtags` — trending, detail
- `/audios` — trending, detail
- `/chats` — list, messages, send
- `/notifications` — list, mark read
- `/search` — unified search
- `/admin/*` — moderasiya endpoint-ləri

Ətraflı `docs/API.md`-də.

---

## 5. Təhlükəsizlik

- **Parol**: Argon2id (memory cost 64MB, iterations 3)
- **JWT**: ES256, access 15min, refresh 30 gün (rotation)
- **Refresh token**: DB-də hash-lənmiş şəkildə saxlanılır (revoke üçün)
- **Rate limiting**: Redis-based, sliding window (login: 5/min, upload: 10/saat)
- **CSRF**: SameSite cookies + double-submit token
- **CORS**: whitelist
- **Input validation**: Zod hər DTO üçün
- **SQL injection**: Prisma parameterized
- **XSS**: React default escaping + DOMPurify istifadəçi HTML üçün
- **File upload**: MIME type check, magic bytes check, FFmpeg ilə validation, antivirus (ClamAV, Faza 2)
- **Telefon OTP**: TTL 5 min, 3 cəhd, sonra 10 min lock
- **Hesab ban**: shadow ban + hard ban
- **Audit log**: kritik əməliyyatlar (admin actions, ban, video remove)

---

## 6. Feed Alqoritmi (MVP → V2)

### MVP (1-ci ay)
- **For You**: Yeni videolar + populyar (son 48 saat içində like/view ratio) + diversity (eyni müəlifdən 3-dən çox ardıcıl yox)
- **Following**: Xronoloji, izlənilən istifadəçilərdən

### V2 (3-cü ay)
- Implicit feedback (watch time, completion rate, like, comment, share)
- Item-CF və ya simple two-tower model (PyTorch worker)
- Cold start: hashtag/audio interest survey qeydiyyatda
- Real-time signals (Redis sorted sets)

### V3 (6-cı ay)
- Multi-armed bandit exploration
- A/B framework
- Şəffaflıq: istifadəçi "niyə bu video?" görsün

---

## 7. Moderasiya

### Avtomatik
- NSFW image classifier (NudeNet, video keyframe-lərdə)
- Audio: copyright fingerprint (ACRCloud sonra)
- Text: regex + AZ stop-list + LLM (OpenAI/Claude) hate speech
- Spam: yeni hesab + sürətli kütləvi follow → review

### Manuel
- Admin panel: pending queue, single-click action (remove, warn, ban)
- Audit log
- İstifadəçi report axını
- Apellyasiya prosesi

---

## 8. Lokallaşdırma (i18n)

- Default və yeganə dil: **az-Latn**
- `packages/i18n` — bütün stringlər
- next-intl Web üçün, nestjs-i18n API üçün
- Tarix/say formatları: `Intl.DateTimeFormat('az-AZ')`
- Pluralization: ICU MessageFormat (az dilində 2 forma: one, other)

---

## 9. Performans Hədəfləri

| Metrik | Hədəf |
|--------|-------|
| API p95 latency | < 200ms |
| Video time-to-first-frame | < 1.5s |
| Feed scroll FPS | 60 |
| First contentful paint (web) | < 1.2s |
| Upload to ready | < 30s (60s video) |
| WebSocket roundtrip | < 100ms |

### Strategiyalar
- HLS adaptive bitrate
- Preload sonrakı 2 video
- Image lazy load + AVIF
- Edge caching (Cloudflare)
- DB query optimization (EXPLAIN ANALYZE)
- Redis cache (feed, profil, trending)

---

## 10. Yol Xəritəsi (Roadmap)

### Faza 0 — Foundation (Həftə 1-2) ✅
- Monorepo setup
- API skeleton (NestJS modullar)
- Web skeleton (Next.js layout)
- Docker compose dev infra
- Auth (register, login, refresh)
- CI pipeline

### Faza 1 — MVP (Həftə 3-8)
- Profil, follow
- Video upload + transcoding
- Feed (For You, Following)
- Like, comment, share
- Bildirişlər
- Search basic
- Admin panel basic
- Web responsive

### Faza 2 — Sosial (Həftə 9-14)
- DM (1-1)
- Hashtag, audio sistemi
- Trending
- Push notifications (web push, FCM)
- Mobile app (Expo)
- Effektlər (basic filter)

### Faza 3 — Scale (Həftə 15-20)
- Live streaming
- Advanced feed (ML)
- Monetizasiya (hədiyyə, abunəlik)
- Analytics yaradıcılar üçün
- K8s prod deploy

### Faza 4 — Genişlənmə
- Stitch, Duet
- Çoxdilli (TR, RU, EN)
- API açıq developer
- B2B yaradıcı alətləri

---

## 11. Komanda və İş Axını

### Branch strategiyası
- `main` — production, auto-deploy
- `develop` — staging
- `feature/<name>` — featurelər
- `fix/<name>` — bug fix
- `hotfix/<name>` — prod kritik

### Commit konvensiyası
Conventional Commits:
```
feat(video): add HLS transcoding pipeline
fix(auth): refresh token rotation bug
chore(deps): bump nestjs to 11
docs(api): update auth flow diagram
```

### PR Tələbləri
- Bütün CI yaşıl
- 1 review minimum
- Test coverage düşməsin
- Conventional commit title

---

## 12. AI Asistent / Yeni Developer üçün Təlimatlar

Bu layihədə işləyərkən:
1. **Hər yeni feature** üçün `apps/api/src/modules/<feature>` qovluğu yarat
2. **DTO-lar** Zod ilə + class-validator NestJS yanaşma kombinə edilməsin — yalnız Zod
3. **Yeni Prisma model**-dən sonra mütləq `pnpm db:migrate --name <descriptive>` işlət
4. **Test** yaz: hər service üçün unit, hər controller üçün e2e
5. **Tərcümələr** `packages/i18n/az.json` faylına əlavə et, kod-da hardcoded string olmasın
6. **Heç vaxt** `.env` faylını commit etmə
7. **Heç vaxt** `console.log` prod kod-da qalmasın — Pino logger istifadə et
8. **PR təsviri** azərbaycan dilində yaz

### "Don't"
- Yeni paket əlavə etmədən əvvəl mövcud həll yoxla
- AI/Claude/GPT məlumatını commit-də qeyd etmə
- Mock data ilə real testləri əvəz etmə
- Migrations-ı manuel düzəltmə — yeni miqrasiya yaz

---

## 13. Lisenziya və Hüquqi

- Layihə kodu: **AGPL-3.0**
- Yüklənmiş istifadəçi kontenti: istifadəçinin (lisenziya verilmir Buta-ya), Terms-də platforma istifadə hüququ verilir
- DMCA prosedurası: `legal@buta.az`
- KVKK/GDPR: istifadəçi məlumat ixrac/silmə endpoint-i

---

*Versiya: 1.0 — 2026-05-13*
