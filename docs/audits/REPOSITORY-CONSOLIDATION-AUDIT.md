# Repository Consolidation Audit Report
**Date:** 2026-07-11
**Repository:** Elevate LMS
**Status:** CRITICAL - Action Required

---

## Executive Summary

| Metric | Count | Assessment |
|--------|------:|------------|
| Total TS/TSX files | 7,333 | ⚠️ Extremely large |
| Total page.tsx files | 1,621 | ❌ Needs consolidation |
| Total API routes | 1,543 | ❌ Needs consolidation |
| Duplicate program pages | ~62 | ❌ Can be 1 dynamic route |
| Duplicate team pages | 9 | ❌ Can be 1 dynamic route |
| Duplicate CRM structure | 8 | ❌ Can be 1 dynamic route |
| Duplicate component patterns | 60+ | ❌ Needs consolidation |
| Large lib files (>1000 lines) | 15 | ⚠️ Consider splitting |
| Quarantined pages | 1,460 | 🔒 Already quarantined |

---

## Category 1: DUPLICATE PAGES (Can be consolidated)

### A. Program Pages (62 static → 1 dynamic route)

**Current State:**
```
/app/programs/barber-apprenticeship/page.tsx
/app/programs/cosmetology-apprenticeship/page.tsx
/app/programs/esthetician-apprenticeship/page.tsx
/app/programs/nail-technician-apprenticeship/page.tsx
/app/programs/hvac-technician/page.tsx
/app/programs/medical-assistant/page.tsx
/app/programs/cna/page.tsx
/app/programs/qma/page.tsx
... (14 more)
/app/programs/[program]/page.tsx ← ALREADY EXISTS
```

**Recommended Action:**
```typescript
// Keep only /app/programs/[program]/page.tsx
// Make it fetch program data from database
// Redirect all static routes → /programs/[program]
```

**Impact:** Reduce 14+ page compilations → 1 dynamic route

---

### B. Team Member Pages (9 static → 1 dynamic route)

**Current State:**
```
/app/about/team/team/carl-brown/page.tsx
/app/about/team/team/carlina-wilkes/page.tsx
/app/about/team/team/clystjah-woodley/page.tsx
/app/about/team/team/delores-reynolds/page.tsx
/app/about/team/team/elizabeth-greene/page.tsx
/app/about/team/team/jozanna-george/page.tsx
/app/about/team/team/leslie-wafford/page.tsx
/app/about/team/team/sharon-douglass/page.tsx
/app/about/team/team/[slug]/page.tsx ← ALREADY EXISTS
```

**Recommended Action:**
- Keep `/app/about/team/team/[slug]/page.tsx`
- Redirect all static routes

---

### C. CRM Pages (8 duplicate under /crm/crm/)

**Current State:**
```
/app/admin/crm/page.tsx
/app/admin/crm/contacts/page.tsx
/app/admin/crm/deals/page.tsx
/app/admin/crm/follow-ups/page.tsx
/app/admin/crm/campaigns/page.tsx
/app/admin/crm/appointments/page.tsx
/app/admin/crm/leads/page.tsx
/app/admin/crm/crm/page.tsx ← DUPLICATE
/app/admin/crm/crm/contacts/page.tsx ← DUPLICATE
/app/admin/crm/crm/deals/page.tsx ← DUPLICATE
... (4 more duplicates)
```

**Recommended Action:**
- Remove `/app/admin/crm/crm/` entirely (duplicate of parent)
- Keep `/app/admin/crm/` structure

**Files to DELETE:**
```
app/admin/crm/crm/
```

---

### D. Governance Pages (2 duplicate under /governance/governance/)

**Current State:**
```
/app/admin/governance/page.tsx
/app/admin/governance/security/page.tsx
/app/admin/governance/operational-controls/page.tsx
/app/admin/governance/governance/page.tsx ← DUPLICATE
/app/admin/governance/governance/security/page.tsx ← DUPLICATE
/app/admin/governance/governance/operational-controls/page.tsx ← DUPLICATE
```

**Recommended Action:**
- Remove `/app/admin/governance/governance/` entirely

**Files to DELETE:**
```
app/admin/governance/governance/
```

---

### E. Analytics Pages (Multiple sub-pages)

**Current State:**
```
/app/admin/analytics/page.tsx
/app/admin/analytics/analytics/page.tsx ← DUPLICATE
/app/admin/analytics/learning/page.tsx
/app/admin/analytics/programs/page.tsx
/app/admin/analytics/employers/page.tsx
/app/admin/analytics/engagement/page.tsx
/app/admin/analytics/revenue/page.tsx
```

**Recommended Action:**
- Remove `/app/admin/analytics/analytics/`

---

### F. Audit Logs Pages

**Current State:**
```
/app/admin/audit-logs/page.tsx
/app/admin/audit-logs/audit-logs/page.tsx ← DUPLICATE
```

**Recommended Action:**
- Remove `/app/admin/audit-logs/audit-logs/`

---

### G. Reports Pages

**Current State:**
```
/app/admin/reports/page.tsx
/app/admin/reports/reports/page.tsx ← DUPLICATE
```

