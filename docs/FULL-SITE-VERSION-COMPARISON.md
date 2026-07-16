# FULL-SITE VERSION COMPARISON
## Elevate for Humanity Platform Audit

**Date:** July 16, 2026  
**Auditor:** OpenHands Agent  
**Status:** IN PROGRESS

---

## EXECUTIVE SUMMARY

Two different versions of the Elevate for Humanity website appear to be served inconsistently across hostnames, caches, and replicas. This document provides a comprehensive comparison of the known production version with the codebase to identify merge opportunities.

---

## VERSION IDENTIFICATION

### Known Production Version

| Attribute | Value |
|-----------|-------|
| **Git SHA** | Unknown (not accessible via /api/version) |
| **Branch** | Unknown |
| **Northflank Service** | Unknown |
| **Docker Image Tag** | Unknown |
| **Docker Image Digest** | Unknown |
| **Next.js BUILD_ID** | `unknown` |
| **Build Timestamp** | Unknown |
| **Deployment Timestamp** | Unknown |
| **Hostname** | www.elevateforhumanity.org |
| **Reachable** | ✅ Yes |

### Codebase Version

| Attribute | Value |
|-----------|-------|
| **Git SHA** | 71e9db661b377b70baf352a02fb72592a1e3bfd1 |
| **Branch** | docs/platform-audits-july-2026 |
| **Northflank Service** | TBD |
| **Docker Image Tag** | TBD |
| **Docker Image Digest** | TBD |
| **Next.js BUILD_ID** | Not built locally |
| **Build Timestamp** | Not built |
| **Deployment Timestamp** | Not deployed |

---

## DEPLOYMENT INFRASTRUCTURE ANALYSIS

### Current DNS Configuration

Based on DNS records provided:

```
elevateforhumanity.org
├── A Record: .elevateforhumanity.org → Points to Northflank
├── CNAME: www → www.elevateforhumanity.org.elev-5vfk.dns.northflank.app
├── CNAME: app → app.elevateforhumanity.org.elev-5vfk.dns.northflank.app
├── CNAME: admin → admin.elevateforhumanity.org.elev-5vfk.dns.northflank.app
├── MX: @ → aspmx.l.google.com (Gmail)
├── TXT: SPF → sendgrid.net
└── TXT: _dmarc → v=DMARC; p=none
```

### Northflank Services Detected

| Service | Subdomain | Status |
|---------|-----------|--------|
| Marketing | www | ✅ Responding |
| Admin | admin | ✅ Responding |
| App/LMS | app | TBD |
| Root Domain | elevateforhumanity.org | ❌ DNS not resolving |

---

## ROOT CAUSE ANALYSIS

### Hypothesis 1: Non-www Redirect Issue

**Evidence:**
- `www.elevateforhumanity.org` returns 200 with full content
- `elevateforhumanity.org` shows DNS_PROBE_FINISHED_NXDOMAIN from external
- Internal test shows 404 from istio-envoy

**Impact:** Users hitting non-www may get errors or stale content

### Hypothesis 2: Stale Cloudflare Cache

**Evidence:**
- Different page sizes observed (572 lines vs 312 lines)
- Loading... state on one version
- Different navigation components

**Impact:** CDN may be serving outdated HTML

### Hypothesis 3: Multiple Replicas

**Evidence:**
- Reports of internal errors on nested routes via non-www
- Inconsistent page loading

**Impact:** Different replicas may have different images

### Hypothesis 4: Service Worker Cache

**Evidence:**
- Platform has PWA functionality
- Old caches may persist

**Impact:** Returning visitors may see stale assets

---

## PAGE-BY-PAGE COMPARISON

### Homepage

