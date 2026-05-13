# Yol Xəritəsi

## Faza 0 — Foundation ✅ (Həftə 1-2)

- [x] Monorepo (pnpm + Turborepo)
- [x] NestJS API skeleton, modullar
- [x] Next.js Web skeleton, layout
- [x] Worker skeleton (BullMQ + FFmpeg)
- [x] Docker Compose dev infra
- [x] Prisma schema (bütün entitilər)
- [x] Auth (register, login, refresh, logout)
- [x] Public profile view
- [ ] CI pipeline (lint, test, build)
- [ ] Pre-commit hooks (lint-staged, husky)

## Faza 1 — MVP (Həftə 3-8)

### Backend
- [ ] OTP via SMS (telefon ilə qeydiyyat)
- [ ] Email verification
- [ ] Profil edit endpoint-ləri
- [ ] Video upload + worker tam inteqrasiya
- [ ] Feed (For You + Following) tam işləyən
- [ ] Like, comment, follow tam işləyən
- [ ] Bildirişlər (real-time WebSocket)
- [ ] Search basic (Meilisearch)
- [ ] Hashtag və audio sistemi
- [ ] Report endpoint-ləri
- [ ] Admin panel endpoint-ləri

### Frontend (web)
- [ ] Profil səhifəsi
- [ ] Video detail səhifəsi
- [ ] Discover (trending) səhifəsi
- [ ] Search nəticələri
- [ ] Inbox (bildirişlər)
- [ ] Settings səhifəsi
- [ ] Onboarding flow (interest selection)
- [ ] Responsive mobile

### Admin
- [ ] Login + role check
- [ ] Pending reports queue
- [ ] User management
- [ ] Video moderation
- [ ] Statistika dashboard
- [ ] Audit log viewer

### Infrastructure
- [ ] Staging environment
- [ ] Backup automation
- [ ] Monitoring (Grafana)
- [ ] Sentry error tracking

## Faza 2 — Sosial (Həftə 9-14)

- [ ] DM (1-1 chat) tam işləyən
- [ ] Group chat (3-cü tərəf)
- [ ] Push notifications (Web Push, FCM)
- [ ] Mobile app (Expo) — iOS & Android
- [ ] Effekt/filter (basic, MediaPipe)
- [ ] Stitch, Duet
- [ ] Live preview yüklənmə vaxtı
- [ ] Hashtag/Audio detail page
- [ ] User block, mute
- [ ] Privacy settings (private account)

## Faza 3 — Scale (Həftə 15-20)

- [ ] Live streaming (RTMP → HLS)
- [ ] Advanced feed (ML scoring)
- [ ] Yaradıcı analitika dashboard
- [ ] Yaradıcı monetizasiyası v1 (virtual hədiyyə)
- [ ] Abunəlik sistemi
- [ ] K8s prod deploy
- [ ] Multi-region (gələcəkdə)
- [ ] Edge caching optimizasiya

## Faza 4 — Ekosistem (Sonrakı il)

- [ ] Açıq Developer API
- [ ] B2B yaradıcı alətləri (sponsor, kampaniya)
- [ ] Çoxdilli (TR, RU, EN)
- [ ] Yerli reklam sistemi (SSP)
- [ ] AR effektlər
- [ ] AI moderation v2 (AZ NLP model)
- [ ] Content recommendation explainability

## KPI hədəfləri

| Mərhələ | DAU | MAU | Yüklənən video/gün | Aktiv yaradıcı |
|---------|-----|-----|-------------------|----------------|
| MVP launch | 100 | 1k | 50 | 20 |
| 3 ay | 1k | 10k | 500 | 200 |
| 6 ay | 5k | 50k | 5k | 1k |
| 1 il | 30k | 500k | 50k | 10k |
| 2 il | 100k | 2M | 200k | 50k |
