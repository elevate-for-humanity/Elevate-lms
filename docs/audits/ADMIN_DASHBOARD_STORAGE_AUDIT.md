# Admin dashboard — storage & memory audit (line-by-line)

**Date:** 2026-05-30 (updated after PR #233 / follow-up)  
**Scope:** `apps/admin` (421 API routes, 362 admin pages), Northflank `Dockerfile.northflank-admin`, shared `@/*` monorepo imports.  
**Goal:** Confirm nothing duplicates heavy deps or fills disk/memory unexpectedly.

---

## Executive summary

| Area | Status | Notes |
|------|--------|--------|
| Build / standalone image | **Fixed (PR #233)** | `outputFileTracingExcludes` + `prune-admin-standalone.mjs`; playwright/puppeteer not in trace |
| Runtime container disk | **Fixed** | Lesson/slide media → Supabase `course-videos`; temps under `os.tmpdir()` only |
| Docker image `public/` | **Slimmed (PR #233)** | Selective `public/` subtrees in `Dockerfile.northflank-admin` (not full ~190 MB tree) |
| Dashboard UI pages | **OK** | No server imports of Remotion/ffmpeg; data via Supabase APIs |
| WIOA compliance UI | **OK** | RSC: `requireRole` only; data via `/api/admin/compliance/wioa-etpl/*` |
| Dev Studio | **Caution** | CPU/RAM spikes on stabilize/autofix; prod uses `DEVSTUDIO_DEVCONTAINER_MODE=github-only` |
| Upload caps | **Fixed (PR #233)** | Video 200 MB; CSV import 10 MB / 25k rows |

**Not a duplicate-deps problem:** Admin does not import puppeteer/playwright in any route (only `scripts/`). The earlier bloat was **file tracing + missing post-build prune**, not duplicate WIOA/compliance code.

---

## 1. `apps/admin/next.config.mjs` (line-by-line)

| Lines | Setting | Storage/memory impact |
|-------|---------|------------------------|
| 21 | `output: 'standalone'` | Produces `apps/admin/.next/standalone` — runtime `node_modules` copy |
| 23–24 | TS/ESLint ignored at build | Faster builds; does not affect runtime size |
| 26–30 | `workerThreads: false`, `cpus: 1`, parallel compiles off | **Lowers peak RAM** during `next build` on 4 GB Northflank builders |
| 34–43 | Webpack `@` → repo root, `parallelism: 1`, optional `cache: false` | Traces **entire monorepo**; disabling webpack FS cache avoids ENOSPC on builder disk |
| 47–89 | Redirects | No storage impact |
| 93 | `outputFileTracingRoot: ROOT` | Tracing walks repo-root `node_modules` — **high trace surface** without excludes |
| 97–99 | `outputFileTracingExcludes['*']` | Shared excludes (playwright, three, monaco, etc.) — **critical** |
| 101–144 | `serverExternalPackages` | Keeps Remotion/pdf/tesseract external (not webpack-bundled); still traced unless excluded |
| — | No `lmsOnly` Remotion excludes on admin | **Intentional** — `/api/admin/generate-lesson-videos` needs Remotion at runtime |

**Removed from admin externals (correct):** `playwright`, `puppeteer`, `@sparticuz/chromium`, `ffmpeg-static`, `@remotion/studio`, `@remotion/cli` — not used by admin API graph.

---

## 2. `Dockerfile.northflank-admin` (line-by-line)

| Lines | Step | Storage impact |
|-------|------|----------------|
| 7–18 | apt: cairo/pango/jpeg (native builds) | Builder layer only |
| 28–33 | Copy workspace manifests | Small context |
| 37–39 | `pnpm fetch` + cache mount `/app/.pnpm-store` | Registry cache; **do not use `--package-import-method=copy`** |
| 41 | `COPY . .` | Respect `.dockerignore` (no `node_modules`, `.next`, `tests/`) |
| 45–47 | `pnpm install --offline` | Full workspace install (~1964 packages) — **required** for `@/*` alias |
| 52–54 | `NODE_OPTIONS=4096`, `DISABLE_WEBPACK_FILESYSTEM_CACHE=1` | RAM/disk tradeoff for build |
| 70–75 | `next build` + `prune-admin-standalone.mjs` | Drops playwright/puppeteer/three/etc. from standalone |
| 77–95 | Export `ws`, `sharp`, `@img/*` | Explicit runtime copies (sharp excluded from trace globs) |
| 115–122 | Runtime: standalone + `.next/server` + `.next/static` + **selective `public/`** | Slim copy (images subset + remotion assets); not full repo `public/` |
| 137 | Healthcheck `/api/ping` | No storage |

**Gap:** `remotion-src/` must exist at runtime for Remotion `bundle({ entryPoint })` — ensure it is included in standalone trace (do not add `remotion-src/**` to admin excludes).

---

## 3. `apps/admin/server.js` (line-by-line)

| Lines | Behavior | Risk |
|-------|----------|------|
| 1–4 | Comment: Studio WebSocket proxy **removed** | Good — no extra `ws` proxy holding connections |
| 14–42 | Load `required-server-files.json` | Normal standalone boot |
| 44–48 | `chdir` to `apps/admin`, load `next` | — |
| 52–60 | `startServer` on `PORT` | Single HTTP server |

**Verdict:** Minimal entrypoint; no background timers or disk writers.

---

## 4. `apps/admin/middleware.ts` (line-by-line)

| Lines | Behavior | Risk |
|-------|----------|------|
| 19–28 | Public paths: health, ping, auth | — |
| 41–57 | Early exit for static/`_next` | — |
| 59–69 | Canonical host redirect | — |
| 72–77 | Protect `/admin`, `/api/admin` | — |
| 79–81 | `checkAdminIP` | Env-only; no disk |
| 86–97 | Session cookie check | — |

**Verdict:** No storage side effects.

---

## 5. `apps/admin/app/admin/layout.tsx` (dashboard shell)

| Lines | Behavior | Risk |
|-------|----------|------|
| 26–27 | `force-dynamic` + `revalidate = 60` | Revalidate ignored when force-dynamic — every request hits DB for nav |
| 54–60 | `unstable_cache` nav 60s | Small memory cache per deploy instance |
| 5–22 | Supabase auth, license, PWA components | Normal; no heavy native libs |

**Verdict:** Dashboard shell is fine; load is Supabase queries, not disk.

---

## 6. Line-by-line: what can fill disk at runtime (admin API routes)

**Do not use the pre–PR #233 table** (`public/generated/`, `public/videos/slide-image-cache/` growing until redeploy). Current behavior:

These are the **only** routes that touch the container filesystem (ephemeral disk on Northflank). Durable media belongs in **Supabase Storage**, not `public/`:

| Route | Writes to | Cleaned? | Risk |
|-------|-----------|----------|------|
| `POST /api/admin/generate-lesson-videos` | `os.tmpdir()` + Supabase `course-videos/generated-lessons/` | Temp deleted after upload | Low |
| `POST /api/admin/courses/[courseId]/generate-videos` | `os.tmpdir()/vid-gen-*` | **Yes** — `rmSync` in `finally` | Medium if crash mid-batch |
| `POST /api/admin/preview-slide` | `os.tmpdir()/elevate-slide-cache/` + Supabase `course-videos/slide-cache/` | Temp cleaned per request | Low |
| `POST /api/admin/wioa/pirl-export` | `os.tmpdir()/pirl-{jobId}/` | After upload to storage | Low |
| `PUT /api/devstudio/devcontainer` | `.devcontainer/` **blocked** unless `local-only` + no `GITHUB_TOKEN` | N/A in prod (`github-only`) | Low in prod |

**Production:** Treat container `public/` as read-only; all durable media in Supabase Storage.

---

## 7. Memory-heavy routes (not duplicate packages)

| Route | Why RAM spikes | Mitigation |
|-------|----------------|------------|
| `generate-lesson-videos` | Remotion bundle cache in module scope, TTS buffers, `maxDuration=300` | Queue jobs; single-lesson per request |
| `courses/.../generate-videos` | `pipeline` + ffmpeg per lesson in one HTTP request | Already uses `/tmp` + cleanup |
| `preview-slide` | Dynamic import `lesson-video-renderer` (canvas + ffmpeg) | Rate limit; optional feature flag |
| `documents/extract`, `parse-file`, `contracts/extract` | Full file `arrayBuffer` + tesseract workers | Caps: 10 MB upload, OCR page limits |
| `devstudio/stabilize`, `autofix` | Spawns `pnpm test` / lint | Admin-only; strict rate limit |
| `cron/embed-knowledge` | Reads many files, embedding batch | Cron-only; `maxDuration=300` |

---

## 8. Upload limits audit

| Route | Limit | Status |
|-------|-------|--------|
| `/api/upload` | 10 MB | OK |
| `/api/devstudio/upload` | 50 MB | OK |
| `/api/admin/contracts/upload` | 50 MB | OK |
| `/api/admin/courses/parse-file` | 10 MB | OK |
| `/api/admin/validate-coi` | 10 MB | OK |
| `/api/admin/videos/upload` | 200 MB | OK (PR #233) |
| `/api/admin/import` | 10 MB / 25k rows | OK (PR #233) |

---

## 9. WIOA / compliance dashboard (new work)

| Path | Data access |
|------|-------------|
| `app/admin/compliance/wioa-etpl/*` | **Server:** `requireRole` only (no Supabase on RSC). **Client:** `fetch('/api/admin/compliance/wioa-etpl…')` |
| `app/api/admin/compliance/wioa-etpl/*` | Supabase read/write via `requireAdminClient`; no filesystem writes |

**Verdict:** Compliance UI does not contribute to container storage bloat. All persistence goes through the API routes into `program_wioa_compliance_forms`.

---

## 10. Standalone bundle check (local build artifact)

Command: `pnpm audit:admin-standalone` (after `cd apps/admin && pnpm exec next build && node ../../scripts/prune-admin-standalone.mjs`)

| Check | Expected |
|-------|----------|
| `playwright` / `puppeteer` absent | Pass |
| `typescript` pruned from standalone | Pass after prune |
| `@remotion/*` in `.pnpm` store | Expected (~80–120 MB) — **one copy**, not duplicate LMS+admin |
| Total standalone | ~300–400 MB typical (down from tracing bloat) |

---

## 11. Cron routes (37)

- Triggered by HTTP + `CRON_SECRET`; **no `setInterval`** in process.
- `/api/cron/memory-cleanup` — DB housekeeping name only; not Node heap GC.

---

## 12. Action checklist

- [x] Shared trace excludes + admin prune (PR #233)
- [x] Merge PR #233; Northflank env dedupe + `NEXT_PUBLIC_SUPABASE_ANON_KEY` fix (PR #234)
- [x] `DEVSTUDIO_DEVCONTAINER_MODE=github-only` in Northflank sync (`canonical-env.mjs`)
- [x] Upload caps on videos/import
- [x] Lesson/slide media → Supabase (`lib/video/upload-lesson-media.ts`, `lib/video/slide-image-cache.ts`)
- [x] Slim Docker `public/` copy in `Dockerfile.northflank-admin`
- [x] GitHub Actions: single `NORTHFLANK_API_TOKEN` (no duplicate secret names)
- [ ] Verify latest `elevate-admin` Northflank build after each merge to `main`

---

## Related scripts

- `scripts/next-standalone-trace-excludes.mjs` — shared + LMS-only globs
- `scripts/prune-admin-standalone.mjs` — post-build prune (keeps Remotion)
- `scripts/audit-admin-standalone-size.mjs` — regression check for playwright/puppeteer
