# Audit: Northflank `pnpm fetch` build failure (exit code 1)

**Date:** 2026-06-04  
**Failing step:** `RUN pnpm config set store-dir /app/.pnpm-store && pnpm fetch --frozen-lockfile`  
**Services:** `elevate-admin`, `elevate-lms`

## Symptom (what CI/Docker reports)

```text
error: failed to solve: process "/bin/sh -c pnpm config set store-dir /app/.pnpm-store \
  && pnpm fetch --frozen-lockfile" did not complete successfully: exit code: 1
[error] BuildService - Build failed: Could not build the image.
```

This is **not** a lockfile mismatch, npm registry auth problem, or `pnpm` version bug. The underlying error in Northflank build logs is:

```text
ERR_PNPM_ENOSPC  no space left on device, mkdir '/app/node_modules/.pnpm/...'
WARN GET https://registry.npmjs.org/... error (ERR_PNPM_ENOSPC). Will retry ...
```

## Root cause

| Factor | Detail |
|--------|--------|
| **Disk** | Northflank build container runs out of space during `pnpm fetch` (~**2GB** effective build volume on current service config). |
| **Monorepo size** | Root `pnpm-lock.yaml` resolves **~1,900+ packages** (video.js, remotion, OTel, playwright deps, etc.). `pnpm fetch` downloads the **entire** lockfile into `/app/.pnpm-store` before `next build`. |
| **Two-phase install** | Old Dockerfile: `fetch` (fills store) → `COPY .` → `install --offline`. Peak usage = store + growing `node_modules` + Docker layers. |
| **Misleading cache lines** | Logs may show `COPY --from=builder .../standalone` from **cached** older builds — that does not mean the **current** build passed `pnpm fetch`. |

## What is NOT the cause

- Invalid `pnpm-lock.yaml` (would be `ERR_PNPM_OUTDATED_LOCKFILE` / frozen-lockfile message)
- Missing `NEXT_PUBLIC_*` at build (fails later at `next build`, not at fetch)
- Runtime healthcheck / `PORT` (image never finishes building)
- Post-deploy `SUPABASE_SERVICE_ROLE_KEY` (runtime only)

## Evidence (Northflank API build logs, 2026-06-04)

- `elevate-admin`: failure at `[builder 10/15] RUN ... pnpm fetch` with `ERR_PNPM_ENOSPC`
- `elevate-lms`: same pattern; occasional **build timeout** after long retries on ENOSPC
- Service JSON shows `deployment.storage.ephemeralStorage.storageSize: 2048` (MB) — runtime disk; build volume remains tight unless `buildSettings.storage` is applied in Northflank project quota

## Fix (code)

**Dockerfile.northflank-admin** and **Dockerfile.northflank-lms**:

1. Remove the separate **`pnpm fetch`** layer (never use on Northflank).
2. **`pnpm install --frozen-lockfile`** from workspace manifests **before** `COPY . .` so install peak is not repo + store + `node_modules`.
3. **BuildKit cache mounts** for the pnpm store (`/pnpm/store`) **and** `node_modules` so hardlinks do not duplicate the lockfile onto the image layer (store-only mount still ENOSPC’d at ~1.7k/1964 packages with 32GB API setting).
4. **`pnpm store prune`** after install; **`rm -rf /app/.pnpm-store`** after `COPY . .` if anything landed on `/app`.
5. **`.dockerignore`**: exclude `export/`, `cloudflare-workers/`, `fly-containers/` from build context.
6. **POST `/services/{id}/build-options`** with `storage.ephemeralStorage.storageSize` (65536 MB in deploy workflows) in addition to combined-service PATCH.

This lowers peak disk versus fetch + offline install or `/app/.pnpm-store` in-layer on a small volume.

## Fix (platform)

1. Run on each deploy (already in workflows):

   ```bash
   pnpm tsx scripts/northflank/configure-services.ts --execute
   pnpm tsx scripts/northflank/patch-ephemeral-storage.ts --execute
   ```

2. In Northflank UI: confirm **project build resource allowance** allows **32GB** build ephemeral storage (API may reject 65536 with “exceeds project build resource allowance”).

3. Verify with:

   ```bash
   pnpm tsx scripts/northflank/fetch-build-logs.ts elevate-admin --grep ENOSPC
   pnpm tsx scripts/northflank/dump-build-storage.ts
   ```

## After fix deploys

Expect build log to show `pnpm install` (not `pnpm fetch`) and eventually `next build` / `prune-admin-standalone` without ENOSPC. If install still fails, next levers are larger build disk quota or slimming root `package.json` dependencies for admin-only image.
