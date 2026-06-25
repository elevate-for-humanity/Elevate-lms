# Production Memory Audit - Elevate LMS

**Date:** June 23, 2026  
**Status:** In Progress  
**Goal:** 40% memory reduction while preserving functionality

---

## Executive Summary

The production memory issue is **NOT primarily caused by data stored in Supabase**. The root causes are:

1. **1,357 API routes** - Largest contributor to memory pressure
2. **1,057 pages** - Significant build overhead
3. **Large static data files** (18,000+ lines across program data files)
4. **Duplicate code between admin/app apps**
5. **Monolithic imports** pulling entire directories into bundles

---

## 🚨 YES - LMS IS IN THE BUILD

The entire `app/` directory (including `app/lms/`) is compiled during every build because:
- `tsconfig.json` includes: `"app/**/*.ts", "app/**/*.tsx"`
- No route groups to isolate builds
- All 1,057 pages in `app/` are eagerly compiled

---

## Critical Findings

### 1. API Route Count: 1,357 ⚠️ CRITICAL

| Category | Count | % of Total |
|----------|-------|------------|
| admin/* | 950 | 70% |
| devstudio/* | 135 | 10% |
| cron/* | 114 | 8% |
| analytics/* | 54 | 4% |
| staff/* | 30 | 2% |
| reports/* | 15 | 1% |
| course-builder/* | 12 | 1% |
| Other | 47 | 4% |

**Admin Sub-category Breakdown (Top 30):**
| Sub-category | Routes |
|--------------|--------|
| courses | 78 |
| programs | 51 |
| course-builder | 51 |
| applications | 51 |
| program-holders | 24 |
| enrollments | 24 |
| monitoring | 18 |
| grants | 18 |
| contracts | 18 |
| fssa | 15 |
| exam-authorizations | 15 |
| documents | 15 |
| creators | 15 |
| integrations | 12 |
| certifications | 12 |
| wioa | 9 |
| users | 9 |
| settings | 9 |
| sendgrid | 9 |
| next-steps | 9 |
| lms | 9 |
| jobs | 9 |
| external-modules | 9 |
| export | 9 |
| crm | 9 |
| compliance | 9 |
| cohorts | 9 |
| catalog | 9 |
| apprenticeships | 9 |

### 2. Page Count: 1,057 ⚠️ HIGH

| Location | Count |
|----------|-------|
| app/* | 1,057 |
| apps/admin/* | 385 |
| apps/app/* | 5 |
| _archived/* | 534 (not built) |

**Page Breakdown by Category (Top 30):**
| Category | Pages |
|----------|-------|
| admin | 297 |
| store | 60 |
| lms | 57 |
| compliance | 30 |
| employer | 27 |
| legal | 26 |
| onboarding | 23 |
| staff | 20 |
| partner | 18 |
| apprentice | 17 |
| programs | 15 |
| apply | 14 |
| about | 14 |
| testing | 13 |
| host-shop | 13 |
| account | 11 |
| workforce-board | 10 |
| funding | 10 |
| portal | 9 |
| ferpa | 9 |
| platform | 8 |
| apps | 8 |
| mentor | 7 |
| career-services | 7 |
| support | 6 |
| contracts | 6 |
| case-manager | 6 |
| shop | 5 |
| provider | 5 |
| license | 5 |
| help | 5 |

### 3. Static Data Files: 18,212 lines ⚠️ HIGH

| File | Lines | Records |
|------|-------|---------|
| app/data/programs.ts | 2,378 | 44 programs |
| app/data/curriculum-modules.ts | 1,353 | 94 modules |
| app/data/courses.ts | 718 | 20 courses |
| data/state-licensing.ts | 274 | 26 states |
| Various program data files | ~13,000 | ~300+ programs |

---

## ⚠️ DUPLICATE ROUTES: 451 routes exist 3 times

| Duplicate Category | Count | Problem |
|--------------------|-------|---------|
| admin/* | 316 | Same route in apps/admin AND apps/app |
| devstudio/* | 45 | Duplicated |
| cron/* | 38 | Duplicated |
| analytics/* | 18 | Duplicated |
| staff/* | 10 | Duplicated |
| reports/* | 5 | Duplicated |
| **TOTAL** | **451** | **Each compiled 3x = 1,353 instances** |

**Sample Duplicates:**
- `apps/admin/api/admin/courses/route.ts` AND `apps/app/api/admin/courses/route.ts`
- `apps/admin/api/admin/programs/route.ts` AND `apps/app/api/admin/programs/route.ts`
- 316 admin routes duplicated across both apps

---

## ⚠️ HARDCODED DATA SHOULD BE IN SUPABASE

| Data File | Lines | Records | Currently |
|-----------|-------|---------|-----------|
| app/data/courses.ts | 718 | 20 courses | HARDCODED ❌ |
| app/data/programs.ts | 2,378 | 44 programs | HARDCODED ❌ |
| app/data/curriculum-modules.ts | 1,353 | 94 modules | HARDCODED ❌ |

**Supabase courses tables EXIST but not used for page rendering:**
- `career_courses` - exists in DB
- `partner_courses` - exists in DB  
- `lms_courses` - exists in DB
- `program_courses` - exists in DB

**Problem:** API routes query DB (`supabase.from('lms_courses')`) but `app/data/courses.ts` is still hardcoded for page rendering.

---

## Memory Consumption Estimates

| Category | Est. Memory | % of Build |
|----------|-------------|------------|
| API Routes (1,357) | ~600 MB | 45% |
| Pages (1,057) | ~400 MB | 30% |
| Static Data | ~150 MB | 11% |
| Dependencies | ~100 MB | 7% |
| Other | ~80 MB | 6% |
| **TOTAL** | **~1,330 MB** | 100% |

---

## Recommended Action Plan

### Phase 1: Quick Wins (1-2 days)
1. [ ] Add `output: 'standalone'` to next.config.mjs
2. [ ] Enable webpack filesystem cache properly
3. [ ] Verify _archived/* is excluded from builds
4. [ ] Set `experimental.optimizePackageImports` for lucide-react, date-fns

### Phase 2: Route Reduction (1 week)
1. [ ] Audit all API routes for usage
2. [ ] Identify dead routes (created but never called)
3. [ ] Archive unused routes instead of deleting
4. [ ] Consider route groups for separate builds
5. [ ] **Eliminate 451 duplicate routes** - remove from one app

### Phase 3: Data Migration (2 weeks)
1. [x] Programs data → Supabase (in progress)
2. [ ] Curriculum modules → Supabase
3. [ ] State licensing → Supabase
4. [ ] Product catalog → Supabase
5. [ ] **Migrate courses.ts to use lms_courses table**

### Phase 4: Architecture (Ongoing)
1. [ ] Create shared packages for common code
2. [ ] Implement micro-frontend architecture if needed
3. [ ] Consider separating admin into standalone app

---

## Build Memory Settings

Current settings in `next.config.mjs`:

```javascript
// Development - 4GB
NODE_OPTIONS='--max-old-space-size=4096'

// Fast build - 3GB  
NODE_OPTIONS='--max-old-space-size=3072'

// Cold build (16GB machine) - 16GB
NODE_OPTIONS='--max-old-space-size=16384'
```

**Recommended:** Target 8GB for production builds after optimizations.

---

## Verification Checklist

After each phase, verify:

- [ ] `pnpm build:lms:cold` completes without OOM
- [ ] TypeScript compilation succeeds
- [ ] No runtime errors in production
- [ ] Lighthouse scores maintained
- [ ] All functionality tests pass

---

## Supabase vs Next.js Responsibility

### ✅ SHOULD BE IN SUPABASE
- Database tables (programs, courses, modules)
- Authentication
- File metadata
- User records
- RLS policies
- Scheduled functions

### ❌ MUST REMAIN IN NEXT.JS
- React pages/components
- API routes (business logic)
- Middleware
- Authentication flows
- Image optimization
- Static assets

### ⚠️ CAN BE EITHER (case-by-case)
- Configuration data (< 100 records)
- Lookup tables
- Form definitions
- Workflow configurations

---

**Next Step:** Review Phase 1 quick wins and implement immediately to reduce memory pressure.
