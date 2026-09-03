# Audit: Northflank build timeouts vs runtime HEALTHCHECK

**Date:** 2026-06-04  
**Scope:** `elevate-lms`, `elevate-admin` on Northflank (Dockerfiles + `configure-services.ts`)

## Executive summary

| Failure mode | When it happens | Primary fix |
|--------------|-----------------|-------------|
| **Build timed out during building** | Northflank build job while running `pnpm exec next build` | Larger **build plan** (`nf-compute-800-32`), **32GB** build ephemeral storage, avoid ENOSPC retries; LMS is full graph (no `BUILD_SCOPE=1`) |
| **`ERR_PNPM_ENOSPC` at fetch/install** | Build job disk full | Remove `pnpm fetch`; single `pnpm install` + `store prune` — see `northflank-pnpm-fetch-enospc-audit.md` |
| **Container unhealthy / deploy rollback** | After image is built, process slow to listen on `:8080` | Docker **HEALTHCHECK** `start-period=120s`, Northflank **startupProbe**, non-blocking `hydrateProcessEnv()` in `instrumentation.ts` |

These are **three different phases**. A passing Docker HEALTHCHECK does not fix a build timeout, and fixing ENOSPC does not help if `next build` exceeds Northflank’s build job limit.

---

## 1. Build timeout (LMS)

### Symptom

```text
[error] BuildService - Build failed: Build timed out during building.
```

Occurs during the **`next build`** layer in `Dockerfile.northflank-lms`, not during `curl /api/ping`.

### Why LMS is slow

- **~2,600+ static pages** in the App Router graph.
- **`BUILD_SCOPE=1` is intentionally not set** on LMS Northflank Dockerfile (full site must compile).
- **`NODE_OPTIONS=--max-old-space-size=8192`** — needs `nf-compute-800-32` builder RAM.
- Admin image uses **`BUILD_SCOPE=1`** and pruned standalone — much smaller build.

### Mitigations (platform)

1. **`billing.buildPlan`:** `nf-compute-800-32` (set in `configure-services.ts` / `NORTHFLANK_BUILD_PLAN`).
2. **`buildSettings.storage.ephemeralStorage.storageSize`:** `32768` MB (allowed Northflank values: 16384, 32768, …).
3. **Do not downgrade** `billing.deploymentPlan` on deploy — use **`nf-compute-400`** for runtime (`NORTHFLANK_DEPLOYMENT_PLAN`), not `nf-compute-100-2`.

### Mitigations (code, future)

- Incremental build scope only if product accepts a scoped LMS deploy (not current production model).
- Cache BuildKit layers (`buildkit.useCache` already enabled in `configure-services.ts`).

---

## 2. Runtime: Docker HEALTHCHECK vs Northflank probes

### Docker (in image)

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD curl -sf http://127.0.0.1:8080/api/ping || exit 1
```

| Parameter | Old | New | Reason |
|-----------|-----|-----|--------|
| `start-period` | 60s | **120s** | `instrumentation.ts` + large standalone can delay first listen |
| `timeout` | 5s | **10s** | Slow cold start under load |
| curl | `-f` | **`-sf`** | Same behavior, quieter logs |

**LMS CMD:** `node --max-http-header-size=32768 server.js`  
**Admin CMD:** `node --max-http-header-size=32768 apps/admin/server.js` (aligned with LMS for large auth cookies/headers)

### Northflank (`configure-services.ts`)

- **readinessProbe:** `/api/ping`, port 8080, `initialDelaySeconds: 30`, `failureThreshold: 6`
- **startupProbe:** longer budget before readiness fails the pod (see script — `initialDelaySeconds: 90`, `failureThreshold: 18`)

Northflank readiness runs **in addition to** Docker HEALTHCHECK; both must pass for stable deploys.

### `/api/ping` contract

- **LMS:** `app/api/ping/route.ts`
- **Admin:** `apps/admin/app/api/ping/route.ts`, allowlisted in `apps/admin/middleware.ts` (`PUBLIC_PATHS`)

Must return **200** without Supabase DB (health is process-up, not data-dependent).

---

## 3. Server startup risks (audited)

| Risk | Location | Mitigation |
|------|----------|------------|
| `hydrateProcessEnv()` throws before listen | `instrumentation.ts` | **try/catch** — warn and continue |
| Secrets fetch hang | `lib/secrets.ts` | **3s** AbortSignal per fetch |
| Admin wrong cwd / port | `apps/admin/server.js` | `chdir` to `apps/admin`, log `host`/`port`/`cwd` on start |
| Missing service role at runtime | Northflank secret group | `SUPABASE_SERVICE_ROLE_KEY` in `elevate-production-env` — dashboard errors are separate from ping |

---

## 4. `configure-services.ts` deploy footgun

**Problem:** Default `deploymentPlan: nf-compute-100-2` in script **downgraded** live services (`nf-compute-400`) on every GitHub deploy.

**Fix:** Default to `nf-compute-400` via `NORTHFLANK_DEPLOYMENT_PLAN` or script default.

**Verification:** PATCH response body from `nfFetch` is logged on `--execute`; GET `/services/{id}` may not show `buildPlan` — trust PATCH response.

---

## 5. Checklist after merge

1. Merge PR with Dockerfile + instrumentation + `configure-services.ts` changes.
2. Push to `main` → LMS and/or Admin workflow runs `configure-services.ts --execute`.
3. Confirm build logs: no ENOSPC, build completes `next build`.
4. After deploy: `curl -sf https://admin.elevateforhumanity.org/api/ping` and LMS equivalent.
5. Admin dashboard: confirm `SUPABASE_SERVICE_ROLE_KEY` if `ERR_DASHBOARD_LOAD` persists (PR #252 degraded mode).

---

## Related docs

- `docs/audits/northflank-pnpm-fetch-enospc-audit.md` — ENOSPC / `pnpm fetch` removal
- `AGENTS.md` — Cursor Cloud / Northflank commands
