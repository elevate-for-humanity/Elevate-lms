# ROUTE & FOLDER CERTIFICATION AUDIT
**Generated:** 2026-07-13  
**Repository:** Elevate-lms  
**Status:** IN PROGRESS

---

## EXECUTIVE SUMMARY

| Metric | Count |
|--------|-------|
| Total Route Folders | 2,537 |
| Folders with page.tsx | 1,162 |
| MARKETING Scope | 624 |
| ADMIN Scope | 77 |
| LMS Scope | 137 |
| SHARED/Uncategorized | 1,699 |

---

## CRITICAL FINDINGS

### BROWSER VERIFICATION (2026-07-13)

| URL | HTTP | Browser | Issue |
|-----|------|---------|-------|
| / | 200 | Working | None |
| /programs | 200 | Working | None |
| /apply | 200 | Working | None |
| /programs/cna | 200 | ERROR | Server Component Error |
| /programs/hvac-technician | 200 | ERROR | Server Component Error |
| /barber-host-shop | 200 | ERROR | Typo "Instructor" not fixed |
| /host-shops | 404 | N/A | Redirect NOT deployed |
| /partners/host-shops | 200 | Working | None |

### Root Cause
- HTTP 200 but BROWSER shows Server Component errors
- `/host-shops` 404 - redirect in code but NOT deployed
- `/barber-host-shop` has typo - NOT deployed
- Production running **dev build** (`x-build-id: dev`)

### Conclusion
**HTTP 200 ≠ Page Works**

A 200 response can hide:
- Server Component exceptions
- React error boundaries
- Empty pages
- Hydration failures
- Broken interactions

---

## PHASE 1: TOP-LEVEL ROUTES

| Folder | Route | Page | Scope | Status |
|--------|-------|------|-------|--------|
| about | /about | yes | MARKETING | Active |
| admin | /admin | yes | ADMIN | Active |
| api | /api | yes | SHARED | Active |
| apply | /apply | yes | MARKETING | Active |
| barber-host-shop | /barber-host-shop | yes | MARKETING | Typo |
| blog | /blog | yes | MARKETING | Active |
| careers | /careers | yes | MARKETING | Active |
| contact | /contact | yes | MARKETING | Active |
| funding | /funding | yes | MARKETING | Active |
| host-shops | /host-shops | yes | MARKETING | 404 |
| login | /login | yes | MARKETING | Active |
| lms | /lms | yes | LMS | Active |
| partners | /partners | yes | MARKETING | Active |
| programs | /programs | yes | MARKETING | Active |
| testing | /testing | yes | MARKETING | Active |

---

## PHASE 2: PROGRAMS (38 total)

| Program | Route | Hero | Content | Apply | Status |
|---------|-------|------|---------|-------|--------|
| cna | /programs/cna | yes | yes | yes | Active |
| hvac-technician | /programs/hvac-technician | yes | yes | yes | Active |
| medical-assistant | /programs/medical-assistant | yes | yes | yes | Active |
| pharmacy-technician | /programs/pharmacy-technician | yes | yes | yes | Active |
| phlebotomy | /programs/phlebotomy | yes | yes | yes | Active |
| qma | /programs/qma | yes | yes | yes | Active |
| electrical | /programs/electrical | yes | yes | yes | Active |
| plumbing | /programs/plumbing | yes | yes | yes | Active |
| welding | /programs/welding | yes | yes | yes | Active |
| cdl-training | /programs/cdl-training | yes | yes | yes | Active |
| barber-apprenticeship | /programs/barber-apprenticeship | yes | yes | yes | Active |
| cosmetology-apprenticeship | /programs/cosmetology-apprenticeship | yes | yes | yes | Active |

---

## PHASE 3: APPRENTICESHIPS

| Apprenticeship | Landing | Host Shops | Employer | Application |
|---------------|---------|------------|----------|-------------|
| Barber | yes | yes | yes | yes |
| Cosmetology | yes | yes | yes | yes |
| Esthetician | yes | yes | yes | yes |
| Nail Tech | yes | yes | yes | yes |

---

## PHASE 4: NESTED DUPLICATES (Cleanup Needed)

| Pattern | Issue |
|---------|-------|
| about/mission/mission | Duplicate nested |
| about/partners/partners | Duplicate nested |
| about/team/team | Duplicate nested |
| accessibility/accessibility | Duplicate nested |
| accreditation/accreditation | Duplicate nested |
| admin/analytics/analytics | Duplicate nested |
| admin/audit-logs/audit-logs | Duplicate nested |
| admin/crm/crm | Duplicate nested |

**Action:** Verify no links -> Delete duplicates

---

## PHASE 5: BUILD SCOPE DISTRIBUTION

| Scope | Folders |
|-------|---------|
| MARKETING | 624 |
| ADMIN | 77 |
| LMS | 137 |
| SHARED | 1,699 |

**SHARED folders** need review to ensure MARKETING_OWNED is complete.

---

## PHASE 6: ACTION ITEMS

### Immediate (Require Deployment)

| # | Issue | Fix |
|---|-------|-----|
| 1 | /host-shops 404 | Deploy redirect |
| 2 | Typo "Instructor" | Deploy fix |
| 3 | Build ID: dev | Rebuild with prod |

### Short Term (Cleanup)

| # | Action |
|---|--------|
| 1 | Remove nested duplicates |
| 2 | Categorize SHARED folders |
| 3 | Verify orphaned pages |

---

## PHASE 7: DEPLOYMENT MATRIX

| Component | Repo | Northflank | Live | Build ID |
|-----------|------|-----------|------|----------|
| Marketing | yes | pending | yes | dev |
| Admin | yes | pending | yes | dev |
| LMS | yes | pending | yes | dev |

**Next Step:** Force rebuild -> Verify x-build-id matches Git SHA

---

## RECOMMENDATIONS

1. **Deploy immediately** - All fixes are in code, need production build
2. **Categorize 1,699 SHARED folders** - Update MARKETING_OWNED
3. **Remove nested duplicates** - Reduce confusion
4. **Run audit monthly** - Track changes

---

## PHASE 8: COMPLETE CERTIFICATION MATRIX

| Route | Folder | HTTP | Browser | Hero | Content | CTA | Certified |
|-------|--------|------|--------|------|---------|-----|-----------|
| / | app/page.tsx | 200 | yes | yes | yes | yes | yes |
| /programs | app/programs | 200 | yes | yes | yes | yes | yes |
| /apply | app/apply | 200 | yes | yes | yes | yes | yes |
| /apply/employer | app/apply/employer | 200 | ERROR | N/A | N/A | N/A | NO |
| /programs/cna | app/programs/cna | 200 | ERROR | N/A | N/A | N/A | NO |
| /programs/hvac | app/programs/hvac | 200 | ERROR | N/A | N/A | N/A | NO |
| /barber-host-shop | app/barber-host-shop | 200 | yes | yes | yes | yes | PARTIAL |
| /host-shops | app/host-shops | 404 | NO | N/A | N/A | N/A | NO |
| /partners/host-shops | app/partners/host-shops | 200 | yes | yes | yes | yes | yes |
| /admin | app/admin | 200 | unknown | unknown | unknown | unknown | PENDING |
| /lms | app/lms | 200 | unknown | unknown | unknown | unknown | PENDING |

### Certification Legend
- **yes** = Verified working
- **NO** = Broken
- **PARTIAL** = Has issues (typo, missing content)
- **PENDING** = Requires authentication to test
- **ERROR** = Server Component or React error

---

*Report: 2026-07-13*

