# Admin Dashboard URL Configuration Audit

**Date:** July 13, 2026
**Status:** AUDIT IN PROGRESS

---

## Current Production URLs

| Service | Production URL | Work Host |
|---------|----------------|-----------|
| **LMS** | https://www.elevateforhumanity.org | work-1-bgzafhxkzrlkqldm.prod-runtime.all-hands.dev |
| **Admin** | https://admin.elevateforhumanity.org | work-2-bgzafhxkzrlkqldm.prod-runtime.all-hands.dev |

---

## URL Configuration Files

### 1. Environment Variables
| Variable | Value | Status |
|----------|-------|--------|
| `NEXT_PUBLIC_SITE_URL` | https://www.elevateforhumanity.org | ✅ Configured |
| `NEXT_PUBLIC_ADMIN_URL` | https://admin.elevateforhumanity.org | ✅ Configured |
| `NEXT_PUBLIC_LMS_URL` | https://www.elevateforhumanity.org/lms | ✅ Configured |

### 2. Hardcoded URLs (NEEDS FIX)

| File | Hardcoded URL | Should Be |
|------|---------------|-----------|
| `scripts/northflank/configure-services.ts` | admin.elevateforhumanity.org | ✅ Uses env var |
| `proxy.ts` | admin.elevateforhumanity.org | ⚠️ Check |
| `lib/utils/siteUrl.ts` | Falls back to env | ✅ OK |

### 3. Build-time Variables

| Dockerfile | Build Args | Admin URL Config |
|------------|------------|------------------|
| `Dockerfile.northflank-admin` | `NEXT_PUBLIC_SITE_URL` | Needs `NEXT_PUBLIC_ADMIN_URL` |

---

## Admin Routes (120 total)

### Core Routes
```
/admin/dashboard          → DashboardShell
/admin/applications       → AdminAppsPage
/admin/enrollments        → AdminEnrollments
/admin/students           → AdminStudents
/admin/courses            → AdminCourses
/admin/billing            → AdminBilling
/admin/reports            → AdminReports
/admin/settings           → AdminSettings
```

### Subscription Routes
```
/admin/billing/subscriptions         → SubscriptionList
/admin/billing/subscriptions/[id]    → SubscriptionDetail
/admin/billing/plans                 → PlanManagement
```

### Content Routes
```
/admin/content               → ContentLibrary
/admin/content/editor        → ContentEditor
/admin/videos                → VideoManager
/admin/videos/upload         → VideoUploader
```

---

## Domain Verification

### Required for Admin
- [ ] Domain: `admin.elevateforhumanity.org`
- [ ] SSL Certificate
- [ ] DNS A/CNAME Record
- [ ] Northflank Load Balancer

### Required for Work Hosts
- [ ] LMS: `work-1-bgzafhxkzrlkqldm.prod-runtime.all-hands.dev`
- [ ] Admin: `work-2-bgzafhxkzrlkqldm.prod-runtime.all-hands.dev`

---

## Action Items

### HIGH PRIORITY
1. [ ] Verify DNS configuration for admin.elevateforhumanity.org
2. [ ] Check SSL certificate status
3. [ ] Verify Northflank routing rules

### MEDIUM PRIORITY
4. [ ] Update Dockerfile.northflank-admin with ADMIN_URL build arg
5. [ ] Test admin routes resolve correctly
6. [ ] Verify API routes point to correct admin URL

### LOW PRIORITY
7. [ ] Update hardcoded URLs in scripts (not critical, scripts only)
8. [ ] Document production deployment steps

---

## Quick Commands

```bash
# Check admin health
curl https://work-2-bgzafhxkzrlkqldm.prod-runtime.all-hands.dev/api/health

# Check admin dashboard
curl -I https://work-2-bgzafhxkzrlkqldm.prod-runtime.all-hands.dev/admin/dashboard

# Check subscriptions API
curl https://work-2-bgzafhxkzrlkqldm.prod-runtime.all-hands.dev/api/admin/subscriptions
```
