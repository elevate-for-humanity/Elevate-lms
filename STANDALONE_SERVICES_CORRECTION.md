# Standalone Services - CORRECTED AUDIT

## CORRECTED ARCHITECTURE (3 Services Only)

Mrs Greene's original table showed 4 services but **elevate-marketing-standalone** is a **DUPLICATE** and should be **DISABLED** (not deleted) until production is verified.

| Service | Dockerfile | Source App | Domain | Port | Health Endpoints |
|---------|------------|------------|--------|------|-----------------|
| **elevate-marketing** | /Dockerfile.marketing | apps/marketing | www.elevateforhumanity.org | 3000 | ✓ |
| **elevate-lms** | /Dockerfile.lms | apps/lms | app.elevateforhumanity.org | 3000 | ✓ |
| **elevate-admin** | /Dockerfile.northflank-admin | apps/admin | admin.elevateforhumanity.org | 3000 | ✓ |

---

## DOCKERFILE LINE-BY-LINE AUDIT

### ✅ Dockerfile.marketing

```
Build Command:    next build (workspace root with BUILD_SCOPE=MARKETING)
Standalone Path:  /app/.next/standalone (workspace root)
Runtime CMD:      node server.js
PORT:             3000
EXPOSE:           3000
Healthcheck:      http://127.0.0.1:3000/api/ping ✓
```

### ✅ Dockerfile.lms

```
Build Command:    pnpm run build:lms:compile --no-lint
Standalone Path:  /app/apps/lms/.next/standalone
Runtime CMD:      node server.js
PORT:             3000
EXPOSE:           3000
Healthcheck:      http://127.0.0.1:3000/api/ping ✓
```

### ✅ Dockerfile.northflank-admin

```
Build Command:    pnpm --filter @elevate/admin build --no-lint
Standalone Path:  /app/apps/admin/.next/standalone
Runtime CMD:      node server.js
PORT:             3000
EXPOSE:           3000
Healthcheck:      http://127.0.0.1:3000/api/ping ✓
```

---

## ✅ VERIFICATION CHECKLIST - MUST ALL BE GREEN

```
✅ Exactly 3 active services

elevate-lms
elevate-admin
elevate-marketing

--------------------------------

✅ Correct Dockerfile

Marketing
  Dockerfile.marketing

LMS
  Dockerfile.lms

Admin
  Dockerfile.northflank-admin

--------------------------------

✅ All listening on port 3000

--------------------------------

✅ Northflank Container Port = 3000

--------------------------------

✅ Health
/api/ping

--------------------------------

✅ Readiness
/api/health

--------------------------------

✅ Version
/api/version

--------------------------------

✅ Restart Count = 0

--------------------------------

✅ Replica Ready

--------------------------------

✅ Domains

www.elevateforhumanity.org
app.elevateforhumanity.org
admin.elevateforhumanity.org

--------------------------------

✅ HTTP 200

/api/ping
/api/health
/api/version

--------------------------------

✅ Old duplicate DISABLED (not deleted)

elevate-marketing-standalone

```

---

## PRODUCTION DEPLOYMENT ORDER

1. **VERIFY** elevate-marketing is healthy on PORT=3000
2. **VERIFY** www.elevateforhumanity.org points to it
3. **REBUILD** elevate-lms with Dockerfile.lms
4. **VERIFY** app.elevateforhumanity.org works
5. **REBUILD** elevate-admin with Dockerfile.northflank-admin
6. **VERIFY** admin.elevateforhumanity.org works
7. **DISABLE** elevate-marketing-standalone (leave for rollback)
8. **MONITOR** for 24-48 hours
9. **DELETE** elevate-marketing-standalone only after stable

---

## ⚠️ IMPORTANT - DO NOT CHANGE PORT WITHOUT NORTHFLANK UPDATE

Before changing any Dockerfile to PORT=3000:
- Northflank Container Port MUST also be set to 3000
- All 5 items must match:

| Item                       | Must Match |
| -------------------------- | ---------- |
| EXPOSE in Dockerfile       | 3000       |
| ENV PORT                   | 3000       |
| Application listening port  | 3000       |
| Northflank Container Port  | 3000       |
| Health check port          | 3000       |

---

## CHANGES MADE

### 1. Health Endpoints Created
All 3 services now have standardized health endpoints:

| Endpoint | Purpose | Database Check |
|----------|---------|----------------|
| `/api/ping` | Liveness probe (process alive) | NO |
| `/api/health` | Readiness probe (app ready) | NO |
| `/api/health/dependencies` | Diagnostics (external deps) | NO (structure only) |
| `/api/version` | Build metadata | NO |

