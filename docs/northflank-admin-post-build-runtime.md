# Northflank admin — build vs runtime diagnosis

## First: confirm whether the **current** build failed (not cache)

Northflank build logs are **append-only**. A line like:

```text
COPY --from=builder /app/apps/admin/.next/standalone ./
```

often comes from an **older cached layer** (`Used cache`), not from the build that just failed.

Pull the **tail** of the failed build and search for the real exit:

```bash
pnpm tsx scripts/northflank/fetch-build-logs.ts elevate-admin --grep ERROR
pnpm tsx scripts/northflank/fetch-build-logs.ts elevate-admin --grep ENOSPC
pnpm tsx scripts/northflank/fetch-build-logs.ts elevate-admin --grep "Build failed"
```

### Current production failure mode (2026-06): `ERR_PNPM_ENOSPC` during install

Recent `elevate-admin` / `elevate-lms` failures end with:

```text
ERR_PNPM_ENOSPC  no space left on device
error: failed to solve: process "/bin/sh -c pnpm ... fetch ..." did not complete successfully
[error] BuildService - Build failed: Could not build the image.
```

That is a **build-time disk** failure on the Northflank builder, not a healthcheck or missing `PORT`.

Mitigations in-repo:

- `Dockerfile.northflank-admin` / `Dockerfile.northflank-lms` — single `pnpm install` after `COPY .` (no separate `pnpm fetch`), then `pnpm store prune`
- `pnpm tsx scripts/northflank/configure-services.ts --execute` and `patch-ephemeral-storage.ts --execute` — request 32GB build ephemeral storage (subject to Northflank project quota)
- Northflank dashboard → project **build resource allowance** if 32GB patches are rejected

While builds fail, **`deployment.status` may stay `COMPLETED`** because the **previous** image keeps serving — e.g. `GET https://admin.elevateforhumanity.org/api/ping` can still return `200` on an old SHA.

---

## Post-build runtime (when the image actually built)

When Docker logs show **builder stage success** for the **current** build id (`next build`, non-cached `COPY --from=builder .../standalone`) but GitHub Actions reports:

```text
elevate-admin: FAILURE (deploy: COMPLETED)
elevate-admin build failed (FAILURE)
```

treat that as **pipeline failure**, not necessarily a compile failure. Northflank often surfaces the **last failed phase** on `status.build.status` even when the image was produced.

## What this repo expects at runtime

| Check | Config | Location |
|-------|--------|----------|
| Listen host | `0.0.0.0` | `ENV HOSTNAME=0.0.0.0` in `Dockerfile.northflank-admin` |
| Listen port | `8080` (Northflank `PORT`) | `ENV PORT=8080`; `apps/admin/server.js` uses `process.env.PORT` |
| Process entry | `node apps/admin/server.js` | `CMD` in Dockerfile |
| Working directory | `apps/admin` after `chdir` | `server.js` sets `process.chdir(__dirname)` |
| Liveness probe | `GET /api/ping` → `200` + `{"ok":true}` | `apps/admin/app/api/ping/route.ts` |
| Probe path public | No auth | `apps/admin/middleware.ts` allowlist includes `/api/ping` |
| Docker HEALTHCHECK | `curl -f http://127.0.0.1:8080/api/ping` | `Dockerfile.northflank-admin` (`start-period=120s`) |

`/api/health` is **not** the Northflank probe. It returns **500** when runtime env is incomplete (`SUPABASE_SERVICE_ROLE_KEY`, etc.). Use `/api/ping` for “is Node accepting HTTP?” only.

## Likely failure modes (after image build)

### 1. Container exits on startup

**Symptoms:** Northflank `deployment` failed, restart loop, logs show stack trace before “Ready”.

**Check container logs** (Northflank → service → **Logs**, not Build logs):

- `Cannot find module` — standalone layout / missing `node_modules/ws` or `sharp`
- `[admin] startup error:` — from `apps/admin/server.js`
- `failed to load required-server-files.json` — corrupt or missing `.next` copy

**Boot path:**

1. `node apps/admin/server.js`
2. `loadStandaloneConfig()` → `required-server-files.json`
3. `instrumentation.register()` → `hydrateProcessEnv()` (3s timeout to Supabase; must not throw)
4. `startServer({ port: PORT, hostname: HOSTNAME })`

### 2. Health check failure (most common if build “succeeded”)

**Symptoms:** Image pushes; deploy rolls back; logs show server started then probe failures.

**Causes:**

- Cold start &gt; `start-period` (60s) — Next standalone on admin can exceed this on 4GB builders’ runtime CPU
- Server listening on wrong port (only if `PORT` unset — Dockerfile sets `8080`)
- `/api/ping` blocked or 5xx — middleware misconfig (currently allowlisted)
- Process OOM during first request

**Verify from outside after deploy:**

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://admin.elevateforhumanity.org/api/ping
# expect 200
```

GitHub **Smoke admin** step in `.github/workflows/deploy-admin.yml` does the same check 20× after wait.

### 3. Missing runtime env (usually does not kill `/api/ping`)

`instrumentation` calls `hydrateProcessEnv()` at boot. Missing `SUPABASE_SERVICE_ROLE_KEY` logs errors but **should not** block `/api/ping` (no DB).

Missing keys **do** break `/api/health` and authenticated routes. Ensure Northflank **runtime** secret group includes at minimum:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_SECRET` (or session secret used by admin auth)

Optional for full admin features: `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, etc.

Build-time `ARG NEXT_PUBLIC_*` in the Dockerfile only inlines the **client bundle**; runtime still needs service role for server routes.

## Where to look in Northflank UI

1. **Build logs** — Docker layers (`COPY --from=builder`, cache). If these pass, stop debugging `next build`.
2. **Deploy / Runtime logs** — lines after `Starting container`, `node apps/admin/server.js`, `[admin] listening on ...`.
3. **Events** — `Health check failed`, `Unhealthy`, `Back-off restarting`.
4. **Previous deployment** — compare last green deploy env diff.

## GitHub Actions vs Northflank wording

`scripts/northflank/wait-service.ts` fails when `status.build.status` is `FAILURE`, even if `deploy: COMPLETED` appears in the same line. That pattern means:

- Northflank marked the **combined build/deploy job** failed (often post-deploy health), and
- The wait script labels it “build failed”.

Use `pnpm tsx scripts/northflank/diagnose-service.ts elevate-admin` for full JSON status after a failed run.

## Quick in-container checks (Northflank shell / one-off job)

```bash
echo "PORT=$PORT HOSTNAME=$HOSTNAME"
curl -sf http://127.0.0.1:${PORT:-8080}/api/ping
curl -s http://127.0.0.1:${PORT:-8080}/api/health | head -c 500
```

## Related files

- `Dockerfile.northflank-admin` — image + HEALTHCHECK
- `apps/admin/server.js` — bind address/port
- `apps/admin/app/api/ping/route.ts` — liveness
- `apps/admin/app/api/health/route.ts` — config readiness (stricter)
- `.github/workflows/deploy-admin.yml` — wait + smoke
- `scripts/northflank/wait-service.ts` — CI wait loop
- `scripts/northflank/diagnose-service.ts` — status dump
- `scripts/northflank/fetch-build-logs.ts` — build/runtime log tail from API
