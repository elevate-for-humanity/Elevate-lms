# Audit: `RUN --mount=type=cache,id=pnpm-northflank-*` (Northflank Docker builds)

**Date:** 2026-06-05  
**Scope:** `Dockerfile.northflank-admin`, `Dockerfile.northflank-lms`  
**Related:** `docs/audits/northflank-pnpm-fetch-enospc-audit.md`

## What the step does

Both Dockerfiles use BuildKit cache mounts (not image layers) for pnpm:

```dockerfile
RUN --mount=type=cache,id=pnpm-northflank-admin-unified,target=/mnt/pnpm-cache \
    mkdir -p /mnt/pnpm-cache/store /mnt/pnpm-cache/node_modules \
    && printf '%s\n' 'store-dir=/mnt/pnpm-cache/store' 'modules-dir=/mnt/pnpm-cache/node_modules' >> .npmrc \
    && pnpm install --frozen-lockfile --ignore-scripts
```

| Piece | Purpose |
|--------|---------|
| `type=cache` | Persists pnpm store + `node_modules` across builds on Northflank builders |
| `target=/mnt/pnpm-cache` | Single filesystem for store **and** modules-dir (hardlinks, no cross-FS copy) |
| `id=pnpm-northflank-*-unified` | **Must be per-service** (`admin` vs `lms`) so graphs do not collide |
| `.npmrc` `store-dir` + `modules-dir` | Keeps both trees on the mount; split mounts caused `ERR_PNPM_ENOSPC` / copyfile failures |

**Do not use** a generic `id=pnpm-northflank` for both services — admin and LMS lockfiles resolve different graphs; a shared id can corrupt or bloat the cache.

## Failure modes observed

| Symptom | Cause | Mitigation |
|---------|--------|------------|
| `ERR_PNPM_ENOSPC` on `/mnt/pnpm-cache` or `/app/node_modules` | Build disk too small; install + `next build` + `.next` in **one** RUN layer | Split install RUN vs build RUN (same cache `id`) |
| `ERR_PNPM_ENOSPC` with separate store + `node_modules` mounts | Different filesystems → pnpm copies instead of hardlinks | Unified mount only (current design) |
| `pnpm fetch` exit 1 | Deprecated two-phase fetch; peak disk on small volume | Removed — use `pnpm install` only |
| `next: not found` after `modules-dir` install | pnpm shim not on PATH when `node_modules` is symlinked | Invoke `node /app/node_modules/next/dist/bin/next build` (#275) |
| Build timeout after ENOSPC retries | Northflank retries npm GET for hours | Fix disk + split layers; raise build ephemeral storage |

## Current layout (post-audit fix)

1. **RUN 1 (install):** cache mount → `pnpm install` only  
2. **RUN 2 (build):** same cache `id` → symlink `node_modules` → `next build` → prune / sharp export  

Same cache `id` on both RUN lines is **required** so RUN 2 sees RUN 1’s populated store.

## Platform settings (not Dockerfile)

- `scripts/northflank/configure-services.ts` — BuildKit `useCache: true`, `cacheStorageSize: 10240` MB  
- `scripts/northflank/patch-ephemeral-storage.ts` — build ephemeral storage (target 32768 MB)  
- Workflows: `deploy-admin.yml` / `deploy-lms.yml` run both before `trigger-build`

## Verification commands

```bash
pnpm tsx scripts/northflank/fetch-build-logs.ts elevate-admin --grep ENOSPC
pnpm tsx scripts/northflank/fetch-build-logs.ts elevate-lms --grep ENOSPC
pnpm tsx scripts/northflank/dump-build-storage.ts
```

Success: log shows `pnpm install` in one step, `next build` in a later step, no `pnpm fetch`, no ENOSPC.

## Intentionally not done

- **`pnpm store prune` before `next build`** — removed in #276; pruning dropped packages still needed by the build graph.  
- **Separate LMS/admin cache ids on one service** — correct; only one id per Dockerfile.