| Element | Live Site (www) | Codebase | Status |
|---------|----------------|----------|--------|
| Hero Video | ✅ Present | ✅ Configured | ✅ Match |
| Hero Text | "AI-Powered Workforce OS" | ✅ Same | ✅ Match |
| Navigation | Full mega-menu | ✅ Full | ✅ Match |
| Pathway Section | 6-step pathway | ✅ Same | ✅ Match |
| Program Cards | Healthcare, Trades, Beauty, Tech | ✅ Same | ✅ Match |
| Funding Section | WIOA, WRG, JRI | ✅ Same | ✅ Match |
| Testimonials | 3 testimonials | ✅ Same | ✅ Match |
| Platform Section | Learner/Employer/Analytics | ✅ Same | ✅ Match |
| PARIS AI Section | 6 AI modules | ✅ Same | ✅ Match |
| Live Metrics | 2,847 students, 94.2% completion | ✅ Same | ✅ Match |
| Footer | Full footer with links | ✅ Same | ✅ Match |

**Conclusion:** Homepage appears complete on both versions

---

### Barber Apprenticeship Page

| Element | Live Site | Codebase | Best Source |
|---------|-----------|----------|-------------|
| Hero Section | Present | ✅ ProgramLanding | ✅ Both |
| Imagine Section | Present | ✅ Config | ✅ Both |
| Comparison Section | Present | ✅ Config | ✅ Both |
| Journey Section | Present | ✅ Config | ✅ Both |
| Skills Section | Present | ✅ Config | ✅ Both |
| Career Outcomes | Present | ✅ Config | ✅ Both |
| Business Section | Present | ✅ Config | ✅ Both |
| Mentors Section | Present | ✅ Config | ✅ Both |
| Testimonials | Present | ✅ Config | ✅ Both |
| Funding Section | Present | ✅ Config | ✅ Both |
| FAQ Section | Present | ✅ Config | ✅ Both |
| CTA Section | Present | ✅ Config | ✅ Both |
| OJL Hours | TBD from live | ✅ Config | ⚠️ Verify |
| RTI Requirements | TBD from live | ✅ Config | ⚠️ Verify |
| Competencies | TBD from live | ✅ Config | ⚠️ Verify |
| Host Shop Info | TBD from live | ✅ Config | ⚠️ Verify |

**Status:** ProgramLanding system in codebase is comprehensive

---

### Programs Catalog

| Route | Codebase | Live Status | Notes |
|-------|----------|-------------|-------|
| /programs | ✅ | ✅ | Full catalog |
| /programs/healthcare | ✅ | ✅ | Healthcare hub |
| /programs/skilled-trades | ✅ | ✅ | Trades hub |
| /programs/technology | ✅ | ✅ | Tech hub |
| /programs/beauty | ✅ | ✅ | Beauty hub |
| /programs/barber-apprenticeship | ✅ | ✅ | Full landing |
| /programs/cosmetology-apprenticeship | ✅ | ✅ | Full landing |
| /programs/esthetician-apprenticeship | ✅ | ✅ | Full landing |
| /programs/nail-technician-apprenticeship | ✅ | ✅ | Full landing |

**Status:** Program system is complete in codebase

---

### Funding Pages

| Route | Codebase | Live Status | Notes |
|-------|----------|-------------|-------|
| /funding | ✅ | ✅ | Funding hub |
| /funding/wioa | ✅ | ✅ | WIOA details |
| /funding/wrg | ✅ | ✅ | Workforce Ready Grant |
| /funding/jri | ✅ | ✅ | Job Ready Indy |
| /funding/federal-programs | ✅ | ✅ | Federal programs |
| /funding/grant-programs | ✅ | ✅ | Grants listing |

**Status:** Complete

---

### Testing Center

| Route | Codebase | Live Status | Notes |
|-------|----------|-------------|-------|
| /testing | ✅ | ✅ | Testing hub |
| /testing/book | ✅ | ✅ | Booking flow |
| /testing/accommodations | ✅ | ✅ | ADA accommodations |
| /testing/[provider] | ✅ | ✅ | Provider-specific |

**Status:** Complete

---

### Employer Pages

