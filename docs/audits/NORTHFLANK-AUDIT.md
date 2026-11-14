# Northflank Platform Integration Audit

## Status: IN PROGRESS

---

## 1. Repository → Northflank

| Check | Status | Evidence |
|-------|--------|----------|
| GitHub repository connected | ✅ | `elevate-for-humanity/Elevate-lms` |
| Only main branch deploys | ⚠️ | Needs verification in Northflank UI |
| Preview branches isolated | ⚠️ | Needs verification |
| Webhooks firing | ⚠️ | Check Northflank dashboard |
| Commit SHA matches deployed | ⚠️ | Compare `git rev-parse HEAD` with runtime |

**Required Action:** Verify in Northflank UI at app.northflank.com

---

## 2. Build Pipeline

### Services Configured

| Service | Dockerfile | Status |
|---------|------------|--------|
| LMS | `Dockerfile.northflank-lms` | ✅ Exists |
| Admin | `Dockerfile.northflank-admin` | ✅ Exists |
| Marketing | `Dockerfile.marketing` | ✅ Exists |
| API Workers | - | ⚠️ Needs check |
| Background Jobs | - | ⚠️ Needs check |

### Configuration Files

```
northflank_config.json          # Main LMS config
northflank_config_v2.json       # Updated config
northflank_admin.json           # Admin config
northflank_marketing.json        # Marketing config
```

### Build Verification

| Check | File | Status |
|-------|------|--------|
| Build engine: buildkit | northflank_config.json | ✅ |
| Health check enabled | northflank_config.json | ✅ |
| Health path: /api/health/northflank | northflank_config.json | ✅ |
| Health port: 8080 | northflank_config.json | ✅ |
| Runtime: nodejs | northflank_config.json | ✅ |

---

## 3. Environment Variables

### Required for All Services

| Variable | Marketing | LMS | Admin | Status |
|----------|-----------|-----|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ | Check Northflank |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | ✅ | Check Northflank |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | ✅ | Check Northflank |
| `STRIPE_SECRET_KEY` | ✅ | ✅ | ✅ | Check Northflank |
| `STRIPE_WEBHOOK_SECRET` | ✅ | ✅ | ✅ | Check Northflank |
| `RESEND_API_KEY` | ✅ | ✅ | ✅ | Check Northflank |
| `OPENAI_API_KEY` | - | ✅ | - | Check Northflank |
| `ADZUNA_APP_ID` | - | ✅ | - | Check Northflank |
| `ADZUNA_APP_KEY` | - | ✅ | - | Check Northflank |
| `ONET_API_KEY` | - | ✅ | - | Check Northflank |

### Northflank-Specific Variables

| Variable | Purpose | Status |
|----------|---------|--------|
| `NORTHFLANK_PROJECT_ID` | Northflank project | Check Northflank |
| `NORTHFLANK_API_TOKEN` | API authentication | Check Northflank |
| `NORTHFLANK_TEAM_ID` | Team identifier | Check Northflank |
| `NORTHFLANK_SECRET_GROUP_ID` | Environment group | Default: elevate-production-env |
| `NORTHFLANK_LMS_SERVICE_ID` | LMS service name | Default: elevate-lms |
| `NORTHFLANK_ADMIN_SERVICE_ID` | Admin service name | Default: elevate-admin |

---

## 4. Service Communication

```
                    ┌─────────────┐
                    │   Northflank│
                    │   Platform  │
                    └──────┬──────┘
                           │
    ┌───────────────────────┼───────────────────────┐
    ▼                       ▼                       ▼
┌─────────┐           ┌─────────┐           ┌─────────┐
│Marketing│           │   LMS   │           │  Admin  │
└────┬────┘           └────┬────┘           └────┬────┘
     │                    │                    │
     └────────────────────┴────────────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │  Supabase  │
                    │  (Central) │
                    └─────────────┘
```

### Connectivity Matrix

| From → To | Supabase | Storage | Auth | APIs | Status |
|-----------|----------|---------|------|------|--------|
| Marketing → Supabase | ✅ | ✅ | ✅ | - | Verify |
| LMS → Supabase | ✅ | ✅ | ✅ | ✅ | Verify |
| Admin → Supabase | ✅ | ✅ | ✅ | ✅ | Verify |
| LMS → Adzuna | - | - | - | ✅ | Config needed |
| LMS → O*NET | - | - | - | ✅ | Config needed |

---

## 5. Health Endpoints

### Implemented

