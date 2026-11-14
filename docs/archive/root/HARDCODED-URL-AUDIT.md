# Hardcoded URL Audit

**Date:** July 13, 2026
**Status:** COMPLETE

---

## Executive Summary

| Category | Count | Status |
|----------|-------|--------|
| Production URLs | 47 | ✅ OK |
| Work Host URLs | 12 | ⚠️ REVIEW |
| Hardcoded Domains | 8 | ⚠️ NEEDS FIX |

---

## 1. PRODUCTION URLS (OK)

These are intentional and correct:

| URL | Usage | Status |
|-----|-------|--------|
| `https://www.elevateforhumanity.org` | Main site | ✅ Correct |
| `https://admin.elevateforhumanity.org` | Admin dashboard | ✅ Correct |
| `https://lms.elevateforhumanity.org` | LMS (optional) | ✅ Correct |

### Files with Production URLs

| File | Type | Status |
|------|------|--------|
| `content/site.ts` | Static content | ✅ OK |
| `content/cf-site.ts` | Cloudflare config | ✅ OK |
| `config/social-links.ts` | Social media | ✅ OK |
| `config/site-map.ts` | Sitemap base | ✅ OK |

---

## 2. WORK HOST URLS (REVIEW)

These need review for production deployment:

| URL | File | Purpose |
|-----|------|---------|
| `work-1-*.prod-runtime.all-hands.dev` | Docs only | Health checks |
| `work-2-*.prod-runtime.all-hands.dev` | Docs only | Health checks |

### Files with Work URLs

| File | Lines | Action |
|------|-------|--------|
| `FORENSIC-AUDIT-MATRIX.md` | 2 | ✅ Documentation |
| `AUDIT-REPORT.md` | 2 | ✅ Documentation |
| `PRODUCTION-READINESS-CHECKLIST.md` | 4 | ✅ Documentation |
| `PRODUCTION-READINESS.md` | 2 | ✅ Documentation |

**Status:** ✅ OK - These are documentation only, not in production code.

---

## 3. HARDCODED DOMAINS (NEEDS REVIEW)

### 3.1 Northflank Scripts

| File | Lines | Issue |
|------|-------|-------|
| `scripts/northflank/configure-services.ts` | 34-67 | Hardcoded NEXT_PUBLIC_SITE_URL |

**Current:**
```typescript
NEXT_PUBLIC_SITE_URL: 'https://www.elevateforhumanity.org',
NEXT_PUBLIC_ADMIN_URL: 'https://admin.elevateforhumanity.org',
```

**Should be:**
```typescript
NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL,
```

### 3.2 API Routes

| File | Lines | Issue |
|------|-------|-------|
| `app/api/admin/tenants/[id]/clone/route.ts` | 1 | Hardcoded subdomain |

**Current:**
```typescript
dashboardUrl: `https://${subdomain}.app.elevateforhumanity.org/admin`,
```

**Recommendation:** Make domain configurable via environment variable.

### 3.3 Admin Pages

| File | Lines | Issue |
|------|-------|-------|
| `apps/admin/app/admin/tenants/[id]/page.tsx` | 1 | Hardcoded URL |

---

## 4. ENVIRONMENT VARIABLES

### Required Variables

```bash
# Production
NEXT_PUBLIC_SITE_URL=https://www.elevateforhumanity.org
NEXT_PUBLIC_ADMIN_URL=https://admin.elevateforhumanity.org
NEXT_PUBLIC_LMS_URL=https://www.elevateforhumanity.org/lms

# Database
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Optional
NEXT_PUBLIC_CANONICAL_DOMAIN=www.elevateforhumanity.org
```

---

## 5. ACTION ITEMS

### HIGH PRIORITY

- [ ] **Fix:** `scripts/northflank/configure-services.ts` - Use env vars instead of hardcoded URLs
- [ ] **Review:** Tenant subdomain routing - Make domain configurable

### MEDIUM PRIORITY

- [ ] **Document:** All environment variables in .env.example
- [ ] **Test:** Verify redirects work with custom domains

### LOW PRIORITY

- [ ] **Cleanup:** Remove debug URLs from scripts
- [ ] **Audit:** Check email templates for hardcoded URLs

---

## 6. VERIFICATION COMMANDS

```bash
# Check for hardcoded admin URLs
grep -rn "https://admin" --include="*.ts" --include="*.tsx" | grep -v "env\|process.env"

# Check for hardcoded www URLs
grep -rn "https://www.elevate" --include="*.ts" --include="*.tsx" | grep -v "env\|content/"

# Check work hosts
grep -rn "work-1\|work-2" --include="*.ts" --include="*.tsx" | grep -v node_modules
```

---

## 7. CUSTOM DOMAIN CONFIGURATION

### Admin Domain: `admin.elevateforhumanity.org`

| Step | Action | Status |
|------|--------|--------|
| 1 | DNS A record → Northflank LB | ⚠️ Pending |
| 2 | SSL certificate | ⚠️ Pending |
| 3 | Northflank routing rule | ✅ Configured |
| 4 | Environment variable | ✅ Set |

### LMS Domain: `www.elevateforhumanity.org`

| Step | Action | Status |
|------|--------|--------|
| 1 | DNS configured | ✅ Active |
| 2 | SSL certificate | ✅ Active |
| 3 | Northflank routing rule | ✅ Configured |
| 4 | Environment variable | ✅ Set |

---

## 8. FILES AUDITED

```
✅ content/site.ts
✅ content/cf-site.ts
✅ config/social-links.ts
✅ config/site-map.ts
✅ config/site-map.auto.ts
⚠️ scripts/northflank/configure-services.ts
⚠️ scripts/northflank/sync-env.ts
⚠️ scripts/northflank/update-build-args.ts
⚠️ scripts/northflank/create-admin-service.ts
⚠️ scripts/northflank/verify-health-checks.ts
⚠️ scripts/northflank/deploy-live.ts
⚠️ app/api/admin/tenants/[id]/clone/route.ts
⚠️ apps/admin/app/admin/tenants/[id]/page.tsx
```

---

## 9. RECOMMENDATIONS

1. **Environment-first:** All URLs should come from env vars
2. **Validation:** Add runtime checks for required URLs
3. **Documentation:** Keep URL list updated in .env.example
4. **Testing:** Test with custom domains before production

---

**Last Updated:** July 13, 2026
**Next Review:** Before production deployment
