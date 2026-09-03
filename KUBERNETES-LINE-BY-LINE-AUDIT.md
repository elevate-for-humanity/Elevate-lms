# KUBERNETES / NORTHFLANK CONFIGURATION LINE-BY-LINE AUDIT

## Overview
This repository uses **Northflank** as its container orchestration platform, which manages Kubernetes under the hood. The configurations below represent the K8s deployment manifests mapped to Northflank's API.

---

## 1. northflank_marketing.json

```json
Line 1:  {
Line 2:    "serviceType": "web",
Line 3:    "name": "elevate-marketing",
Line 4:    "billing": {
Line 5:      "deploymentPlan": "nf-compute-400"       ← 4000m CPU, sufficient for Next.js build
Line 6:    },
Line 7:    "buildEngineConfiguration": {
Line 8:      "buildEngine": "buildkit"                  ← ✅ BuildKit enabled for faster builds
Line 9:    },
Line 10:   "vcsData": {
Line 11:     "projectUrl": "https://github.com/elevate-for-humanity/Elevate-lms",
Line 12:     "projectBranch": "main",
Line 13:     "dockerFilePath": "/Dockerfile.marketing", ← ✅ Correct Dockerfile
Line 14:     "dockerWorkDir": "/"                       ← ✅ Root build context
Line 15:   },
Line 16:   "buildSecrets": {                           ← ⚠️ EMPTY VALUES - should be set in Northflank UI
Line 17:     "NEXT_PUBLIC_SUPABASE_URL": "",
Line 18:     "NEXT_PUBLIC_SUPABASE_ANON_KEY": "",
Line 19:     "SUPABASE_SERVICE_ROLE_KEY": "",
Line 20:     "NEXT_PUBLIC_SITE_URL": "https://www.elevateforhumanity.org",
Line 21:     "NEXT_PUBLIC_ADMIN_URL": "https://admin.elevateforhumanity.org",
Line 22:     "STRIPE_SECRET_KEY": "",
Line 23:     "STRIPE_WEBHOOK_SECRET": "",
Line 24:     "SENDGRID_API_KEY": "",
Line 25:     "RESEND_API_KEY": "",
Line 26:     "ADMIN_API_KEY": ""
Line 27:   },
Line 28:   "buildArgs": {
Line 29:     "NEXT_PUBLIC_SITE_URL": "https://www.elevateforhumanity.org",
Line 30:     "NEXT_PUBLIC_ADMIN_URL": "https://admin.elevateforhumanity.org"
Line 31:   },
Line 32:   "deployment": {
Line 33:     "healthCheck": {
Line 34:       "enabled": true,
Line 35:       "path": "/",                             ← ❌ ISSUE: Should be `/api/ping` or `/api/health`
Line 36:       "port": 8080,                            ← ✅ Matches Dockerfile EXPOSE 8080
Line 37:       "protocol": "HTTP"
Line 38:     },
Line 39:     "replicas": {
Line 40:       "min": 1,
Line 41:       "max": 3                                 ← ✅ Auto-scaling enabled
Line 42:     },
Line 43:     "resources": {
Line 44:       "cpu": "4000m",                          ← ✅ 4 cores
Line 45:       "memory": "8192Mi"                       ← ✅ 8GB RAM
Line 46:     }
Line 47:   }
Line 48: }
```

### Issues Found:
| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 35 | `path: "/"` - Homepage not suitable for health check | HIGH | Change to `/api/ping` |
| 16-26 | Build secrets have empty values | MEDIUM | Must be set in Northflank UI |

---

## 2. northflank_admin.json