| Endpoint | File | Purpose |
|----------|------|---------|
| `/api/health/northflank` | apps/*/app/api/health/northflank/ | Northflank health check |
| `/api/devstudio/northflank-status` | apps/app/api/devstudio/northflank-status/ | Service status for Dev Studio |
| `/api/ping` | - | Basic ping |
| `/api/status` | - | Full status |

### Northflank Status API

Located at: `lib/northflank/runtime.ts`

Functions:
- `getNorthflankProjectId()` - Get project ID
- `getNorthflankService(serviceId)` - Get service details
- `getNorthflankServices()` - List all services
- `isNorthflankReady()` - Check if configured

---

## 6. Dev Studio Integration

### What Dev Studio Can Access

| Feature | Status | Implementation |
|---------|--------|----------------|
| Deployment status | ✅ | `/api/devstudio/northflank-status` |
| Trigger builds | ⚠️ | Via Northflank API |
| View logs | ⚠️ | Via Northflank API |
| Environment variables | ⚠️ | Masked view needed |
| Health checks | ✅ | Real-time status |
| Current Git SHA | ✅ | Via build info |
| Current Build ID | ✅ | Via Northflank API |
| Docker image tag | ⚠️ | Via Northflank API |
| Deployment history | ⚠️ | Via Northflank API |
| Rollback | ⚠️ | Not implemented |

---

## 7. Course Builder Integration

### Automatic Updates

| After Publish | Auto-Update | Implementation |
|---------------|-------------|----------------|
| Website pages | ⚠️ | Needs verification |
| LMS content | ✅ | Direct DB write |
| Database | ✅ | Supabase |
| Search index | ⚠️ | Check if implemented |
| Career mappings | ⚠️ | O*NET connected |
| PARIS knowledge | ⚠️ | Not auto-updated |
| Digital Binder | ⚠️ | Template linking |

---

## 8. Build Provenance

### Version Information Available

| Info | Source | Status |
|------|--------|--------|
| Git Commit SHA | Environment / Build | ✅ |
| Build ID | Northflank API | ✅ |
| Build Date | Build timestamp | ⚠️ |
| Docker Image Digest | Northflank API | ✅ |
| Service Name | Config | ✅ |
| Environment | Config | ✅ |

---

## 9. Deployment Verification Checklist

After deployment, verify these routes:

### Marketing Site
- [ ] `/` - Homepage
- [ ] `/programs` - Program listing
- [ ] `/about` - About page
- [ ] `/apply` - Application page

### LMS
- [ ] `/lms` - Dashboard
- [ ] `/lms/courses` - Course listing
- [ ] `/lms/placement` - Job placement
- [ ] `/lms/progress` - Progress tracking

### Admin
- [ ] `/admin` - Admin dashboard
- [ ] `/admin/students` - Student management
- [ ] `/admin/programs` - Program management
- [ ] `/admin/studio` - Dev Studio

### API
- [ ] `/api/health/northflank` - Health check
- [ ] `/api/paris` - PARIS AI
- [ ] `/api/jobs/search` - Job search
- [ ] `/api/jobs/salary` - Salary API

---

## 10. Module Integration Matrix

| Module | Northflank | Runtime | Health | DB | API |
|---------|------------|---------|--------|----|-----|
| Marketing | ✅ | ⚠️ | ✅ | ✅ | - |
| LMS | ✅ | ⚠️ | ✅ | ✅ | ✅ |
| Admin | ✅ | ⚠️ | ✅ | ✅ | ✅ |
| PARIS AI | - | ⚠️ | ✅ | ✅ | ✅ |
| Dev Studio | ✅ | ⚠️ | ✅ | ✅ | ✅ |
| Course Builder | - | ⚠️ | ✅ | ✅ | ✅ |
| Program Builder | - | ⚠️ | ✅ | ✅ | ✅ |
| CRM | - | ⚠️ | ✅ | ✅ | ✅ |
| Digital Binder | - | ⚠️ | ✅ | ✅ | ✅ |
| Career Services | - | ⚠️ | ✅ | ✅ | ✅ |
| O*NET | - | - | N/A | ✅ | ✅ |
| Adzuna | - | - | N/A | ✅ | ✅ |
| Stripe | - | - | N/A | ✅ | ✅ |
| Supabase | - | ✅ | ✅ | ✅ | ✅ |

---

## Required Actions

### Immediate (Before Production)

1. **Add to Northflank:**
   - [ ] ADZUNA_APP_ID
   - [ ] ADZUNA_APP_KEY
   - [ ] ONET_API_KEY
   - [ ] USAJOBS_API_KEY
   - [ ] CAREERONESTOP credentials

2. **Verify in Northflank UI:**
   - [ ] GitHub webhook connected
   - [ ] Build triggers on main
   - [ ] Environment variables loaded
   - [ ] Health check returning 200

3. **Runtime Verification:**
   - [ ] Visit /api/health/northflank on each service
   - [ ] Compare git SHA with deployment
   - [ ] Test job search API
   - [ ] Test PARIS chat

### Production Checklist

- [ ] All routes return 200
- [ ] Database migrations complete
- [ ] No console errors
- [ ] Health checks passing
- [ ] Logging enabled
- [ ] Error tracking (Sentry) configured
- [ ] Backup strategy in place

---

## Files Reference

### Dockerfiles
```
Dockerfile.northflank-lms
Dockerfile.northflank-admin
Dockerfile.marketing
Dockerfile.current
Dockerfile.green
```

### Config Files
```
northflank_config.json
northflank_config_v2.json
northflank_admin.json
northflank_marketing.json
```

### Health Endpoints
```
apps/*/app/api/health/northflank/
apps/app/api/devstudio/northflank-status/
```

### Libraries
```
lib/northflank/runtime.ts
```

---

## Testing Commands

```bash
# Check current git SHA
git rev-parse HEAD

# Test health endpoint
curl https://work-1-zwapflgqzcvfvlvh.prod-runtime.all-hands.dev/api/health/northflank

# Test job search
curl "https://work-1-zwapflgqzcvfvlvh.prod-runtime.all-hands.dev/api/jobs/search?what=Medical%20Assistant&where=Indianapolis"

# Test PARIS
curl -X POST https://work-1-zwapflgqzcvfvlvh.prod-runtime.all-hands.dev/api/paris \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```
