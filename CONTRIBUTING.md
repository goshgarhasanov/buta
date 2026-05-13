# Töhfə vermək (Contributing)

Buta-ya töhfə vermək istəyirsən? Çox şadıq! 🌿

## Workflow

1. Issue aç (və ya mövcud issue-nu seç)
2. Fork edib branch yarat: `feature/<qisa-ad>` və ya `fix/<qisa-ad>`
3. Dəyişiklik et + test yaz
4. Conventional Commit ilə commit et
5. PR aç

## Commit mesajları

[Conventional Commits](https://www.conventionalcommits.org/) standartı:

```
feat(video): HLS transcoding pipeline əlavə et
fix(auth): refresh token rotation səhvini düzəlt
docs(api): auth bölməsini yenilə
chore(deps): nestjs-i v11.1-ə qaldır
test(comments): threaded comment-lər üçün e2e
refactor(feed): hotness score formula sadələşdir
```

**Növlər**: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `perf`, `ci`, `build`

## Kod stili

- TypeScript strict mode
- Prettier (auto-format on save)
- ESLint
- Heç vaxt `any` — `unknown` istifadə et
- DTO-lar üçün Zod və ya class-validator (eyni faylda qarışdırma)
- Bütün UI mətni `packages/i18n/az.json`-da olmalıdır

## PR çek-listi

- [ ] Bütün CI yaşıl
- [ ] Yeni feature üçün test yazılıb
- [ ] Yeni Prisma model üçün miqrasiya yaradılıb
- [ ] Dokumentasiya yenilənib (lazımdırsa)
- [ ] AZ tərcümələri əlavə edilib (UI dəyişiblərsə)
- [ ] PR təsviri AZ-dadır
- [ ] Conventional commit başlığı

## Lokal development

```bash
pnpm install
pnpm infra:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Admin login: `admin / Test1234!`

## Suallar

Telegram qrupu: (link sonra)
Issue açın: https://github.com/goshgarhasanov/buta/issues
