# Production Readiness Checklist

## Status: ⚠️ BLOCKED - Services Not Running

**Last Tested:** 2026-07-09
**Result:** All endpoints return 502 Bad Gateway

---

## Critical Blockers

### 1. Northflank Deployment Issue

| Service | URL | Status | Action |
|---------|-----|--------|--------|
| Marketing/LMS | work-1 | ❌ 502 | Redeploy |
| Admin | work-2 | ❌ 502 | Redeploy |

**Symptoms:**
- All HTTP requests return 502 Bad Gateway
- Load balancer cannot reach application containers
- Possible causes:
  - Containers crashed on startup
  - Memory insufficient
  - Port configuration mismatch
  - Health check failing

---

## Pre-Flight Checks

### Northflank Dashboard

- [ ] Verify project exists at app.northflank.com
- [ ] Check deployment logs for errors
- [ ] Verify containers are running
- [ ] Check health check endpoint directly on container
- [ ] Verify environment variables loaded
- [ ] Check resource limits (memory/CPU)

### Database (Supabase)

- [ ] Verify Supabase project is active
- [ ] Check database migrations applied
- [ ] Verify RLS policies configured
- [ ] Test direct database connection

### GitHub

- [ ] Verify webhook to Northflank configured
- [ ] Check Actions workflow status
- [ ] Verify branch protection rules

---

## Deployment Steps

### 1. Redeploy LMS Service

```bash
# Via Northflank UI:
# 1. Go to elevate-lms project
# 2. Select elevate-lms service
# 3. Click "Redeploy"
# 4. Monitor build logs
```

### 2. Redeploy Admin Service

```bash
# Via Northflank UI:
# 1. Go to elevate-lms project
# 2. Select elevate-admin service
# 3. Click "Redeploy"
# 4. Monitor build logs
```

### 3. Verify Health Checks

```bash
# After redeployment, test:
curl https://work-1-zwapflgqzcvfvlvh.prod-runtime.all-hands.dev/api/health/northflank
curl https://work-2-zwapflgqzcvfvlvh.prod-runtime.all-hands.dev/api/health/northflank
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-07-09T...",
  "services": {
    "database": "connected",
    "storage": "connected"
  }
}
```

---

## Environment Variables Checklist

### Required in Northflank

| Variable | Value | Status |
|----------|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | ❓ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | ❓ |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | ❓ |
| `STRIPE_SECRET_KEY` | `sk_live_...` | ❓ |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | ❓ |
| `RESEND_API_KEY` | `re_...` | ❓ |
| `OPENAI_API_KEY` | `sk-...` | ❓ |
| `ADZUNA_APP_ID` | `08a9335d` | ❓ |
| `ADZUNA_APP_KEY` | `28030c1d...` | ❓ |
| `ONET_API_KEY` | `jkkII-...` | ❓ |
| `NORTHFLANK_API_TOKEN` | `nf_...` | ❓ |
| `NORTHFLANK_PROJECT_ID` | `xxx` | ❓ |

---

## Testing Protocol

After successful deployment, run:

```bash
# 1. Health checks
./scripts/runtime-verification.sh

# 2. Authentication test
curl -X POST https://work-1.../api/auth/v1/signup \
  -H "apikey: xxx" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# 3. Job search test
curl "https://work-1.../api/jobs/search?what=Medical%20Assistant"

# 4. PARIS test
curl -X POST https://work-1.../api/paris \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

---

## Module Verification Checklist

### Authentication
- [ ] User signup works
- [ ] User login works
- [ ] Password reset works
- [ ] Session persists
- [ ] Role-based access enforced

### PARIS AI
- [ ] Chat interface loads
- [ ] Can start conversation
- [ ] Recommendations generate
- [ ] Writes to database

### Course Builder
- [ ] Can create course
- [ ] AI generation works
- [ ] Saves to database
- [ ] Appears in LMS

### Career Services
- [ ] Job search returns results
- [ ] Salary API works
- [ ] O*NET integration works
- [ ] Adzuna integration works

### Enrollment
- [ ] Application form works
- [ ] Documents upload
- [ ] Enrollment creates
- [ ] Dashboard updates

### Payments
- [ ] Stripe checkout works
- [ ] Webhooks receive
- [ ] Payment records create
- [ ] Receipts send

---

## Final Sign-Off

| Check | Status | Verified By | Date |
|-------|--------|-------------|------|
| Marketing site | ☐ | | |
| Admin dashboard | ☐ | | |
| LMS | ☐ | | |
| PARIS AI | ☐ | | |
| Course Builder | ☐ | | |
| Career Services | ☐ | | |
| Enrollment flow | ☐ | | |
| Payments | ☐ | | |
| Database | ☐ | | |
| Storage | ☐ | | |
| Auth | ☐ | | |
| Notifications | ☐ | | |

**Ready for Production:** ☐ Yes ☐ No

**Signed Off By:** _________________

**Date:** _________________
