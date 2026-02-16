# Elevate LMS — Security & Compliance Audit Report

**Date:** 2026-02-16
**Commit:** af4c7f0446cecc37364eb212b75632b8fb022589
**Node:** v20.20.0 | **pnpm:** 10.28.2
**Build:** 2,434 route entries, zero errors
**Auditor:** Automated evidence-based audit

---

## Executive Summary

| Severity | Count |
|----------|-------|
| HIGH     | 8     |
| MEDIUM   | 7     |
| LOW      | 3     |

The application has strong foundations (SSN hashing, security headers, rate limiting framework) but has critical gaps that would fail a government security audit: **no Next.js middleware**, **unprotected admin API routes**, **missing audit logging on PII endpoints**, and **client-side-only session controls**.

---

## A) Build Baseline

| Item | Value |
|------|-------|
| Node.js | v20.20.0 |
| pnpm | 10.28.2 |
| Git HEAD | af4c7f0446cecc37364eb212b75632b8fb022589 |
| Git status | Clean (0 uncommitted changes) |
| Build result | Success — 2,434 route entries, 0 errors |
| Build warnings | SSN_SALT not set, Supabase env vars missing (expected in build env), Sezzle not configured |

Evidence: `audit_artifacts/build.log`, `audit_artifacts/baseline.log`

---

## B) Route Protection

### CORRECTION

Initial analysis incorrectly identified `proxy.ts` as dead code. In Next.js 16, `proxy.ts` replaces `middleware.ts` as the request interception file. The build output `ƒ Proxy (Middleware)` confirms it is active.

**However**, `proxy.ts` explicitly skips all API routes:
```
if (pathname.startsWith('/api/')) { return NextResponse.next(); }
```
This means **API routes have zero proxy-level auth protection** and must each implement their own auth checks. The 2 unprotected admin API routes (H2, H3) are real vulnerabilities.

### Findings

| Area | Mechanism | Server-side? | File |
|------|-----------|-------------|------|
| No root middleware.ts | — | N/A | — |
| Admin pages | `requireAdmin()` in layout | Yes | `app/admin/layout.tsx:78` |
| LMS pages | `useEffect` + `getUser()` | **No (client-side)** | `app/lms/(app)/layout.tsx:28` |
| Instructor pages | `auth.getUser()` + role check | Yes | `app/instructor/layout.tsx:40-57` |
| Staff portal | No layout.tsx found | **None** | — |
| API routes | Mixed — see below | Varies | — |

### API Route Auth Coverage

| Category | Count |
|----------|-------|
| Total API routes | 917 |
| Routes with auth references (broad grep) | ~718 |
| Routes with zero auth of any kind | ~198 |
| **Admin API routes with zero auth** | **2 confirmed critical** |

**Critical unprotected admin routes:**

1. **`app/api/admin/applications/[id]/approve/route.ts`** — Uses `supabaseAdmin` (service role key) with **zero auth check**. Anyone can call this endpoint to approve applications, create user accounts, and enroll students.

2. **`app/api/admin/send-reminder/route.ts`** — Uses `createAdminClient()` with **zero auth check**. Anyone can trigger SMS reminders to applicants via Twilio.

Evidence: `audit_artifacts/route-protection-summary.log`, `audit_artifacts/truly-unprotected-admin-routes.log`

---

## C) Security Headers

Source: `next.config.mjs` lines 483-700, applied via `headers()` function.

| Header | Value | Assessment |
|--------|-------|------------|
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` | GOOD |
| X-Frame-Options | `SAMEORIGIN` | OK |
| X-Content-Type-Options | `nosniff` | GOOD |
| X-XSS-Protection | `1; mode=block` | OK (deprecated) |
| Referrer-Policy | `origin-when-cross-origin` | OK |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` | GOOD |
| Content-Security-Policy | See below | ISSUES |