### 2. Dockerfiles Updated
All 3 Dockerfiles now use **PORT=3000** as specified:

```
Dockerfile.marketing:         PORT=3000
Dockerfile.lms:               PORT=3000
Dockerfile.northflank-admin:  PORT=3000
```

### 3. Healthcheck Configuration
All Dockerfiles now use standardized healthcheck:

```
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -sf http://127.0.0.1:3000/api/ping || exit 1
```

---

## NORTHFLANK SERVICE SETTINGS

All 3 services should use:

### Upstream Configuration
```
Host: 0.0.0.0
Port: 3000
Protocol: HTTP
```

### Liveness Probe
```
Path: /api/ping
Initial Delay: 20
Interval: 15
Timeout: 5
Healthy Threshold: 1
Unhealthy Threshold: 3
```

### Readiness Probe
```
Path: /api/health
Initial Delay: 20
Interval: 15
Timeout: 5
Healthy Threshold: 1
Unhealthy Threshold: 3
```

---

## EXPECTED RESPONSES

### GET /api/ping
```json
{"ok":true,"service":"marketing|lms|admin","uptime":12345,"timestamp":"2026-07-20T10:55:00.000Z"}
```

### GET /api/health
```json
{"status":"healthy","ready":true,"service":"marketing|lms|admin","environment":"production","uptime":12345,"timestamp":"2026-07-20T10:55:00.000Z"}
```

### GET /api/health/dependencies
```json
{"service":"marketing|lms|admin","dependencies":{"supabase":false,"redis":false,"sendgrid":false},"timestamp":"2026-07-20T10:55:00.000Z"}
```

### GET /api/version
```json
{"service":"marketing|lms|admin","gitSha":"abc123...","buildId":"build-123","node":"v22.x.x","environment":"production","timestamp":"2026-07-20T10:55:00.000Z"}
```

---

## ACTION ITEMS

### ❌ DELETE: elevate-marketing-standalone
- **Reason**: Duplicate of elevate-marketing (same Dockerfile, same source)
- **Action**: Remove from Northflank dashboard

### 🔄 REBUILD: elevate-lms
- **Dockerfile**: `/Dockerfile.lms`
- **Domain**: app.elevateforhumanity.org
- **Container Port**: 3000

### 🔄 REBUILD: elevate-admin
- **Dockerfile**: `/Dockerfile.northflank-admin`
- **Domain**: admin.elevateforhumanity.org
- **Container Port**: 3000

### ✅ VERIFY: elevate-marketing
- **Dockerfile**: `/Dockerfile.marketing`
- **Domain**: www.elevateforhumanity.org
- **Container Port**: 3000
- Already serving production

---

## KUBERNETES CONFIGURATION (Northflank Underlying Settings)

### Side-by-Side Configuration

| Kubernetes Setting | Marketing | LMS | Admin |
|--------------------|-----------|-----|-------|
| Namespace | production | production | production |
| Workload | Deployment | Deployment | Deployment |
| Replicas | 1 | 1 | 1 |
| Strategy | RollingUpdate | RollingUpdate | RollingUpdate |
| Max Surge | 1 | 1 | 1 |
| Max Unavailable | 0 | 0 | 0 |
| Container Port | 3000 | 3000 | 3000 |
| Protocol | TCP | TCP | TCP |
| Service Type | ClusterIP | ClusterIP | ClusterIP |
| Service Port | 3000 | 3000 | 3000 |
| Target Port | 3000 | 3000 | 3000 |
| Ingress | www.elevateforhumanity.org | app.elevateforhumanity.org | admin.elevateforhumanity.org |
| Readiness Probe | /api/health | /api/health | /api/health |
| Liveness Probe | /api/ping | /api/ping | /api/ping |
| Startup Probe | /api/ping | /api/ping | /api/ping |

### Startup Probe (All Three)
```yaml
startupProbe:
  httpGet:
    path: /api/ping
    port: 3000
  failureThreshold: 30
  periodSeconds: 5
  timeoutSeconds: 5
```

### Readiness Probe (All Three)
```yaml
readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 20
  periodSeconds: 15
  timeoutSeconds: 5
  successThreshold: 1
  failureThreshold: 3
```

### Liveness Probe (All Three)
```yaml
livenessProbe:
  httpGet:
    path: /api/ping
    port: 3000
  initialDelaySeconds: 20
  periodSeconds: 15
  timeoutSeconds: 5
  successThreshold: 1
  failureThreshold: 3
```

### Resource Limits