```json
Line 1:  {
Line 2:    "serviceType": "web",
Line 3:    "name": "elevate-admin",
Line 4:    "billing": {
Line 5:      "deploymentPlan": "nf-compute-400"
Line 6:    },
Line 7:    "buildEngineConfiguration": {
Line 8:      "buildEngine": "buildkit"
Line 9:    },
Line 10:   "vcsData": {
Line 11:     "projectUrl": "https://github.com/elevate-for-humanity/Elevate-lms",
Line 12:     "projectBranch": "main",
Line 13:     "dockerFilePath": "/Dockerfile.northflank-admin",
Line 14:     "dockerWorkDir": "/"
Line 15:   },
Line 16:   "buildSecrets": {                           ← ⚠️ EMPTY VALUES
Line 17:     "NEXT_PUBLIC_SUPABASE_URL": "",
Line 18:     "NEXT_PUBLIC_SUPABASE_ANON_KEY": "",
Line 19:     "SUPABASE_SERVICE_ROLE_KEY": "",
Line 20:     "NEXT_PUBLIC_SITE_URL": "https://www.elevateforhumanity.org",
Line 21:     "NEXT_PUBLIC_ADMIN_URL": "https://admin.elevateforhumanity.org"
Line 22:   },
Line 23:   "buildArgs": {
Line 24:     "NEXT_PUBLIC_SITE_URL": "https://www.elevateforhumanity.org",
Line 25:     "NEXT_PUBLIC_ADMIN_URL": "https://admin.elevateforhumanity.org"
Line 26:   },
Line 27:   "deployment": {
Line 28:     "healthCheck": {
Line 29:       "enabled": true,
Line 30:       "path": "/admin",                        ← ❌ ISSUE: Auth-protected route, will return 307 redirect
Line 31:       "port": 8080,
Line 32:       "protocol": "HTTP"
Line 33:     },
Line 34:     "replicas": {
Line 35:       "min": 1,
Line 36:       "max": 3
Line 37:     },
Line 38:     "resources": {
Line 39:       "cpu": "4000m",
Line 40:       "memory": "8192Mi"
Line 41:     }
Line 42:   }
Line 43: }
```

### Issues Found:
| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 30 | `path: "/admin"` - Returns 307 redirect to login | CRITICAL | Change to `/api/health` |
| 16-21 | Build secrets have empty values | MEDIUM | Must be set in Northflank UI |

---

## 3. northflank_config_v2.json

```json
Line 1:  {
Line 2:    "serviceType": "combined",                   ← ⚠️ Changed from "web" to "combined"
Line 3:    "name": "Elevate-lms build",
Line 4:    "billing": {
Line 5:      "deploymentPlan": "nf-compute-400"
Line 6:    },
Line 7:    "buildEngineConfiguration": {
Line 8:      "buildEngine": "buildkit"
Line 9:    },
Line 10:   "vcsData": {
Line 11:     "projectUrl": "https://github.com/elevate-for-humanity/Elevate-lms",
Line 12:     "projectBranch": "main",
Line 13:     "dockerFilePath": "/Dockerfile.northflank-lms",
Line 14:     "dockerWorkDir": "/"
Line 15:   },
Line 16:   "buildSecrets": {                           ← ⚠️ EMPTY VALUES
Line 17:     "NEXT_PUBLIC_SUPABASE_URL": "",
Line 18:     "NEXT_PUBLIC_SUPABASE_ANON_KEY": "",
Line 19:     "SUPABASE_SERVICE_ROLE_KEY": "",
Line 20:     "NEXT_PUBLIC_SITE_URL": "https://www.elevateforhumanity.org"
Line 21:   },
Line 22:   "buildArgs": {
Line 23:     "NEXT_PUBLIC_SITE_URL": "https://www.elevateforhumanity.org"
Line 24:   }
Line 25: }                                            ← ❌ MISSING: No deployment.healthCheck config!
```

### Issues Found:
| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 2 | `serviceType: "combined"` - May affect routing | MEDIUM | Verify if this is intentional |
| N/A | No `deployment.healthCheck` section | CRITICAL | Add health check config |

---

## 4. northflank_config.json (Original)

```json
Line 1:  {
Line 2:    "buildEngineConfiguration": {
Line 3:      "buildEngine": "buildkit"
Line 4:    },
Line 5:    "vcsData": {
Line 6:      "dockerFilePath": "/Dockerfile.northflank-lms",
Line 7:      "dockerWorkDir": "/"
Line 8:    },
Line 9:    "billing": {
Line 10:     "deploymentPlan": "nf-compute-400"
Line 11:   },
Line 12:   "deployment": {
Line 13:     "healthCheck": {
Line 14:       "enabled": true,
Line 15:       "path": "/api/health/northflank",        ← ✅ Better path for health check
Line 16:       "port": 8080,
Line 17:       "protocol": "HTTP"
Line 18:     }
Line 19:   }
Line 20: }
```

### This config is ✅ BETTER - Has proper health check path

---

## 5. northflank_engine_fix.json

```json
{
  "buildEngineConfiguration": {
    "buildEngine": "buildkit"
  },
  "vcsData": {
    "dockerFilePath": "/Dockerfile.northflank-lms",
    "dockerWorkDir": "/"
  },
  "billing": {
    "deploymentPlan": "nf-compute-400"
  },
  "deployment": {
    "healthCheck": {
      "enabled": true,
      "path": "/api/health/northflank",
      "port": 8080,
      "protocol": "HTTP"
    }
  }
}
```

### Status: ✅ CORRECT - Good health check config

---

## DOCKERFILE HEALTHCHECK AUDIT

