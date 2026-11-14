# Northflank Standalone Configuration Parity Audit

## ❌ CRITICAL ISSUES FOUND

All 3 services have **PORT MISMATCH** between Northflank (8080) and Dockerfiles (3000).

---

## Configuration Comparison

### Build Configuration

| Configuration | Marketing | LMS | Admin | Status |
|--------------|-----------|-----|-------|--------|
| Dockerfile | `/Dockerfile.marketing` | `/Dockerfile.lms` | `/Dockerfile.northflank-admin` | ✅ MATCH |
| Build Context | `/` | `/` | `/` | ✅ MATCH |
| Branch | main | main | main | ✅ MATCH |
| CI Enabled | `false` | `true` ❌ | `true` ❌ | NEEDS FIX |
| Ephemeral Storage | 1024MB ❌ | 2048MB ✅ | 2048MB ✅ | NEEDS FIX |

### Runtime Configuration

| Configuration | Marketing | LMS | Admin | Status |
|--------------|-----------|-----|-------|--------|
| Internal Port | 8080 ❌ | 8080 ❌ | 8080 ❌ | **ALL WRONG** |
| Container PORT env | ❌ MISSING | 8080 ❌ | 8080 ❌ | NEEDS FIX |
| HOSTNAME | ❌ MISSING | 0.0.0.0 ✅ | 0.0.0.0 ✅ | NEEDS FIX |
| NODE_ENV | ❌ MISSING | production ✅ | production ✅ | NEEDS FIX |
| SERVICE_NAME | ❌ MISSING | ❌ `SERVICE_ROLE` | ❌ `SERVICE_ROLE` | NEEDS FIX |
| PORT | 3000 (Dockerfile) | 8080 ❌ | 8080 ❌ | NEEDS FIX |

### Environment Variables

| Variable | Marketing | LMS | Admin | Fix Required |
|----------|-----------|-----|-------|--------------|
| `PORT=3000` | ❌ MISSING | ❌ 8080 | ❌ 8080 | **YES** |
| `HOSTNAME=0.0.0.0` | ❌ MISSING | ✅ 0.0.0.0 | ✅ 0.0.0.0 | Marketing |
| `SERVICE_NAME` | ❌ MISSING | ❌ SERVICE_ROLE | ❌ SERVICE_ROLE | **YES** |
| `NODE_ENV=production` | ❌ MISSING | ✅ | ✅ | Marketing |
| Supabase URL | ✅ | ✅ | ✅ | - |
| Supabase Anon Key | ✅ | ✅ | ✅ | - |
| Service Role Key | ❌ MISSING | ✅ | ✅ | Marketing |

---

## Required Fixes (Priority Order)

### P0 - CRITICAL (Blocks Deployment)

1. **Set Container Port = 3000** for all 3 services
2. **Set PORT=3000** runtime env for all 3 services
3. **Rename SERVICE_ROLE → SERVICE_NAME** for LMS and Admin
4. **Add SERVICE_NAME** for Marketing

### P1 - HIGH (Causes CI Failures)

1. Enable CI for LMS and Admin (`disabledCI: false`)
2. Increase Marketing ephemeral storage to 2048MB

### P2 - MEDIUM (Missing Vars)

1. Add `HOSTNAME=0.0.0.0` to Marketing
2. Add `NODE_ENV=production` to Marketing
3. Add `SUPABASE_SERVICE_ROLE_KEY` to Marketing

---

## Health Check Configuration

All services currently use **NO health checks** configured in Northflank.

Need to add:
- Liveness: GET `/api/ping`
- Readiness: GET `/api/health`

---

## Build Status

| Service | Build | Deployment |
|---------|-------|------------|
| Marketing | FAILURE | IN_PROGRESS |
| LMS | FAILURE | IN_PROGRESS |
| Admin | FAILURE | COMPLETED |

Root cause: **PORT MISMATCH** - Northflank expects 8080, containers listen on 3000.

---

## Audit Date: 2026-07-20