| Resource | Marketing | LMS | Admin |
|----------|-----------|-----|-------|
| CPU Request | 500m | 500m | 500m |
| CPU Limit | 4000m | 4000m | 4000m |
| Memory Request | 512Mi | 512Mi | 512Mi |
| Memory Limit | 8192Mi | 8192Mi | 8192Mi |

### Environment Variables (Per Service)

| Variable | Marketing | LMS | Admin |
|----------|-----------|-----|-------|
| NODE_ENV | production | production | production |
| HOSTNAME | 0.0.0.0 | 0.0.0.0 | 0.0.0.0 |
| PORT | 3000 | 3000 | 3000 |
| NEXT_TELEMETRY_DISABLED | 1 | 1 | 1 |
| SERVICE_NAME | marketing | lms | admin |

### Healthy Pod Criteria

| Check | Marketing | LMS | Admin |
|-------|-----------|-----|-------|
| Pod Running | ✅ | ✅ | ✅ |
| Startup Probe | ✅ | ✅ | ✅ |
| Readiness Probe | ✅ | ✅ | ✅ |
| Liveness Probe | ✅ | ✅ | ✅ |
| Service Endpoints | 1/1 | 1/1 | 1/1 |
| Restart Count | 0 | 0 | 0 |
| Ready | True | True | True |

---

## SUPABASE CONFIGURATION

### Side-by-Side Supabase Configuration

| Setting | Marketing | LMS | Admin |
|---------|-----------|-----|-------|
| Project | Elevate Production | Elevate Production | Elevate Production |
| Database | Shared PostgreSQL | Shared PostgreSQL | Shared PostgreSQL |
| Auth | Shared | Shared | Shared |
| Storage | Shared | Shared | Shared |
| Realtime | Shared | Shared | Shared |
| Edge Functions | Shared | Shared | Shared |
| Service Name | elevate-marketing | elevate-lms | elevate-admin |

### Public Environment Variables (All Three)

These are safe to expose to the browser:

| Variable | Marketing | LMS | Admin |
|----------|-----------|-----|-------|
| NEXT_PUBLIC_SUPABASE_URL | ✓ | ✓ | ✓ |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✓ | ✓ | ✓ |
| NEXT_PUBLIC_APP_NAME | elevate-marketing | elevate-lms | elevate-admin |

### Server-Only Secrets (All Three)

**Never expose these as `NEXT_PUBLIC_*`:**

| Variable | Purpose |
|----------|---------|
| SUPABASE_SERVICE_ROLE_KEY | Admin access to database |
| SUPABASE_JWT_SECRET | JWT validation |
| DATABASE_URL | PostgreSQL connection string |
| SUPABASE_DB_PASSWORD | Database password |

### Row Level Security

| App | Access Pattern |
|-----|----------------|
| Marketing | Mostly public read; authenticated user profile only when needed |
| LMS | Students, instructors, apprentices, employers access only their own permitted data |
| Admin | Full administrative access using service role on trusted server-side code |

### Health Checks

| Endpoint | Checks Supabase? |
|----------|-----------------|
| `/api/ping` | ❌ No |
| `/api/health` | ❌ No |
| `/api/health/dependencies` | ✅ Yes |

### Production Summary

```
Supabase Project (Shared)
        │
        ├──────────────┐
        │              │
        ▼              ▼
Marketing        LMS
        │              │
        └──────┬───────┘
               │
               ▼
            Admin

Shared:
✓ PostgreSQL
✓ Auth
✓ Storage
✓ Realtime
✓ Edge Functions

Separate:
✓ Dockerfile
✓ Northflank Service
✓ Domain
✓ Health Checks
✓ Runtime Environment
```

---

## Files Modified

```
apps/marketing/app/api/ping/route.ts         - Updated
apps/marketing/app/api/health/route.ts      - Updated
apps/marketing/app/api/health/dependencies/route.ts - Created
apps/marketing/app/api/version/route.ts     - Updated

apps/lms/app/api/ping/route.ts              - Updated
apps/lms/app/api/health/route.ts            - Updated
apps/lms/app/api/health/dependencies/route.ts - Created
apps/lms/app/api/version/route.ts           - Updated

apps/admin/app/api/ping/route.ts            - Updated
apps/admin/app/api/health/route.ts          - Updated
apps/admin/app/api/health/dependencies/route.ts - Created
apps/admin/app/api/version/route.ts         - Updated

Dockerfile.marketing                        - PORT=8080 → 3000, SERVICE_NAME=marketing
Dockerfile.lms                              - PORT=8080 → 3000, SERVICE_NAME=lms
Dockerfile.northflank-admin                 - PORT=8080 → 3000, SERVICE_NAME=admin
```
