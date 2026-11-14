# Audit: `FROM docker.io/library/node:20-bookworm-slim` (runtime stage)

**Date:** 2026-06-05  
**Trigger:** Northflank build logs resolve the runtime base as `docker.io/library/node:20-bookworm-slim` (implicit registry for `FROM node:20-bookworm-slim`).

## Where this image is used

| Dockerfile | Stage | Image reference | Production |
|------------|-------|-----------------|------------|
| `Dockerfile.northflank-admin` | runtime | `node:20-bookworm-slim` | **Northflank `elevate-admin`** |
| `Dockerfile.northflank-lms` | runtime | `node:20-bookworm-slim` | **Northflank `elevate-lms`** |
| `Dockerfile.package` | single | `node:20-bookworm-slim` | Legacy ECS LMS package (prebuilt standalone) |
| `Dockerfile.admin` | single | `public.ecr.aws/docker/library/node:20-bookworm-slim` | Legacy ECS admin package (same bits, AWS ECR mirror) |

**Builder stages** (not slim): `node:20-bookworm` full image with `build-essential`, Cairo/Pango dev libs for native compile in `Dockerfile.northflank-*`.

## What `docker.io/library/node:20-bookworm-slim` is

- Official Node.js image on Docker Hub (`library/node`).
- **Debian 12 (bookworm)** minimal variant — no compiler toolchain, smaller than `node:20-bookworm`.
- Tag **`20-bookworm-slim` is floating** — tracks latest Node 20.x on bookworm slim (not pinned to repo `.node-version` **20.19.2**).

Northflank/BuildKit logs the fully qualified name; behavior is identical to `FROM node:20-bookworm-slim` in the Dockerfiles.

## Runtime stage pattern (Northflank)

Both Northflank Dockerfiles use a **multi-stage** layout:

```
builder  → node:20-bookworm        (compile native deps, next build)
runtime  → node:20-bookworm-slim   (standalone server only)
```

### Packages installed on slim (Northflank admin + LMS)

```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
```

| Package | Purpose |
|---------|---------|
| `ca-certificates` | HTTPS to Supabase, Stripe, etc. |
| `curl` | `HEALTHCHECK` → `/api/ping` |
| `fonts-liberation` | PDF/canvas text rendering (admin PDF stack) |

### Native Node modules copied from builder (not installed on slim)

| Service | Copied into slim runtime |
|---------|--------------------------|
| **Admin** | `sharp` + `@img/*`, `@napi-rs/canvas`, `pdf-parse`, `pdfjs-dist`, `ws` |
| **LMS** | `sharp` + `@img/*` only |

Admin build **fails closed** if PDF stack missing:

```dockerfile
RUN node -e "require('@napi-rs/canvas'); require('pdf-parse'); console.log('[admin] pdf runtime ok')"
```

Native bindings are **built on full bookworm** and copied to slim — valid because both stages share the same Debian bookworm glibc.

## Findings

### 1. Node version drift (low)

| Source | Version |
|--------|---------|
| `.node-version` | `20.19.2` (pinned) |
| Docker tag | `20-bookworm-slim` (floating latest 20.x) |

**Risk:** CI/dev on 20.19.2, production slim image may pick up 20.20+ on next base image refresh.  
**Mitigation (optional):** Pin `node:20.19.2-bookworm-slim@sha256:…` in Dockerfiles.

### 2. Northflank admin slim missing ffmpeg/chromium (medium)

`Dockerfile.package` (legacy LMS runtime) installs on slim:

```dockerfile
ffmpeg \
chromium \
```

`Dockerfile.northflank-admin` **does not**. Routes that shell out to system binaries (e.g. `app/api/media/enhance-video*`, Remotion render pipeline comments in `app/api/videos/generate/route.ts`) expect **ffmpeg/chromium on the container**.

| Workload | Likely host today | Gap |
|----------|-------------------|-----|
| Admin lesson video generation | Intended: admin container | May fail if Remotion/ffmpeg not bundled and binaries absent |
| LMS www marketing + learner app | `elevate-lms` slim | ffmpeg/chromium often **not** needed (no video factory on LMS split) |

**Recommendation:** Add `ffmpeg` + `chromium` (+ `PUPPETEER_EXECUTABLE_PATH` env) to **`Dockerfile.northflank-admin` runtime only**, matching `Dockerfile.package`, if video generation must run on Northflank admin without ECS.

### 3. ECR vs docker.io (informational)

`Dockerfile.admin` pulls from `public.ecr.aws/docker/library/…` (AWS mirror of Docker Official Images). Northflank uses `docker.io/library/…` directly. **Same image content**; ECR avoids Docker Hub rate limits on AWS builders only.

### 4. Security posture (good)

| Control | Admin/LMS Northflank slim |
|---------|---------------------------|
| Non-root user | `nextjs` (uid 1001) |
| Minimal apt footprint | 3 packages (+ admin PDF test) |
| No shell in HEALTHCHECK | `curl -sf` only |
| `PORT` / `HOSTNAME` | `8080` / `0.0.0.0` (Northflank) vs `3000` on legacy `Dockerfile.admin` |

### 5. PORT mismatch legacy vs Northflank (by design)

| Image | `PORT` | Notes |
|-------|--------|-------|
| `Dockerfile.admin` | 3000 | ECS task definition historical |
| `Dockerfile.northflank-admin` | 8080 | Northflank service + health probes |

Do not merge ECS and Northflank task env without updating probes.

## Comparison matrix

| | northflank-admin slim | northflank-lms slim | Dockerfile.package slim |
|--|----------------------|---------------------|-------------------------|
| Base | `node:20-bookworm-slim` | same | same |
| ffmpeg/chromium | **No** | No | **Yes** |
| sharp | From builder | From builder | Host prebuild |
| PDF/canvas | From builder + runtime test | No | N/A |
| Custom server | `apps/admin/server.js` | `server.js` | `server.js` |
| Healthcheck | `/api/ping:8080` | same | varies |

## Recommended actions

| Priority | Action |
|----------|--------|
| P1 (if video gen on NF admin) | Add `ffmpeg` + `chromium` to `Dockerfile.northflank-admin` runtime `apt-get` |
| P2 | Pin `node:20.19.2-bookworm-slim` or digest for reproducible builds |
| P3 | Document that **LMS** slim intentionally omits ffmpeg/chromium (workloads live on admin) |
| — | Keep builder on **full** `node:20-bookworm` — do not move native compile to slim |

## Verification

After changing the slim stage:

```bash
# Image build (local)
docker build -f Dockerfile.northflank-admin -t elevate-admin:test .

# Runtime smoke inside container
docker run --rm elevate-admin:test node -e "require('sharp'); require('@napi-rs/canvas')"
docker run --rm elevate-admin:test which ffmpeg chromium   # if added

# Northflank
pnpm tsx scripts/northflank/trigger-build.ts elevate-admin
```
