# Standalone Services - CORRECTED AUDIT

## CORRECTED ARCHITECTURE (3 Services Only)

Mrs Greene's original table showed 4 services but **elevate-marketing-standalone** is a **DUPLICATE** and should be deleted.

| Service | Dockerfile | Source App | Domain | Port | Health Endpoints |
|---------|------------|------------|--------|------|-----------------|
| **elevate-marketing** | /Dockerfile.marketing | apps/marketing | www.elevateforhumanity.org | 3000 | ✓ |
| **elevate-lms** | /Dockerfile.lms | apps/lms | app.elevateforhumanity.org | 3000 | ✓ |
| **elevate-admin** | /Dockerfile.northflank-admin | apps/admin | admin.elevateforhumanity.org | 3000 | ✓ |

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

Dockerfile.marketing                        - PORT=8080 → 3000
Dockerfile.lms                              - PORT=8080 → 3000
Dockerfile.northflank-admin                 - PORT=8080 → 3000
```