### CSP Analysis

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://connect.facebook.net https://js.stripe.com https://www.googletagmanager.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com ...;
frame-ancestors 'none';
upgrade-insecure-requests;
```

- `'unsafe-inline'` in `script-src` (production) — gov scanners flag this
- `'unsafe-inline'` in `style-src` — common but flagged by strict scanners
- No `report-uri` or `report-to` directive — cannot monitor CSP violations
- `frame-ancestors 'none'` — GOOD (prevents clickjacking)
- No wildcard `*` in `img-src` — GOOD

Evidence: `audit_artifacts/security-headers-analysis.log`

---

## D) CORS

| Layer | Configuration | Risk |
|-------|--------------|------|
| Next.js API routes (`app/api/`) | No CORS headers set (restrictive by default) | LOW — GOOD |
| Supabase Edge Functions | 14 functions use `Access-Control-Allow-Origin: *` | MEDIUM |
| Netlify `file-return.ts` | `Access-Control-Allow-Origin: *` (tax filing) | HIGH |
| Netlify `refund-tracking.ts` | `Access-Control-Allow-Origin: *` | MEDIUM |
| `server/index.ts` line 20 | `Access-Control-Allow-Origin: *` | HIGH if used in production |
| `proxy.ts` CORS logic | Dead code — never executed | N/A |

Evidence: `audit_artifacts/cors-analysis.log`

---

## E) Rate Limiting

**Implementation:** Upstash Redis sliding window (`lib/rate-limit.ts`) with in-memory fallback (`lib/api/rate-limiter.ts`).

| Metric | Value |
|--------|-------|
| Routes with rate limiting | 852 / 917 (93%) |
| Routes without rate limiting | 65 (7%) |

**Critical issue:** `skipOnMissing` defaults to `true` in `withRateLimit`. If Upstash Redis is unavailable, **all rate limiting is silently skipped** across all 852 routes.

**Notable unprotected routes:**
- `app/api/auth/signup/route.ts` — account creation abuse vector
- `app/api/documents/upload/route.ts` — storage DoS vector
- `app/api/admin/backup/route.ts` — backup endpoint
- 17 cron routes — acceptable (should use cron secret)
- 10 webhook routes — acceptable (signature verification)

Evidence: `audit_artifacts/no-rate-limit-routes.log`

---

## F) SSN / PII Handling (FERPA/WIOA)

### SSN Security

| Check | Status |
|-------|--------|
| SSN hashed with SHA-256 + salt | GOOD (`lib/security/ssn.ts`) |
| No hardcoded fallback salt | GOOD |
| Fails safely if SSN_SALT missing | GOOD (throws Error) |
| SSN encrypted for tax filing (AES-256-CBC) | GOOD (`lib/security/ssn-helper.ts`) |
| SSN values logged anywhere | NONE FOUND — GOOD |

### FERPA Audit Logging

| Metric | Value |
|--------|-------|
| SSN-handling API routes | 17 |
| SSN routes WITH audit logging | **1** (6%) |
| SSN routes WITHOUT audit logging | **16** (94%) |
| Total API routes with audit logging | 58 / 917 (6.3%) |

**Unaudited SSN routes:**
- `app/api/identity/verify-ssn/route.ts`
- `app/api/hr/payroll/route.ts`
- `app/api/supersonic-fast-cash/file-return/route.ts`
- `app/api/supersonic-fast-cash/clients/route.ts`
- `app/api/tax/file-return/route.ts`
- `app/api/tax/calculate/route.ts`
- `app/api/tax/validate/route.ts`
- `app/api/reports/wioa/route.ts`
- `app/api/reports/rapids/export/route.ts`
- And 7 more (see `audit_artifacts/ssn-pii-analysis.log`)

### PII at Rest

- SSN: Hashed or encrypted — GOOD
- DOB, address, email, phone: Stored in plaintext in Supabase
- Supabase provides disk encryption, but no column-level encryption for PII fields

Evidence: `audit_artifacts/ssn-pii-analysis.log`

---

## G) Error Boundaries

| Metric | Value |
|--------|-------|
| `error.tsx` files | 75 |
| `not-found.tsx` files | 1 (root only) |
| Route groups missing `error.tsx` | ~190 |
| API routes exposing `error.message` | 92 |

Root `error.tsx` catches unhandled errors globally. All major protected areas (admin, LMS, instructor, staff-portal) have `error.tsx`.

**92 API routes leak internal error messages** (DB errors, stack traces) to clients via `error.message` in JSON responses.

Evidence: `audit_artifacts/error-boundaries-analysis.log`

---

## H) Accessibility (WCAG 2.1 AA)

| Check | Count/Status |
|-------|-------------|
| Skip-to-content link | Root layout + PublicLayout — GOOD |
| Admin layout skip-nav | MISSING |
| LMS layout skip-nav | MISSING |
| `aria-label` usage | 523 instances |
| `role` attributes | 116 instances |
| `htmlFor` (label association) | 286 instances |
| `tabIndex` usage | 5 instances |
| Focus styles | 1,417 instances — GOOD |
| Inputs without explicit label | ~1,455 (needs manual review) |
| Automated a11y testing | NONE configured |

Evidence: `audit_artifacts/accessibility-analysis.log`

---

## I) Authentication / Session Policy

| Check | Status |
|-------|--------|
| Auth provider | Supabase Auth (JWT) |
| Token expiry | Default 1hr access / 7d refresh |
| Idle timeout implementation | 30 min, client-side (`lib/auth/idle-timeout.ts`) |
| Idle timeout in LMS | YES |
| Idle timeout in Admin | **NO** |
| Idle timeout in Instructor | **NO** |
| Idle timeout in Staff portal | **NO** |
| Server-side idle enforcement | **NONE** |
| Password min length | 8 chars (NIST 800-63B) |
| Common password blocklist | 25 entries (small) |
| Server-side password validation | Length only — no common password check |
| Breached password check (HIBP) | **NONE** |
| Demo mode | Disabled (`isDemoMode()` returns false) — GOOD |

Evidence: `audit_artifacts/auth-session-analysis.log`

---

## J) Severity-Rated Gap List

### HIGH (8)

| # | Gap | Why It Fails Gov Audit | Fix Location | Remediation |
|---|-----|----------------------|--------------|-------------|
| H1 | **Proxy skips all API routes** | `proxy.ts` (Next.js 16 middleware) explicitly skips `/api/*` routes. All 917 API routes must self-enforce auth. Any route that forgets is publicly accessible. | `proxy.ts` line ~210 | Add API route auth checks in proxy, or ensure all API routes use `requireApiAuth()`. |
| H2 | **Admin API route unauthenticated: approve** | `app/api/admin/applications/[id]/approve/route.ts` uses service role with zero auth. Anyone can create users and enroll students. | Line 12 | Add `requireApiAuth()` + admin role check before processing. |
| H3 | **Admin API route unauthenticated: send-reminder** | `app/api/admin/send-reminder/route.ts` uses admin client with zero auth. Anyone can trigger SMS via Twilio. | Line 51 | Add `requireApiAuth()` + admin role check. |
| H4 | **16/17 SSN routes lack audit logging** | FERPA requires access logging for PII. Tax filing, SSN verification, payroll, WIOA reports have no audit trail. | Each route (see Section F) | Add `auditLog()` calls to all SSN-handling routes. |
| H5 | **Idle timeout only in LMS** | Admin, instructor, staff portals have no idle timeout. NIST 800-63B requires session timeout for all authenticated areas. | `app/admin/layout.tsx`, `app/instructor/layout.tsx` | Add `<IdleTimeoutGuard />` to all authenticated layouts. |
| H6 | **Client-side only idle timeout** | JavaScript-based timeout can be bypassed. No server-side session expiry enforcement. | `lib/auth/idle-timeout.ts` | Implement server-side session validation with timestamp check in middleware. |
| H7 | **Rate limiting silently disabled** | `skipOnMissing=true` means if Redis is down, all 852 rate-limited routes become unlimited. DoS vector. | `lib/api/with-rate-limit.ts:38` | Change default to `skipOnMissing=false` for auth/payment routes, or add in-memory fallback. |
| H8 | **LMS auth is client-side only** | `app/lms/(app)/layout.tsx` uses `useEffect` + `getUser()`. Server-rendered content is accessible before JS executes. | `app/lms/(app)/layout.tsx` | Convert to server component with `requireAuth()` or add middleware protection. |

### MEDIUM (7)

| # | Gap | Why It Fails Gov Audit | Fix Location | Remediation |
|---|-----|----------------------|--------------|-------------|
| M1 | **CSP uses `unsafe-inline` in production** | Gov scanners (e.g., OWASP ZAP, Qualys) flag `unsafe-inline` in script-src. Enables XSS if injection found. | `next.config.mjs:533` | Implement nonce-based CSP with Next.js `nonce` prop. |
| M2 | **92 API routes leak error.message** | Internal error details (DB errors, stack traces) exposed to clients. CWE-209 information disclosure. | 92 files (see Section G) | Replace `error.message` with generic error strings in catch blocks. |
| M3 | **Netlify file-return.ts has wildcard CORS** | Tax filing endpoint accessible from any origin. | `netlify/functions/file-return.ts:15` | Restrict to `elevateforhumanity.org` origins. |
| M4 | **Password validation not enforced server-side** | `app/api/auth/signup/route.ts` only checks length >= 8. No common password check server-side. | `app/api/auth/signup/route.ts:23` | Call `validatePassword()` from `lib/auth/password-validation.ts`. |
| M5 | **PII stored without column-level encryption** | DOB, address, phone in plaintext. Disk encryption alone may not satisfy FERPA auditors. | Supabase schema | Evaluate pgcrypto column-level encryption for PII fields. |
| M6 | **Only 6.3% of API routes have audit logging** | WIOA/FERPA compliance requires access logging. 859/917 routes have no audit trail. | All API routes | Implement audit logging middleware or add to high-risk routes. |
| M7 | **No CSP violation reporting** | Cannot detect or monitor CSP bypass attempts. | `next.config.mjs` CSP header | Add `report-uri` or `report-to` directive. |

### LOW (3)

| # | Gap | Why It Fails Gov Audit | Fix Location | Remediation |
|---|-----|----------------------|--------------|-------------|
| L1 | **Admin/LMS layouts missing skip-nav** | WCAG 2.1 AA requires skip navigation for keyboard users. | `app/admin/layout.tsx`, `app/lms/(app)/layout.tsx` | Add `<SkipToContent />` component. |
| L2 | **No automated a11y testing** | Cannot prove WCAG compliance without automated evidence. | CI pipeline | Add axe-core/Playwright a11y tests. |
| L3 | **~190 route groups lack error.tsx** | Errors fall to root boundary with generic message. Not a security issue but poor UX. | Various `app/*/` directories | Add error.tsx to high-traffic route groups. |

---

## Artifacts

All evidence files are in `audit_artifacts/`:

| File | Contents |
|------|----------|
| `baseline.log` | Node/pnpm versions, git state |
| `build.log` | Full build output |
| `route-protection-summary.log` | Route protection analysis |
| `route-protection.log` | Unprotected route counts |
| `truly-unprotected-admin-routes.log` | Admin routes with zero auth |
| `unprotected-non-admin-routes.log` | Non-admin routes without auth |
| `security-headers-analysis.log` | Header-by-header analysis |
| `security-headers-search.log` | Raw grep output |
| `cors-analysis.log` | CORS configuration analysis |
| `cors-search.log` | Raw CORS grep output |
| `no-rate-limit-routes.log` | Routes without rate limiting |
| `ssn-pii-analysis.log` | SSN/PII handling analysis |
| `ssn-search.log` | Raw SSN grep output |
| `error-boundaries-analysis.log` | Error boundary coverage |
| `accessibility-analysis.log` | WCAG evidence |
| `auth-session-analysis.log` | Auth/session policy analysis |

---

Audit complete.
