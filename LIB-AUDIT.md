# Lib Directory URL Audit

**Date:** July 14, 2026
**Status:** AUDIT COMPLETE

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Internal URLs (should use env) | 9 | ⚠️ FIX |
| External URLs (OK) | 25 | ✅ OK |
| Standards/Protocols | 15 | ✅ OK |

---

## Files With Internal URLs (Need Fixing)

### 1. Logo URLs (3 files)

| File | Line | Current |
|------|------|---------|
| `lib/structured-data.ts` | 12 | `https://www.elevateforhumanity.org/logo.png` |
| `lib/seo/structured-data.ts` | 10 | `https://www.elevateforhumanity.org/images/logo.png` |
| `lib/email-templates/index.ts` | 11 | `https://www.elevateforhumanity.org/images/logo.png` |
| `lib/documents/elevate-document-system.ts` | 24 | `https://www.elevateforhumanity.org/images/logo.png` |

**Fix:** Use `url('/images/logo.png')` or `assets.logo`

### 2. Canonical URLs (2 files)

| File | Line | Current |
|------|------|---------|
| `lib/seo/structured-data.ts` | 39 | `https://www.elevateforhumanity.org/search?q=...` |
| `lib/programs/program-page.tsx` | 11 | `https://www.elevateforhumanity.org/programs/${slug}` |
| `lib/store/beauty-dashboard-clone.ts` | 138 | `https://www.elevateforhumanity.org/store/beauty-programs` |

**Fix:** Use `url('/search')` or `canonicalUrl()`

### 3. DevStudio Configs (2 files)

| File | Line | Current |
|------|------|---------|
| `lib/devstudio/preview-config.ts` | 50 | `https://www.elevateforhumanity.org` (hardcoded fallback) |
| `lib/devstudio/devint-container.ts` | 25 | `admin: 'https://admin.elevateforhumanity.org'` |

**Fix:** Use `url()` and `adminUrl()` from url-factory

### 4. Admin Default (1 file)

| File | Line | Current |
|------|------|---------|
| `lib/admin/publish-website.ts` | 45 | `'https://www.elevateforhumanity.org'` (default fallback) |

**Fix:** Use `SITE_URL` env var

### 5. Email Template (1 file)

| File | Line | Current |
|------|------|---------|
| `lib/email/send-conference-submission.ts` | 392 | `https://www.elevateforhumanity.org` |

**Fix:** Use `url()` or hardcode (emails always need production URL)

---

## External URLs (OK - Don't Change)

### Schema/Standards
| URL | File | Why OK |
|-----|------|--------|
| `https://schema.org` | structured-data.ts | JSON-LD standard |
| `http://adlnet.gov/expapi/*` | xapi/*.ts | xAPI specification |

### Social Media
| URL | File | Why OK |
|-----|------|--------|
| `https://facebook.com/*` | structured-data.ts | Official pages |
| `https://linkedin.com/*` | structured-data.ts | Official pages |

### External APIs (OK)
| URL | File | Why OK |
|-----|------|--------|
| `https://api.stripe.com` | admin/get-site-health.ts | Stripe API |
| `https://api.sendgrid.com` | admin/get-site-health.ts | SendGrid API |
| `https://api.credly.com` | credentials/credly.ts | Credly API |

### External Verification (OK)
| URL | File | Why OK |
|-----|------|--------|
| `https://www.in.gov/pla/barber-board` | credentials/credential-system.ts | State verification |
| `https://www.certmetrics.com/*` | credentials/verification.ts | CompTIA verification |

---

## Already Using URL Factory (Good)

| File | Status |
|------|--------|
| `lib/utils/url-factory.ts` | ✅ Source of truth |
| `lib/utils/siteUrl.ts` | ✅ Uses env vars |
| `lib/utils/site-urls.ts` | ✅ Uses env vars |

---

## Action Items

### HIGH PRIORITY
- [ ] `lib/structured-data.ts` - Use `assets.logo`
- [ ] `lib/seo/structured-data.ts` - Use `assets.logo` + `url()`
- [ ] `lib/email-templates/index.ts` - Use `assets.logo`
- [ ] `lib/documents/elevate-document-system.ts` - Use `assets.logo`

### MEDIUM PRIORITY
- [ ] `lib/programs/program-page.tsx` - Use `canonicalUrl()`
- [ ] `lib/store/beauty-dashboard-clone.ts` - Use `url()`
- [ ] `lib/devstudio/preview-config.ts` - Fix fallback
- [ ] `lib/devstudio/devint-container.ts` - Use `adminUrl()`

### LOW PRIORITY
- [ ] `lib/admin/publish-website.ts` - Use `SITE_URL` env var
- [ ] `lib/email/send-conference-submission.ts` - Email, OK hardcoded

---

## Verification

```bash
# Check for hardcoded elevate URLs in lib
grep -rn "https://www.elevate\|https://admin.elevate" lib/ --include="*.ts" --include="*.tsx" | grep -v "process.env\|url(\|adminUrl(\|assets\."

# Check for localhost fallbacks (should be env vars)
grep -rn "localhost" lib/ --include="*.ts" --include="*.tsx"
```
