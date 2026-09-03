# NORTHFLANK PRODUCTION CONFIGURATION PARITY AUDIT

Repository: https://github.com/elevate-for-humanity/Elevate-lms
Commit: 0c06fabad7cd8c97a8d68fdc3367ec83da1fbebc
Northflank Project: elevate-platform
Date: 2026-07-20

---

## CURRENT CONFIGURATION (from Northflank API)

### SERVICE 1: MARKETING

| Field | Current Value |
|-------|---------------|
| Dockerfile | /Dockerfile.marketing |
| Build Context | / (repo root) |
| WORKDIR | /app |
| PORT | 8080 |
| NODE_ENV | production |
| Build Status | SUCCESS |
| Deployed SHA | (pending deployment) |

**CMD in Dockerfile.marketing:**
```dockerfile
COPY --from=builder /app/.next/standalone ./
CMD ["node", "server.js"]
```
✅ CORRECT - Uses standalone server.js

**Northflank Config:**
- CMD Override: Not detected
- Health Check: /api/ping (from configure-services.ts)

---

### SERVICE 2: LMS

| Field | Current Value |
|-------|---------------|
| Dockerfile | /Dockerfile.lms |
| Build Context | / (repo root) |
| WORKDIR | /app |
| PORT | 8080 |
| NODE_ENV | production |
| Build Status | FAILURE |
| Deployed SHA | 67c73545a911 (old) |

**CMD in Dockerfile.lms:**
```dockerfile
COPY --from=builder /app/apps/lms/.next/standalone ./
COPY --from=builder /app/apps/lms/.next/static ./.next/static
COPY --from=builder /app/apps/lms/.next/server ./.next/server
COPY --from=builder /app/apps/lms/public ./public
CMD ["node", "--max-http-header-size=32768", "server.js"]
```

**next.config.mjs:**
```js
output: 'standalone'
```

**Verification needed:** Does standalone output produce `/app/server.js` or `/app/apps/lms/server.js`?

**Northflank Config:**
- CMD Override: Unknown (need to check)
- Health Check: /api/ping, /api/health

---

### SERVICE 3: ADMIN

| Field | Current Value |
|-------|---------------|
| Dockerfile | /Dockerfile.northflank-admin |
| Build Context | / (repo root) |
| WORKDIR | /app |
| PORT | 8080 |
| NODE_ENV | production |
| Build Status | FAILURE |
| Deployed SHA | 67c73545a911 (old) |

**CMD in Dockerfile.northflank-admin (BEFORE FIX):**
```dockerfile
COPY --from=builder /app/apps/admin/.next/standalone ./
CMD ["node", "--max-http-header-size=32768", "apps/admin/server.js"]
```
❌ MISMATCH - Using source custom server instead of standalone

**CMD in Dockerfile.northflank-admin (AFTER FIX 0c06fabad7):**
```dockerfile
COPY --from=builder /app/apps/admin/.next/standalone ./
CMD ["node", "--max-http-header-size=32768", "server.js"]
```
✅ FIXED - Now uses standalone server.js

**next.config.mjs:**
```js
...(useStandaloneOutput ? { output: 'standalone' } : {})
// useStandaloneOutput = process.env.GITHUB_ACTIONS !== 'true' || NEXT_STANDALONE_OUTPUT === '1'
```

---

## VERIFICATION CHECKLIST

### Marketing ✅
- [x] Dockerfile uses standalone COPY
- [x] CMD uses `node server.js`
- [x] output: 'standalone' configured
- [ ] Build succeeded, needs deployment verification

### LMS ⚠️
- [x] Dockerfile uses standalone COPY
- [x] CMD uses `node server.js` (fixed)
- [x] output: 'standalone' configured
- [ ] Build failed - needs investigation
- [ ] Verify actual standalone output path

### Admin ⚠️
- [x] Dockerfile uses standalone COPY (fixed)
- [x] CMD uses `node server.js` (fixed)
- [x] output: 'standalone' configured
- [ ] Build failed - needs investigation

---

## QUESTIONS TO VERIFY

1. **LMS Standalone Path**: Does `pnpm --filter @elevate/lms build` produce:
   - `/app/apps/lms/.next/standalone/server.js` (preserves workspace structure)
   - OR `/app/apps/lms/.next/standalone/apps/lms/server.js`?

2. **Admin Standalone Path**: Same question for admin app.

3. **Build Failures**: Need to check build logs to understand why LMS and Admin builds failed.

---

## DESIRED PRODUCTION CONFIG

### All Services Should Use:

```dockerfile
# Runtime stage
WORKDIR /app

# Copy standalone output (path depends on actual build output)
COPY --from=builder /app/apps/<app>/.next/standalone ./

# Copy static assets to match expected paths
COPY --from=builder /app/apps/<app>/.next/static ./apps/<app>/.next/static
COPY --from=builder /app/apps/<app>/public ./apps/<app>/public

EXPOSE 8080

# Use the GENERATED standalone server.js
CMD ["node", "--max-http-header-size=32768", "server.js"]
```

### Northflank Overrides (ALL should be NONE):
- CMD Override: NONE
- Build Override: NONE

---

## NEXT STEPS

1. [ ] Local build test to verify standalone output path
2. [ ] Fix any static path mismatches
3. [ ] Investigate build failures for LMS and Admin
4. [ ] Verify deployments after successful builds
5. [ ] Confirm health endpoints return 200
6. [ ] Confirm restart count = 0
