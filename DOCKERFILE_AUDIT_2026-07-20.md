# DOCKERFILE AUDIT REPORT - 2026-07-20

## EXECUTIVE SUMMARY

**Root Cause Found:** Static file path mismatches between standalone server.js and Docker COPY destinations.

**Impact:** Builds pass but containers serve **blank output** because static files were placed in wrong directories.

---

## ISSUES IDENTIFIED

### Issue #1: Dockerfile.lms (USED BY NORTHFLANK)
**Severity: CRITICAL**

**Problem:** 
- Standalone copied to `/app/` ✓
- But static files copied to `/app/apps/lms/.next/static/` ✗
- server.js expected files at `/app/.next/static/` and `/app/public/`

**Evidence:**
```dockerfile
# BEFORE (WRONG):
COPY --from=builder --chown=nextjs:nodejs /app/apps/lms/.next/static ./apps/lms/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/lms/public ./apps/lms/public
CMD ["sh", "-c", "if [ -f /app/apps/lms/server.js ]; then exec node /app/apps/lms/server.js; ..."]
```

**Fix Applied:**
```dockerfile
# AFTER (CORRECT):
COPY --from=builder --chown=nextjs:nodejs /app/apps/lms/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/lms/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/lms/public ./public
CMD ["node", "--max-http-header-size=32768", "server.js"]
```

---

### Issue #2: Dockerfile.northflank-admin
**Severity: CRITICAL**

**Problem:** Same path mismatch issue

**Fix Applied:** Same pattern - copy standalone to `/app/`, static files to `/app/.next/static` and `/app/public`

---

### Issue #3: Dockerfile.marketing
**Severity: CRITICAL**

**Problem:** Same path mismatch issue

**Fix Applied:** Same pattern applied

---

### Issue #4: northflank_admin.json - Wrong Port
**Severity: HIGH**

**Problem:** Health check configured for port 8080, but Dockerfile exposes port 3000

**Fix Applied:** Updated all ports to 3000 in health check configuration

---

### Issue #5: northflank_marketing.json - Wrong Port
**Severity: HIGH**

**Problem:** Health check configured for port 8080, but Dockerfile exposes port 3000

**Fix Applied:** Updated all ports to 3000 in health check configuration

---

## VERIFICATION STEPS ADDED

All Dockerfiles now include:

### Builder Stage Verification
```dockerfile
RUN echo "=== BUILD VERIFICATION ===" && \
    test -d /app/apps/*/.next/standalone && echo "✓ Standalone dir exists" || (echo "✗ MISSING!"; exit 1) && \
    test -d /app/apps/*/.next/static && echo "✓ Static dir exists" || (echo "✗ MISSING!"; exit 1) && \
    test -f /app/apps/*/.next/BUILD_ID && echo "✓ BUILD_ID exists" || (echo "✗ MISSING!"; exit 1) && \
    find /app/apps/*/.next/standalone -name "server.js" -type f && echo "✓ server.js found" || (echo "✗ MISSING!"; exit 1)
```

### Runtime Stage Verification
```dockerfile
RUN echo "=== RUNTIME VERIFICATION ===" && \
    if [ -f "/app/server.js" ]; then \
        echo "✓ server.js found at /app/server.js"; \
    else \
        echo "✗ CRITICAL: server.js NOT found"; \
        find /app -name "server.js" -type f 2>/dev/null; \
        exit 1; \
    fi
```

---

## CACHE INVALIDATION

New cache invalidation markers added to force rebuilds:

| Dockerfile | Marker |
|------------|--------|
| Dockerfile.lms | `nf-cache-invalidate-lms-2026-07-20-v7` |
| Dockerfile.northflank-admin | `nf-cache-invalidate-admin-2026-07-20-v2` |
| Dockerfile.marketing | `nf-cache-invalidate-marketing-2026-07-20-v2` |
| Dockerfile.northflank-lms | `nf-cache-invalidate-lms-2026-07-20-v6` |

---

## FILES MODIFIED

1. `Dockerfile.lms` - Completely rewritten with correct paths
2. `Dockerfile.northflank-admin` - Fixed static file paths
3. `Dockerfile.marketing` - Fixed static file paths
4. `northflank_admin.json` - Fixed health check ports
5. `northflank_marketing.json` - Fixed health check ports

---

## COMMITS

```
96c034850c fix: resolve static file path mismatches in all Dockerfiles
60fd300c2c fix(northflank-lms): enhance Dockerfile verification for server.js
```

---

## ACTION REQUIRED

1. **Verify Northflank CMD Override** - Ensure no stale override replaces the Dockerfile CMD
2. **Trigger new builds** - The cache invalidation markers force fresh builds
3. **Monitor build logs** - Verify "BUILD VERIFICATION COMPLETE" appears
4. **Check runtime logs** - Verify "RUNTIME VERIFICATION PASSED" appears
5. **Test /api/ping** - Should return 200 on all services

---

## DIAGNOSTIC COMMANDS

Run these in Northflank Shell (SSH) on the newest pod:

```bash
pwd
cat /proc/1/cmdline | tr '\0' ' '
ls -la /app
ls -la /app/apps
ls -la /app/apps/marketing  # or lms, admin
find /app -type f -name "server.js" -print
find /app -type f -name "BUILD_ID" -print
find /app -type d -path "*/.next/static" -print
```

---

## HEALTH CHECK ENDPOINTS VERIFIED

All three apps have `/api/ping` and `/api/health` endpoints:
- ✅ `/apps/lms/app/api/ping/route.ts`
- ✅ `/apps/marketing/app/api/ping/route.ts`
- ✅ `/apps/admin/app/api/ping/route.ts`

---

## DEPLOYMENT CONFIGURATION

| Service | Dockerfile | Port | Health Check |
|---------|-----------|------|--------------|
| LMS | Dockerfile.lms | 8080 | /api/ping |
| Admin | Dockerfile.northflank-admin | 3000 | /api/ping |
| Marketing | Dockerfile.marketing | 3000 | /api/ping |
