# Line-by-Line Audit: app.elevateforhumanity.org & admin.elevateforhumanity.org

**Date:** July 18, 2026  
**Auditor:** OpenHands Agent  
**Status:** 🟡 PUSHED - AWAITING DEPLOYMENT VERIFICATION

---

## Executive Summary

| Domain | HTTP Status | Root Cause | Status |
|--------|-------------|------------|--------|
| `www.elevateforhumanity.org` | 200 ✅ | Working correctly | ✅ VERIFIED |
| `app.elevateforhumanity.org` | 404 ❌ | Route mismatch + wrong container | 🟡 PUSHED |
| `admin.elevateforhumanity.org` | 503 ❌ | Dockerfile bug + container down | 🟡 PUSHED |

## GitHub Commit

```
commit: b2096ef830d20a22968d9ae9c3153708695cb74b
Status: Pushed to main, awaiting deployment verification
```

---

## ISSUE #1: app.elevateforhumanity.org - 404 Route Mismatch

### Root Cause
- Middleware redirects `/` → `/lms`
- `/lms` exists in `apps/lms/app/lms/page.tsx`
- **But `app.elevateforhumanity.org` is connected to wrong container (`apps/app/` instead of `apps/lms/`)**

### Solution
Deploy `apps/lms/` separately using `Dockerfile.northflank-lms`

---

## ISSUE #2: admin.elevateforhumanity.org - 503 No Healthy Upstream

### Root Cause
Dockerfile had incorrect COPY source paths (fixed in commit `b2096ef830`)

### Solution
Rebuild admin service from commit

---

# DEPLOYMENT INSTRUCTIONS

## Correct Architecture

```
www.elevateforhumanity.org → Dockerfile.marketing (port 8080)
app.elevateforhumanity.org  → Dockerfile.northflank-lms (port 8080)
admin.elevateforhumanity.org → Dockerfile.northflank-admin (port 8080)
```

## Deployment Order

1. **Rebuild admin** from commit `b2096ef830`
2. **Test** Northflank-generated admin URL at `/api/ping`
3. **Rebuild/create LMS** from same commit
4. **Test** generated LMS URL at `/api/ping` and `/lms`
5. **Remove** `app.elevateforhumanity.org` from old service
6. **Attach** to healthy LMS service
7. **Remove** `admin.elevateforhumanity.org` from stale service
8. **Attach** to healthy admin service
9. **Verify** custom domains

## Northflank Settings

### Admin Service
```
Repository: elevate-for-humanity/Elevate-lms
Branch: main
Dockerfile: /Dockerfile.northflank-admin
Build context: /
Internal port: 8080
Public port: 8080
Health check: GET /api/ping
Domain: admin.elevateforhumanity.org
Path: /
```

### LMS Service
```
Repository: elevate-for-humanity/Elevate-lms
Branch: main
Dockerfile: /Dockerfile.northflank-lms
Build context: /
Internal port: 8080
Public port: 8080
Health check: GET /api/ping
Domain: app.elevateforhumanity.org
Path: /
```

## Verification Commands

### Before moving custom domains:
```bash
curl -i https://YOUR-ADMIN-NORTHFLANK-URL/api/ping
curl -i https://YOUR-LMS-NORTHFLANK-URL/api/ping
curl -I https://YOUR-LMS-NORTHFLANK-URL/lms
```

### After moving custom domains:
```bash
curl -i https://admin.elevateforhumanity.org/api/ping
curl -i https://app.elevateforhumanity.org/api/ping
curl -I https://app.elevateforhumanity.org/lms
```

### Expected Results:
```
admin /api/ping → 200
app /api/ping   → 200
app /lms        → 200 or valid auth redirect
```

### Error to Watch For:
```
Cannot find module '/app/server.js'
Cannot find module '/app/apps/admin/server.js'
```
If this appears, standalone destination layout needs correction.

---

## Important Notes

1. **Use port 8080**, not 3000
2. **Deploy apps/lms separately** to app.elevateforhumanity.org
3. **Do NOT attach domain** until Northflank-generated URL is healthy
4. **Check runtime logs** for exact server.js path

---

**Document Version:** 1.1  
**Last Updated:** 2026-07-18 17:15 UTC  
**Status:** 🟡 PUSHED - AWAITING DEPLOYMENT VERIFICATION
