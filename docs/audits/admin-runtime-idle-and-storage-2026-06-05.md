# Admin runtime: idle behavior & cloud storage audit

**Date:** 2026-06-05  
**Scope:** Northflank `elevate-admin`, video generation, Dev Studio, crons, Cloudflare R2 vs Supabase.

---

## Executive summary

| Question | Answer |
|----------|--------|
| Does the admin container run video/cron/autofix at **startup**? | **No** — only `node apps/admin/server.js` + env hydration |
| Where do generated lesson videos go? | **Supabase** `course-videos` (`generated-lessons/`, `slide-cache/`, program paths) |
| Is Cloudflare R2 required for course videos? | **No** — R2 is for **digital product downloads** and optional Dev Studio/R2 path |
| What fills disk at runtime? | **Temp only** (`os.tmpdir()`): Remotion webpack bundle, render temps, OCR — must be cleaned per job |
| Who runs scheduled jobs? | **GitHub Actions** `cron-scheduler.yml` → HTTP to admin `/api/cron/*` (not in-process timers) |

---

## 1. Idle admin pod (nothing runs until requested)

| Component | Runs at startup? | Trigger |
|-----------|-----------------|---------|
| Next.js server | Yes | Container CMD |
| Remotion `bundle()` | **No** | First `POST /api/admin/generate-lesson-videos` (lazy) |
| Dev Studio stabilize/autofix | **No** | Manual POST from UI |
| Crons | **No** | External `CRON_SECRET` HTTP from GitHub Actions |
| Tesseract / pdf-parse / sharp | **No** | Dynamic import on matching API route |
| `server/video-storage` `defaultStorage.initialize()` | Only if that module is imported | **Not** on typical admin dashboard pages |

**Production guard:** `DEVSTUDIO_DEVCONTAINER_MODE=github-only` in Northflank secret group (see `scripts/northflank/sync-env.ts`).

---

## 2. Storage routing (durable vs ephemeral)

| Asset | Durable location | Ephemeral (container) |
|-------|------------------|------------------------|
| Generated lesson MP4/MP3 | Supabase `course-videos` | `elevate-lesson-{id}/` under tmp |
| Slide preview cache | Supabase `course-videos/slide-cache/` | `elevate-slide-cache/` under tmp |
| Batch pipeline videos | Supabase `course-videos/{program}/{slug}.mp4` | `vid-gen-*` under tmp |
| Dev Studio file upload | Supabase `documents` (default) or R2 if `R2_*` set | None (streamed upload) |
| WIOA PIRL export | Supabase `wioa-exports` | `pirl-{jobId}/` — **finally** deleted |
| Store PDF downloads | Cloudflare R2 `elevate-media` (or public fallback) | None |
| MOU / agreements | Supabase `mous`, `agreements` | None |

**Rule:** Never write durable media under `public/` on Northflank. `.gitignore` includes `public/videos/slide-image-cache/`.

Canonical code map: `lib/media/storage-policy.ts`.

---

## 3. Cloudflare configuration

Two env families exist (historical):

| Module | Env vars | Purpose |
|--------|----------|---------|
| `lib/cloudflare-r2.ts` | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET_NAME`, `CLOUDFLARE_R2_PUBLIC_URL` | General R2 uploads |
| `lib/storage/file-storage.ts` | `R2_ENDPOINT`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET` | Signed digital product downloads |

**Check:** `node scripts/check-media-storage-config.mjs`

**Large course MP4s** (≥ `COURSE_VIDEO_R2_MIN_BYTES`, default 5MB) upload to R2 when `CLOUDFLARE_R2_*` is set (`COURSE_VIDEO_STORAGE_BACKEND=auto`). MP3 and slide JPEGs stay on Supabase. Store downloads still use `R2_*` / `lib/storage/file-storage.ts`.

---

## 4. Runtime disk risks (on-demand only)

| Risk | Mitigation (2026-06-05) |
|------|-------------------------|
| Remotion webpack bundle held in memory + tmp | `lib/video/remotion-bundle-cache.ts` — release after each job (`REMOTION_RELEASE_BUNDLE_AFTER_RENDER` default on) |
| Batch video `vid-gen-*` | `generate-videos` route `finally` rmSync |
| PIRL export temp dir on failure | `finally` rm on `pirl-export` route |
| Audit DB fallback | `/tmp/audit-fallback.jsonl` if DB down — monitor |

---

## 5. Crons — not “always running”

All `apps/admin/app/api/cron/*` routes are **stateless HTTP handlers**. Schedule is in `.github/workflows/cron-scheduler.yml` only. Disabling a job = remove or comment its entry in that workflow.

Heavy crons to know:

- `embed-knowledge` — weekly, reads repo paths (may be slim in standalone image)
- `memory-cleanup` — DB only, no filesystem

---

## 6. Recommended Northflank env (admin secret group)

```env
DEVSTUDIO_DEVCONTAINER_MODE=github-only
REMOTION_RELEASE_BUNDLE_AFTER_RENDER=true
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
# Optional R2 for digital downloads / Dev Studio fallback:
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
```

---

## 7. Migrate existing Supabase MP4s to R2

```bash
pnpm tsx scripts/migrate-course-videos-to-r2.ts --dry-run
pnpm tsx scripts/migrate-course-videos-to-r2.ts --execute --prefix=generated-lessons/
```

Update `course_lessons.video_url` / enrollment rows manually or via a follow-up SQL job if URLs change domain.

## 8. Verify in production

```bash
pnpm tsx scripts/northflank/verify-health-checks.ts
node scripts/check-media-storage-config.mjs
curl -s https://admin.elevateforhumanity.org/api/admin/runtime-footprint \
  -H "Cookie: ..."   # super_admin session
```

Diagnostic route: `GET /api/admin/runtime-footprint` (admin auth).