**Recommended Action:**
- Remove `/app/admin/reports/reports/`

---

### H. Staff Portal Hours/Reports

**Current State:**
```
/app/admin/staff-portal/hours/page.tsx
/app/admin/staff-portal/reports/page.tsx
```

**These are intentional** - keep separate (staff operations)

---

### I. Apply Flow Chaos (60+ pages → 1 canonical)

**From existing audit:**
| Current Path | Should Route To |
|---|---|
| `/app/apply/quick` | `/apply` |
| `/app/apply/full` | `/apply` |
| `/app/apply/student` | `/apply?type=student` |
| `/app/apply/employer` | `/apply?employer=true` |
| `/app/apply/fssa` | `/apply?program=fssa` |
| `/app/apply/confirmation` | `/apply/success` |

**Action:**
- Consolidate to canonical `/apply`
- Add query parameters for variants

---

## Category 2: DUPLICATE COMPONENTS

### A. Hero Components (20+ variants)

| Component | Location | Status |
|-----------|----------|--------|
| `HeroSection.tsx` | components/sections/ | ✅ Keep |
| `HeroSection.tsx` | components/layout/ | ❌ DELETE |
| `PageHero.tsx` | components/templates/ | ❌ DELETE |
| `PageHero.tsx` | components/layout/ | ❌ DELETE |
| `ProgramHero.tsx` | components/programs/ | ⚠️ Keep if distinct |
| `VideoHeroBanner.tsx` | components/ | ⚠️ Keep if distinct |
| `HeroSlideshow.tsx` | components/ | ⚠️ Keep if distinct |
| `HeroCarousel.tsx` | components/marketing/ | ⚠️ Keep if distinct |
| `HeroPicture.tsx` | components/marketing/ | ❌ DELETE |
| `HeroVideoBg.tsx` | components/marketing/ | ❌ DELETE |
| `HeroVideo.tsx` | components/marketing/ | ❌ DELETE |

**Action:** Audit each hero variant - most should be consolidated

---

### B. Button Components (20+ variants)

| Component | Status |
|-----------|--------|
| `PaymentButton.tsx` | ⚠️ Review |
| `PayNowButton.tsx` | ⚠️ Review |
| `BuyNowButton.tsx` | ⚠️ Review |
| `CallTextButton.tsx` | ⚠️ Review |
| `PrintButton.tsx` | ❌ Likely generic |
| `ReportContentButton.tsx` | ❌ Likely generic |
| `StoreCartButton.tsx` | Keep (store-specific) |
| `AddToCartButton.tsx` | Keep (store-specific) |

**Action:** Consolidate generic buttons to `components/ui/Button.tsx`

---

### C. Card Components (20+ variants)

| Component | Status |
|-----------|--------|
| `ProgramCard.tsx` | ⚠️ Keep (domain-specific) |
| `CourseCard.tsx` | ⚠️ Keep (domain-specific) |
| `JobCard.tsx` | ⚠️ Keep (domain-specific) |
| `EventCard.tsx` | ⚠️ Keep (domain-specific) |
| `DashboardMetricCard.tsx` | ⚠️ Keep (admin-specific) |
| `DashboardProgressCard.tsx` | ⚠️ Keep (admin-specific) |
| `ProgramMediaCard.tsx` | ❌ Merge into ProgramCard |
| `ProgramVideoCards.tsx` | ❌ Merge into ProgramCard |

---

## Category 3: LARGE LIB FILES (Memory Concerns)

### A. Files > 1000 Lines

| File | Lines | Recommendation |
|------|------:|---------------|
| `lib/courses/hvac-quizzes.ts` | 8,474 | Split by module |
| `lib/courses/hvac-lesson-quizzes.ts` | 5,294 | Split by module |
| `lib/courses/hvac-quiz-banks.ts` | 2,311 | Split by module |
| `lib/courses/hvac-lesson-content.ts` | 2,082 | Split by module |
| `lib/courses/definitions.ts` | 1,979 | Split by program |
| `lib/admin/get-admin-dashboard-data.ts` | 1,090 | Lazy load sections |
| `lib/curriculum/blueprints/peer-recovery-specialist.ts` | 1,099 | Split by module |
| `lib/curriculum/blueprints/hvac-epa-608.ts` | 1,096 | Split by module |

**Action:** These are loaded at build time - use dynamic imports

---

### B. Large JSON Data Files

| File | Size | Recommendation |
|------|-----:|----------------|
| `scripts/generated/barber-course.generated.json` | 1.4 MB | Keep (generated) |
| `public/data/hvac-quizzes.json` | 1.3 MB | Lazy load |
| `public/data/hero-banners.json` | 192 KB | Lazy load |
| `public/data/barber-apprenticeship-blueprint.json` | 234 KB | Lazy load |
| `public/data/hvac-lesson-quizzes.json` | 196 KB | Lazy load |

---

## Category 4: DUPLICATE API ROUTES

### A. Programs API (Can use [slug])