### Dockerfile.marketing (Line 99-101)
```dockerfile
99: # Health check using /api/ping (no deps, instant response)
100: HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
101:   CMD curl -sf http://127.0.0.1:8080/api/ping || exit 1
```
✅ **CORRECT** - Uses `/api/ping` which returns 200 OK

### Dockerfile.northflank-lms (Line 143-144)
```dockerfile
143: HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
144:   CMD curl -sf http://127.0.0.1:8080/api/ping || exit 1
```
✅ **CORRECT** - Uses `/api/ping`

### Dockerfile.northflank-admin (Line 131-133)
```dockerfile
131: # Health check: /api/ping returns {status:ok} reliably
132: HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
133:   CMD curl -sf http://127.0.0.1:8080/api/ping || curl -sf http://127.0.0.1:8080/ || exit 1
```
⚠️ **OK** - Fallback to root page

---

## PORT CONFIGURATION AUDIT

| Service | Northflank Config Port | Dockerfile EXPOSE | server.js PORT | Status |
|---------|----------------------|-------------------|----------------|--------|
| Marketing | 8080 | 8080 | 3000 (default) | ✅ Docker ENV PORT=8080 |
| LMS | 8080 | 8080 | 8080 (via CMD) | ✅ Correct |
| Admin | 8080 | 8080 | 8080 (via CMD) | ✅ Correct |

---

## HEALTH CHECK PATH COMPARISON

| Source | Marketing | LMS | Admin |
|--------|-----------|-----|-------|
| northflank_*.json | `/` ❌ | N/A | `/admin` ❌ |
| Dockerfile HEALTHCHECK | `/api/ping` ✅ | `/api/ping` ✅ | `/api/ping` ✅ |
| northflank_config.json | N/A | `/api/health/northflank` ✅ | N/A |

---

## RECOMMENDED FIXES

### Fix 1: Update northflank_marketing.json
```json
"deployment": {
  "healthCheck": {
    "enabled": true,
    "path": "/api/health",
    "port": 8080,
    "protocol": "HTTP",
    "initialDelaySeconds": 60,
    "periodSeconds": 30,
    "timeoutSeconds": 10,
    "failureThreshold": 3
  }
}
```

### Fix 2: Update northflank_admin.json
```json
"deployment": {
  "healthCheck": {
    "enabled": true,
    "path": "/api/health",
    "port": 8080,
    "protocol": "HTTP",
    "initialDelaySeconds": 60,
    "periodSeconds": 30,
    "timeoutSeconds": 10,
    "failureThreshold": 3
  }
}
```

### Fix 3: Add healthCheck to northflank_config_v2.json
```json
"deployment": {
  "healthCheck": {
    "enabled": true,
    "path": "/api/health",
    "port": 8080,
    "protocol": "HTTP"
  }
}
```

---

## ROOT CAUSE ANALYSIS: "no healthy upstream"

**Problem:** Northflank health check is hitting `/` or `/admin` which either:
1. Returns HTML instead of JSON (not a valid health response)
2. Redirects to login (307) for protected routes
3. Times out waiting for full Next.js hydration

**Solution Applied:**
1. Created `/api/ping` endpoint - instant 200 OK, no dependencies
2. Created `/api/health` endpoint - returns JSON with DB status
3. Added HEALTHCHECK to Dockerfile.marketing
4. Fixed service name mismatches in health responses

---

## SUMMARY TABLE

| Config File | Health Check Path | Status | Action Required |
|-------------|------------------|--------|------------------|
| northflank_marketing.json | `/` | ❌ WRONG | Update to `/api/health` |
| northflank_admin.json | `/admin` | ❌ WRONG | Update to `/api/health` |
| northflank_config_v2.json | NONE | ❌ MISSING | Add health check |
| northflank_config.json | `/api/health/northflank` | ✅ CORRECT | None |
| northflank_engine_fix.json | `/api/health/northflank` | ✅ CORRECT | None |
| Dockerfile.marketing | `/api/ping` | ✅ CORRECT | None (just added) |
| Dockerfile.northflank-lms | `/api/ping` | ✅ CORRECT | None |
| Dockerfile.northflank-admin | `/api/ping` | ✅ CORRECT | None |

---

## AUDIT COMPLETED: 2026-07-20

**Files Audited:**
- northflank_marketing.json
- northflank_admin.json
- northflank_config_v2.json
- northflank_config.json
- northflank_engine_fix.json
- Dockerfile.marketing
- Dockerfile.northflank-lms
- Dockerfile.northflank-admin

**Next Steps:**
1. Update Northflank portal with corrected health check paths
2. Redeploy Marketing service
3. Redeploy Admin service
4. Verify "no healthy upstream" is resolved