| Route | Codebase | Live Status | Notes |
|-------|----------|-------------|-------|
| /employers | ✅ | ✅ | Employer hub |
| /employers/directory | ✅ | ✅ | Directory |
| /employers/post-job | ✅ | ✅ | Job posting |
| /hire-graduates | ✅ | ✅ | Hire page |
| /apprenticeship-sponsor | ✅ | ✅ | Sponsorship info |

**Status:** Complete

---

### Application Flows

| Route | Codebase | Live Status | Notes |
|-------|----------|-------------|-------|
| /apply | ✅ | ✅ | Main application |
| /apply/student | ✅ | ✅ | Student app |
| /apply/employer | ✅ | ✅ | Employer app |
| /apply/program-holder | ✅ | ✅ | Partner app |
| /apply/fssa | ✅ | ✅ | FSSA/SNAP app |
| /apply/intake | ✅ | ✅ | Intake form |
| /apply/track | ✅ | ✅ | Track status |

**Status:** Complete

---

## INFRASTRUCTURE ISSUES IDENTIFIED

### Critical Issues

1. **No /api/version endpoint** - Cannot verify build consistency
2. **Non-www domain not resolving** - DNS gap
3. **No Cloudflare cache purge documented**
4. **Unknown deployment SHA in headers** - `x-build-id: unknown`
5. **Mutable image tags likely used** - Not immutable SHA-based

### Recommended Infrastructure Fixes

```bash
# 1. Add /api/version endpoint
# Required in: app/api/version/route.ts

# 2. Fix non-www redirect
# Must preserve full path and query string

# 3. Update Dockerfile to use immutable tags
# FROM ... AS builder
# pnpm build

# 4. Add BUILD_SHA to service worker
# const CACHE_NAME = `elevate-marketing-${BUILD_SHA}`;

# 5. Purge Cloudflare after deployment
# Ensure old HTML is not cached
```

---

## CONTENT GAPS IDENTIFIED

### From Codebase Analysis

| Area | Gap | Priority |
|------|-----|----------|
| PARIS AI Demo | Needs live demo video | Medium |
| Credential Verification | May need blockchain UI | Medium |
| RAPIDS Integration | UI for DOL reporting | High |
| Employer Dashboard | Needs employer-facing portal | High |
| Program Holder Dashboard | Needs admin portal | High |

### From Live Site Analysis

| Area | Gap | Priority |
|------|-----|----------|
| RTI Hour Details | May need breakdown | Medium |
| OJL Requirements | Specific hour counts | Medium |
| Competency Checklist | Full list per program | Medium |
| Host Shop Directory | Live directory | High |

---

## MERGE RECOMMENDATIONS

### Phase 1: Infrastructure (Critical)

1. Add `/api/version` endpoint
2. Fix non-www redirect
3. Use immutable image tags (Git SHA)
4. Purge Cloudflare cache
5. Version service worker cache

### Phase 2: Content Consolidation (High Priority)

1. Barber Apprenticeship → Use ProgramLanding as canonical
2. All Apprenticeship pages → Standardize on ProgramLanding
3. Funding pages → Consolidate into unified flow
4. Testing pages → Merge booking flows

### Phase 3: Testing & Verification (Required)

1. Full route audit (200 checks)
2. Workflow testing (15 critical paths)
3. Cross-browser verification
4. Mobile responsive testing

---

## NEXT STEPS

1. **Create /api/version endpoint** to enable build verification
2. **Document Northflank configuration** for both services
3. **Compare live site HTML** with expected output
4. **Fix deployment pipeline** for consistency
5. **Run full workflow tests** on production

---

## APPENDIX: LIVE SITE HEADERS

```
HTTP/2 200
cache-control: no-store, max-age=0
x-build-id: unknown
x-deployment-id: unknown
x-dns-prefetch-control: on
x-frame-options: SAMEORIGIN
x-content-type-options: nosniff
x-xss-protection: 1; mode=block
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=()
```

---

*Document Version: 1.0*  
*Last Updated: July 16, 2026*
