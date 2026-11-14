# DOCKERFILE AUDIT REPORT - 2026-07-20

## EXECUTIVE SUMMARY

**CRITICAL BUG FOUND:** All Dockerfiles were missing the `.next/server` directory copy!

**Impact:** Builds pass but containers serve **blank output** because Next.js standalone cannot resolve routes.

---

## ISSUES IDENTIFIED AND FIXED

### Issue #1: Missing .next/server Directory (ALL Dockerfiles)
**Severity: CRITICAL**

**Problem:** All Dockerfiles were missing the `.next/server` directory copy.

The `.next/server` directory contains:
- Route manifests
- Build metadata  
- Server-side code chunks
- Image optimization data

Without this directory, Next.js standalone server starts but cannot serve any pages.

**Fix Applied to ALL Dockerfiles:**
```dockerfile
COPY --from=builder /app/apps/*/.next/server ./.next/server
```

---

### Issue #2: Static File Path Mismatches
**Severity: CRITICAL**

**Problem:** Static files were being copied to wrong locations.

**Before (WRONG):**
```dockerfile
COPY --from=builder /app/apps/lms/.next/static ./apps/lms/.next/static
```

**After (CORRECT):**
```dockerfile
COPY --from=builder /app/apps/lms/.next/standalone ./
COPY --from=builder /app/apps/lms/.next/static ./.next/static
COPY --from=builder /app/apps/lms/.next/server ./.next/server
COPY --from=builder /app/apps/lms/public ./public
```

---

## FINAL DOCKERFILE STRUCTURE (ALL SERVICES)

All Dockerfiles now follow this consistent pattern:

```dockerfile
# Stage 1: Base
FROM node:22-bookworm-slim AS base
# Install deps, corepack, set WORKDIR /app

# Stage 2: Builder  
FROM base AS builder
COPY manifests, install deps, COPY source
RUN pnpm --filter @elevate/{service} build

# VERIFICATION: Builder stage
RUN test -d /app/apps/*/.next/standalone
RUN test -f /app/apps/*/.next/BUILD_ID

# Stage 3: Runtime
FROM node:22-bookworm-slim AS runner
WORKDIR /app
COPY standalone to /app/
COPY .next/static to /.next/static
COPY .next/server to /.next/server (CRITICAL!)
COPY public to /public
COPY node_modules

# VERIFICATION: Runtime stage
RUN test -f /app/server.js
RUN test -d /app/.next/server

CMD ["node", "--max-http-header-size=32768", "server.js"]
```

---

## VERIFICATION MATRIX

| Component | Marketing | Admin | LMS |
|-----------|-----------|-------|-----|
| Dockerfile | Dockerfile.marketing | Dockerfile.northflank-admin | Dockerfile.lms |
| Port | 3000 | 3000 | 8080 |
| .next/standalone | ✓ | ✓ | ✓ |
| .next/static | ✓ | ✓ | ✓ |
| .next/server | ✓ FIXED | ✓ FIXED | ✓ FIXED |
| public | ✓ | ✓ | ✓ |
| node_modules | ✓ | ✓ | ✓ |
| Verification steps | ✓ | ✓ | ✓ |

---

## COMMITS

```
7b10e40bfa fix: add missing .next/server directory to all Dockerfiles
7b93e3e61c docs: add Dockerfile audit report documenting path mismatch fixes
96c034850c fix: resolve static file path mismatches in all Dockerfiles
60fd300c2c fix(northflank-lms): enhance Dockerfile verification for server.js
```

---

## ACTION REQUIRED

1. **Trigger rebuilds** in Northflank for all services
2. **Monitor build logs** for "RUNTIME VERIFICATION PASSED"
3. **Verify /api/ping** returns 200 on all services
4. **Check for blank pages** - should now show actual content