**Current:**
```
/api/programs/barber-apprenticeship/apply
/api/programs/barber-apprenticeship/confirm
/api/programs/cosmetology-apprenticeship/apply
/api/programs/cosmetology-apprenticeship/confirm
... (10 more programs)
/api/programs/[program]/apply ← ALREADY EXISTS
/api/programs/[program]/confirm ← ALREADY EXISTS
```

**Action:** Redirect static routes to dynamic

---

### B. Intakes API (8 endpoints - archive most)

| Endpoint | Action |
|----------|--------|
| `/api/intake/interest` | Archive |
| `/api/intake/eligibility` | Archive |
| `/api/intake/route.ts` | Archive |
| `/api/intake/leads` | Archive |
| `/api/intake/status` | Archive |
| `/api/intake/workflow` | Archive |

---

### C. Apply API (11 endpoints → 1)

| Endpoint | Action |
|----------|--------|
| `/api/applications` | ✅ Keep (canonical) |
| `/api/apply` | Archive |
| `/api/apply/student` | Archive |
| `/api/enroll/apply` | Archive |

---

## Category 5: PRESERVE (Intentionally Separate)

### A. Admin-Only Systems
```
/apps/admin/app/api/admin/*
```
**Reason:** Staff operations, bulk actions, approvals

### B. Payment Systems
```
/api/barber/checkout/*
/api/affirm/checkout
/api/sezzle/checkout
/api/stripe/webhook
```
**Reason:** Provider-specific payment flows

### C. Provider/Partner Systems
```
/app/partners/*
/api/partner/*
/api/provider/*
```
**Reason:** Partner onboarding, not student apply

### D. Apprenticeship Systems
```
/api/programs/barber-apprenticeship/*
/api/programs/cosmetology-apprenticeship/*
```
**Reason:** OJT-specific with payment + training

---

## Category 6: LEGACY/DEAD CODE (Archive)

| Path | Status |
|------|--------|
| `/api/schools/mesmerized-by-beauty/*` | Archive if unused |
| `/api/shop/apply` | Archive if unused |
| `/api/suboffice/apply` | Archive if unused |
| `/api/cash-advances/*` | Archive if unused |
| `/api/ocr/extract` | Archive if unused |

---

## Category 7: DUPLICATE APPS STRUCTURE

### apps/admin vs app/admin

**Problem:** Both `apps/admin/` AND `app/admin/` exist with 382 pages in apps/admin

```
./apps/admin/app/admin/ (382 pages)
./app/admin/ (600+ pages)
```

**Action Required:**
- Determine which is canonical
- Migrate and archive duplicate
- Check if both are used in production

---

## Recommended Actions

### Phase 1: Quick Wins (Low Risk, High Impact)
1. ❌ Delete `app/admin/crm/crm/` (8 duplicate pages)
2. ❌ Delete `app/admin/governance/governance/` (2 duplicate pages)
3. ❌ Delete `app/admin/analytics/analytics/` (1 duplicate page)
4. ❌ Delete `app/admin/audit-logs/audit-logs/` (1 duplicate page)
5. ❌ Delete `app/admin/reports/reports/` (1 duplicate page)

### Phase 2: Route Consolidation (Medium Risk)
1. Redirect static team pages → `/about/team/team/[slug]`
2. Redirect static program pages → `/programs/[program]`
3. Consolidate apply routes to canonical `/apply`

### Phase 3: Component Consolidation (Medium Risk)
1. Audit Hero components (20+ → ~5)
2. Audit Button components (20+ → ~10)
3. Audit Card components (20+ → ~10)

### Phase 4: API Consolidation (Medium Risk)
1. Archive intake endpoints (8 → 0 or 1)
2. Archive legacy apply endpoints (11 → 1)
3. Redirect static program APIs to dynamic

### Phase 5: Large File Optimization (High Effort)
1. Split `lib/courses/hvac-*.ts` files by module
2. Add dynamic imports for large JSON files
3. Implement lazy loading for admin dashboard sections

### Phase 6: Apps Structure Resolution (High Risk)
1. Audit `apps/admin/` vs `app/admin/`
2. Determine canonical location
3. Migrate and archive duplicate

---

## Files to DELETE Immediately

```bash
# Duplicate CRM structure
rm -rf app/admin/crm/crm/

# Duplicate Governance structure  
rm -rf app/admin/governance/governance/

# Duplicate Analytics structure
rm -rf app/admin/analytics/analytics/

# Duplicate Audit Logs structure
rm -rf app/admin/audit-logs/audit-logs/

# Duplicate Reports structure
rm -rf app/admin/reports/reports/
```

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| page.tsx count | 1,621 | < 400 |
| API route count | 1,543 | < 300 |
| Hero variants | 20+ | < 5 |
| Button variants | 20+ | < 10 |
| Card variants | 20+ | < 10 |
| Duplicate structures | 5+ | 0 |

---

## Audit Completed By
**OpenHands Agent**
**Date:** 2026-07-11

---

## Related Documents
- `docs/audits/root-archive-2026-05-14/AUDIT_DUPLICATES_CATEGORIZED.md`
- `docs/audits/root-archive-2026-05-14/quarantine-routes.json`
- `docs/audits/root-archive-2026-05-14/stub-audit-report.json`
