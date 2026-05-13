# API Müqaviləsi (v1)

> Base URL: `https://api.buta.az/v1` (dev: `http://localhost:4000/v1`)
> Auth: `Authorization: Bearer <accessToken>`
> Refresh: `Cookie: buta_rt=<refreshToken>` (httpOnly)
> Errors: RFC 7807 Problem Details (`application/problem+json`)

## Auth

| Method | Path | Auth | Açıqlama |
|--------|------|------|----------|
| POST | `/auth/register` | — | Yeni hesab |
| POST | `/auth/login` | — | Daxil ol |
| POST | `/auth/refresh` | cookie | Access token-i yenilə |
| POST | `/auth/logout` | bearer | Çıxış |
| GET  | `/auth/me` | bearer | Cari istifadəçi |

### Register
```http
POST /v1/auth/register
{
  "username": "aysel",
  "email": "aysel@example.com",
  "password": "Test1234!",
  "displayName": "Aysel Q."
}
→ 201 { "userId": "...", "accessToken": "..." }
Set-Cookie: buta_rt=...; HttpOnly; SameSite=Lax
```

### Login
```http
POST /v1/auth/login
{ "identifier": "aysel", "password": "Test1234!" }
→ 200 { "accessToken": "..." }
```

## Users

| Method | Path | Auth | |
|--------|------|------|---|
| GET | `/users/:username` | public | Profil |
| GET | `/users/:username/videos` | public | İstifadəçi videoları |
| PATCH | `/users/me` | bearer | Profil redaktə |

## Videos

| Method | Path | Auth | |
|--------|------|------|---|
| POST | `/videos/upload/init` | bearer | Presigned URL al |
| POST | `/videos/:id/upload/finalize` | bearer | Yükləməni tamamla, worker-ə göndər |
| GET | `/videos/:id` | public | Video detail |
| PATCH | `/videos/:id` | bearer | Caption/visibility yenilə |
| DELETE | `/videos/:id` | bearer | Sil |
| POST | `/videos/:id/view` | optional | View tracking |
| POST | `/videos/:id/like` | bearer | Like |
| DELETE | `/videos/:id/like` | bearer | Unlike |

### Upload axını
```
1. POST /videos/upload/init { contentType, caption }
   → { videoId, uploadUrl, key, expiresInSec }

2. PUT <uploadUrl>
   Content-Type: <contentType>
   <binary>

3. POST /videos/:id/upload/finalize { durationSec, width, height, sizeBytes }
   → { status: "queued", videoId }
   (Worker arxa planda HLS transcode edir)

4. WebSocket: video.ready event ilə xəbər verilir
```

## Feed

| Method | Path | Auth | |
|--------|------|------|---|
| GET | `/feed/foryou?cursor=&limit=10` | optional | For You |
| GET | `/feed/following?cursor=&limit=10` | bearer | Following |

Response:
```json
{
  "items": [
    {
      "id": "vid_...",
      "caption": "...",
      "hlsManifestUrl": "https://.../master.m3u8",
      "thumbnailUrl": "...",
      "likeCount": 1234,
      "commentCount": 56,
      "isLiked": false,
      "user": { "username": "aysel", "displayName": "...", "avatarUrl": "...", "verified": true },
      "audio": { "id": "...", "name": "..." }
    }
  ],
  "nextCursor": "vid_..."
}
```

## Comments

| Method | Path | Auth | |
|--------|------|------|---|
| GET | `/videos/:videoId/comments?cursor=` | public | Şərhlər |
| POST | `/videos/:videoId/comments` | bearer | Yarat |
| DELETE | `/comments/:id` | bearer | Sil |

## Follows

| Method | Path | Auth | |
|--------|------|------|---|
| POST | `/users/:username/follow` | bearer | İzlə |
| DELETE | `/users/:username/follow` | bearer | İzləməni dayandır |

## Notifications

| Method | Path | Auth | |
|--------|------|------|---|
| GET | `/notifications` | bearer | Siyahı |
| GET | `/notifications/unread-count` | bearer | Oxunmamış sayı |
| POST | `/notifications/mark-read` | bearer | Hamısını oxundu işarələ |

## Search

| Method | Path | Auth | |
|--------|------|------|---|
| GET | `/search?q=...&type=users\|videos\|hashtags` | public | Birləşmiş axtarış |

## WebSocket

- URL: `ws://localhost:4001` (prod: `wss://ws.buta.az`)
- Auth: connect parametr olaraq `?token=<accessToken>`

### Events (server → client)
- `notification:new` — yeni bildiriş
- `chat:message` — DM gəldi
- `video:ready` — sənin yüklədiyin video hazırdır
- `feed:livecount` — videoya canlı view sayğacı

### Events (client → server)
- `chat:send` — mesaj göndər
- `feed:watch` — feed-də cari videonu qeydiyyat al

## Pagination

Cursor-based:
- `?cursor=<id>&limit=<n>`
- Response: `{ items: [], nextCursor: string | null }`

`limit` max 50.

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/auth/login` | 5/dəq IP başına |
| `/auth/register` | 3/saat IP başına |
| `/videos/upload/init` | 10/saat user başına |
| `/comments` POST | 30/dəq user başına |
| Digər | 100/dəq |

Hədər: `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

## Error formatı (Problem Details)

```json
{
  "type": "https://buta.az/errors/401",
  "title": "Token etibarsızdır",
  "status": 401,
  "detail": "Refresh token vaxtı bitib",
  "instance": "/v1/auth/refresh",
  "timestamp": "2026-05-13T10:00:00.000Z"
}
```
