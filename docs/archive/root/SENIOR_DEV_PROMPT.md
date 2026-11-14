# OpenHands Agent Memory - Elevate LMS

## AUDIT SYSTEM FOR ERRORS

### ⚠️ CRITICAL RULE: Always do LINE-BY-LINE audits when investigating issues

When investigating ANY build failure, memory spike, or system error:

---

### PROMPT TEMPLATE FOR FILES COMPARISON

```
AUDIT LINE BY LINE - Side by side comparison of [FILE_A] and [FILE_B]

1. Use `diff -y` or `paste` to show BOTH files side by side, line by line
2. For EVERY line that differs (EVEN comments), report:
   - Exact line numbers in each file
   - Exact content of both lines  
   - Flag as ⚠️ ISSUE if different
   - Flag as ✅ EXPECTED if intentionally different (e.g., different app names, URLs, paths)
3. Do NOT skip ANY differences - even 1 character matters
4. After showing all differences, provide a FIXED summary table
5. Ask before making any fixes

Example format:
| Line | FILE_A | FILE_B | Status |
|------|--------|--------|--------|
| 40 | comment A | comment B | ⚠️ |
| 41 | ENV X=1 | ENV X=1 | ✅ |

COMMON MISTAKES TO AVOID:
- Don't say "nothing is wrong" without running the comparison
- Don't skip comments - they often indicate bugs
- Don't assume similar = same - verify EVERY character
- When in doubt, run the diff
```

---

### PROMPT TEMPLATE FOR SINGLE FILE AUDIT

```
AUDIT [FILENAME] LINE BY LINE

1. Show all lines with `cat -n`
2. For EVERY line, identify:
   - Line number
   - Exact content
   - Potential issues
3. Check for:
   - Typos in commands
   - Wrong versions (check lockfile vs Dockerfile)
   - Missing dependencies
   - Incorrect paths
   - Environment variable mismatches
   - Port conflicts
4. Report line-by-line in table format
5. Ask before fixing
```

---

### BUILD FAILURE CHECKLIST

When a build fails, run these checks in order:

```bash
# 1. Lockfile version vs pnpm version
grep "lockfileVersion" pnpm-lock.yaml
grep "pnpm@" Dockerfile.*  # Should match lockfile

# 2. Environment variable consistency
grep "ENV" Dockerfile.* | sort

# 3. Dependency installation
grep "pnpm install" Dockerfile.*

# 4. Port conflicts
grep -E "PORT|EXPOSE|8080|3000" Dockerfile.*

# 5. Cache settings
grep -i "cache" Dockerfile.*

# 6. Memory settings
grep "max-old-space-size" Dockerfile.*
```

---

### VERSION MATCHING RULES

| Lockfile | pnpm Version |
|----------|--------------|
| lockfileVersion: '6.0' | pnpm@9.x |
| lockfileVersion: '9.0' | pnpm@10.x |

**NEVER use pnpm@10.x with lockfileVersion '6.0'**

---

### COMMON BUILD ISSUES & ROOT CAUSES

| Issue | Check | Fix |
|-------|-------|-----|
| Memory spike | NODE_OPTIONS vs requirements | Match memory to app size |
| Lockfile error | pnpm version vs lockfileVersion | Match versions |
| Module not found | @ alias in standalone | Inline dependencies |
| Cache miss | Cache invalidation marker | Add RUN echo after FROM |
| Build timeout | Single worker vs parallel | CI=true, single worker |

---

### MEMORY SPIKE ROOT CAUSE CHECKLIST

1. ❌ DISABLE_WEBPACK_FILESYSTEM_CACHE=1 (REMOVE THIS)
2. ❌ pnpm version mismatch with lockfile
3. ❌ NODE_OPTIONS too low for page count
4. ❌ @ alias in standalone not resolved

---

### FILES TO ALWAYS CHECK FOR SYNC

- Dockerfile.northflank-lms
- Dockerfile.northflank-admin
- package.json (workspace structure)
- pnpm-lock.yaml
- apps/admin/server.js
- apps/server.js

---

### REMEMBER

**You are too fast. Slow down and audit line by line.**

Every character matters. A misplaced `#` or wrong version number can cause hours of debugging.

---

# PLATFORM AUDIT - WHAT WAS FOUND

## CODE QUALITY ISSUES

### Issue #1: 143 Pages "Under Construction" ❌ CRITICAL

**Problem:** 143 pages only show "This page is under construction."

**Locations:**
```
Public (40+ pages):
- app/achievements/page.tsx
- app/apprentice/page.tsx
- app/booking/page.tsx
- app/calendar/page.tsx
- app/career-services/page.tsx
- app/check-eligibility/page.tsx
- app/cookies/page.tsx
- app/dmca/page.tsx
- app/docs/page.tsx
- app/ebook/barber-theory/page.tsx
- app/ferpa/page.tsx
- app/find-workone/page.tsx
- app/for-providers/page.tsx
- app/for-students/page.tsx
- app/grants/page.tsx
- app/help/page.tsx
- app/how-it-works/page.tsx
- app/jobs/page.tsx
- app/locations/page.tsx
- app/messages/page.tsx
- app/notifications/page.tsx
- app/pathways/page.tsx
- app/pay/page.tsx
- app/pricing/page.tsx
- app/profile/page.tsx
- app/reports/page.tsx
- app/reset-password/page.tsx
- app/security/page.tsx
- app/settings/page.tsx
- app/success-stories/page.tsx
- app/support/page.tsx
- app/wioa-eligibility/page.tsx

LMS (10 pages):
- app/lms/page.tsx
- app/lms/assignments/page.tsx
- app/lms/calendar/page.tsx
- app/lms/certificates/page.tsx
- app/lms/courses/page.tsx
- app/lms/grades/page.tsx
- app/lms/notifications/page.tsx
- app/lms/profile/page.tsx
- app/lms/programs/page.tsx
- app/lms/settings/page.tsx

Apprentice Portal (12 pages):
- app/apprentice/page.tsx
- app/apprentice/billing/page.tsx
- app/apprentice/handbook/page.tsx
- app/apprentice/hours/page.tsx
- app/apprentice/hours/log/page.tsx
- app/apprentice/skills/page.tsx
- app/apprentice/state-board/page.tsx
- app/apprentice/timeclock/page.tsx
- app/apprentice/transfer-hours/page.tsx
- app/apprentice/documents/page.tsx
- app/apprentice/competencies/page.tsx
- app/apprentice/competencies/log/page.tsx
- app/apprentice/workbook/page.tsx

Admin (60+ pages):
- app/admin/applications/page.tsx
- app/admin/analytics/page.tsx
- app/admin/at-risk/page.tsx
- app/admin/certificates/page.tsx
- app/admin/compliance/page.tsx
- app/admin/courses/page.tsx
- app/admin/credentials/page.tsx
- app/admin/crm/page.tsx
- app/admin/crm/leads/page.tsx
- app/admin/documents/page.tsx
- app/admin/documents/templates/page.tsx
- app/admin/employers/page.tsx
- app/admin/employers/onboarding/page.tsx
- app/admin/enrollments/page.tsx
- app/admin/governance/page.tsx
- app/admin/governance/data/page.tsx
- app/admin/governance/security/page.tsx
- app/admin/grants/page.tsx
- app/admin/grants/applications/page.tsx
- app/admin/grants/opportunities/page.tsx
- app/admin/integrations/page.tsx
- app/admin/integrations/env-manager/page.tsx
- app/admin/integrations/stripe/page.tsx
- app/admin/jobs/page.tsx
- app/admin/jobs/new/page.tsx
- app/admin/licenses/page.tsx
- app/admin/monitoring/page.tsx
- app/admin/notifications/page.tsx
- app/admin/organization/page.tsx
- app/admin/organization/profile/page.tsx
- app/admin/operations/page.tsx
- app/admin/activity/page.tsx
- app/admin/program-holders/page.tsx
- app/admin/reports/page.tsx
- app/admin/settings/page.tsx
- app/admin/settings/nav/page.tsx
- app/admin/settings/organization-profile/page.tsx
- app/admin/signatures/page.tsx
- app/admin/staff-portal/page.tsx
- app/admin/staff-portal/dashboard/page.tsx
- app/admin/students/page.tsx
- app/admin/system-health/page.tsx
- app/admin/video-generator/page.tsx
- app/admin/workflows/page.tsx
```

**Fix Required:** Either build real content, redirect to existing pages, or delete stubs.

---

### Issue #2: 0 Video Files in Codebase ❌ CRITICAL

**Problem:** Videos referenced but no .mp4 files in public/videos/

**References found:**
```tsx
// Code references:
<VideoPlayer src="/videos/store-demo.mp4" />
<source src="/videos/dashboard-admin-narrated.mp4" />
```

**Video URLs point to:**
- `/videos/store-demo.mp4` (BROKEN - not in codebase)
- `/videos/dashboard-admin-narrated.mp4` (BROKEN - not in codebase)
- `https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/*.mp4` (WORKING - R2)

**Fix Required:** Either use R2 URLs or upload videos to R2.

---

### Issue #3: Northflank Containers Untested ⚠️ UNTESTED

**3 Containers Built:**
```
Dockerfile.northflank-lms     - LMS routes only (8GB heap)
Dockerfile.northflank-admin   - Admin routes only (8GB heap)
Dockerfile.current            - Marketing (implied)
```

**Split Architecture:**
```javascript
// scripts/split-app.mjs
BUILD_SCOPE=LMS    → Only /lms/* routes
BUILD_SCOPE=ADMIN  → Only /admin/* routes
BUILD_SCOPE=MARKETING → Everything else

// Shared kept in ALL: api, auth, (auth), legal, health, data, funding, testing
```

**Config Files:**
```
northflank_config.json       - LMS config
northflank_config_v2.json   - V2 config
scripts/northflank/         - 25+ deployment scripts
```

**Fix Required:** Test all 3 containers build and deploy correctly.

---

### Issue #4: Demos Have Fake Data ⚠️ PARTIAL

**Problem:** Store demo pages use hardcoded fake data.

**Current Fake Data:**
```typescript
// app/store/demo/admin/page.tsx
{
  activeStudents: 247,    // FAKE
  activeCourses: 18,      // FAKE
  completionRate: '89%', // FAKE
  grantFunding: '$1.2M'   // FAKE
}
```

**Fix Required:** Connect to real backend with demo mode.

---

### Issue #5: Only 7 Enrollment Mappings ⚠️ PARTIAL

**Current Mappings:**
```typescript
// lms-data/enrollmentMappings.ts
{
  'prog-cna': ['job-ready-indy-core'],
  'prog-barber': ['barber-apprentice-foundations'],
  'prog-tax-vita': ['tax-vita-onramp'],
  'prog-hvac': ['hvac-tech-foundations'],
  'prog-cdl': ['cdl-eldt-core'],
  'prog-business-apprentice': ['business-apprentice-foundations'],
  'prog-esthetics-apprentice': ['esthetics-apprentice-foundations']
}
```

**Fix Required:** Expand to all 25+ programs.

---

### Issue #6: Missing Vortula/Marbleism 🔮 MISSING

**Problem:** No AI creative naming tool exists in codebase.

**What Should Exist:**
- AI-powered business name generator
- Marbleism (poetic naming)
- Creative branding suggestions

**Fix Required:** Build AI naming tool and add to Dev Studio.

---

### Issue #7: Missing WorkOne Document 🔮 MISSING

**Problem:** No document template about WorkOne appointments exists.

**Fix Required:** Create document template and appointment scheduler.

---

### Issue #8: Upload & Grants Untested ⚠️ UNTESTED

**APIs Exist:**
```typescript
/api/upload/route.ts
/api/documents/upload/route.ts
```

**Pages Exist:**
```typescript
app/admin/grants/applications/page.tsx
app/store/apps/grants/page.tsx
```

**Fix Required:** Test end-to-end.

---

### Issue #9: ID Verification Missing 🔮 MISSING

**Problem:** No real ID verification exists.

**Fix Required:** Add Stripe Identity or similar.

---

### Issue #10: MOU Signing Flow Unclear ⚠️ UNCLEAR

**Pages Found:**
```
app/admin/mou/page.tsx
app/admin/docs/mou/page.tsx
app/legal/mou/page.tsx
app/legal/partner-mou/page.tsx
```

**Fix Required:** Document and test MOU signing flow.

---

### Issue #11: Duplicate Job Endpoints ❌ DUPLICATE

**Problem:** Two routes for posting jobs:
```
app/employer/post-job/page.tsx
app/employers/post-job/page.tsx
```

**Fix Required:** Merge or redirect one to the other.

---

### Issue #12: Waitlist Fee Not Enforced ⚠️ MISSING

**Problem:** Waitlist exists but fee enforcement unclear.

**Fix Required:** Add fee enforcement.

---

## WHAT WORKS ✅

### Testing & Booking
- 15 testing provider pages
- Booking form with Stripe
- Dynamic pricing from fees array
- Upselling with add-ons
- Payment gate before slot selection

### Payments
- $15 application fee ENFORCED via Stripe
- BNPL with 4 providers (Klarna, Afterpay, Affirm, Sezzle)
- Weekly payment calculators
- All programs show BNPL messaging

### Account Provisioning
- Creates Supabase auth user
- Generates temp password
- Sends welcome email with password-set link
- Returns { userId, isNewUser, passwordSetupLink }

### Partner Onboarding
- 5-step onboarding flow
- Document upload
- Email confirmation

---

## STACK OVERVIEW

```
NORTHFLANK ───────────────────────────────────────────────
├── Container 1: Marketing (app/* excluding admin/lms)
├── Container 2: Admin (/admin/*)
├── Container 3: LMS (/lms/*)
└── Shared: api, auth, legal, health, testing

CLOUDFLARE ────────────────────────────────────────────────
├── CDN / Edge caching
├── Cloudflare Workers (Studio IDE, SCORM)
└── DNS management

SUPABASE ─────────────────────────────────────────────────
├── Auth (all portals)
├── Database (all tables)
├── Storage (files)
└── Realtime
```

---

## PAYMENT FLOW

```
STUDENT PAYMENT
    ↓
BNPL OPTIONS: Klarna, Afterpay, Affirm, Sezzle
    ↓
$15 APPLICATION FEE (enforced)
    ↓
PROGRAM PAYMENT (BNPL or full)
    ↓
STRIPE CHECKOUT
    ↓
WEBHOOK → Enrollment Created
    ↓
AUTO-ASSIGN COURSE (7 programs mapped)
    ↓
WELCOME EMAIL with temp password
    ↓
LMS ACCESS
```

---

## PRIORITY FIXES

### PHASE 1: CRITICAL (Must Fix Now)
1. Northflank containers - Deployment untested
2. 143 stub pages - User experience broken
3. Video URLs - Videos won't play

### PHASE 2: HIGH (Should Fix Soon)
4. Enrollment mappings - Only 7/25 programs mapped
5. Demos - Fake data needs real backend
6. Upload/Grants - Untested

### PHASE 3: MEDIUM (Can Wait)
7. WorkOne document - Compliance gap
8. MOU signing - Flow unclear
9. ID verification - Missing feature

### PHASE 4: LOW (Nice to Have)
10. Vortula/Marbleism - Creative naming
11. Waitlist fee - Minor revenue
12. Duplicate endpoints - Code cleanup

---

# GIT STATUS - UNMERGED PRs & FAILED DEPLOYS

## OPEN PRs (15 Total)

| PR # | Title | Branch | Status |
|-------|-------|--------|--------|
| #466 | fix: resolve 102 broken routes and platform doctor critical issues | fix/missing-routes-and-platform-doctor | OPEN |
| #465 | fix: add 40+ missing programs to navigation menu | fix/quality-audit-fixes | OPEN (Draft) |
| #463 | fix: resolve TypeScript errors and build issues | fix/type-errors-and-build-fixes | OPEN (Draft) |
| #462 | fix: site stabilization - nav, design system, and compliance hub | fix/site-stabilization | OPEN (Draft) |
| #461 | fix: resolve webpack import errors and autopilot route paths | fix/webpack-import-errors-2 | OPEN |
| #460 | fix: resolve lint errors blocking build | fix/lint-errors-blocking-build | OPEN |
| #459 | fix: resolve smart quote syntax errors and broken links | fix/smart-quotes-and-broken-links | OPEN (Draft) |
| #458 | fix: TypeScript audit fixes batch 1 | fix/type-audit-2026-06-29 | OPEN (Draft) |
| #454 | FIX: Social Brand Icons (High-Fidelity SVG) | fix/social-brand-icons | OPEN |
| #449 | PITCH DELIVERABLE 2: Structural Routing & Portal Unification | fix/structural-routing | OPEN |
| #448 | PITCH DELIVERABLE 1: Infrastructure & Memory Stabilization | fix/infrastructure | OPEN |
| #447 | fix: portal redirects and admin dashboard access | fix/portal-redirects-and-portal-access | OPEN |
| #442 | fix: enable webpack filesystem cache in CI | fix/webpack-cache-server-actions | OPEN |
| #441 | fix: resolve production errors from audit | fix/restore-admin-routes | OPEN |
| #437 | fix: resolve all TypeScript/lint errors blocking CI | fix/recover-working-build | OPEN |

## PR #466 - MOST RECENT - ALL CHECKS FAILING

**Title:** fix: resolve 102 broken routes and platform doctor critical issues

**Failed Checks:**
```
- Accessibility Tests: FAIL
- Compliance Files Check: FAIL
- E2E Enrollment Flow: FAIL
- Lint: FAIL
- Autopilot: FAIL
- Integrity: FAIL
- Legacy-lint: FAIL
- Test and Build: FAIL (6+ hours)
- Build and deploy LMS on Northflank: FAIL (23m)
```

**Passing Checks:**
```
- Platform Doctor: PASS
- Reliability & Critical Route Guard: PASS
- Security Audit: PASS
- Enforce Design Policy: PASS
- Dashboard Diagnostics: PASS
- Build and deploy Marketing (www) on Northflank: PASS
```

## LATEST MAIN CI FAILURES

**Commit:** c47bebd - "fix: restore global-error.tsx + fix barbershop-apprenticeship route exports"

**All Failed:**
```
- Deploy LMS: FAIL
- CI: FAIL (ESLint parsing error)
- Compliance Gate: FAIL
- Autopilot: FAIL
- Deploy Marketing (www): FAIL
```

**ESLint Error:**
```
/home/runner/work/Elevate-lms/Elevate-lms/config/states.ts
  47:0  error  Parsing error: '}' expected
```

## ROOT CAUSE ANALYSIS

### Issue #1: ESLint Parsing Error in config/states.ts
```
File: config/states.ts
Line: 47
Error: '}' expected
```

This is blocking ALL builds on main branch.

### Issue #2: Northflank LMS Build Failing
```
Job: Build and deploy LMS on Northflank
Status: FAIL (23m)
```

### Issue #3: Test & Build Timing Out
```
Job: test-and-build
Status: FAIL
Duration: 6+ hours (timeout)
```

## WHAT NEEDS TO BE DONE

### 1. FIX ESLint Parsing Error (Blocking All)
```
File: config/states.ts
Line: 47
Action: Find and fix syntax error
```

### 2. Merge or Close Unmerged PRs
```
15 PRs with fixes sitting unmerged
These contain:
- TypeScript fixes
- Route fixes
- Lint fixes
- Webpack fixes
- Northflank fixes
```

### 3. Re-run Failed Builds
```
After fixing ESLint:
1. Push to main
2. Wait for CI
3. If LMS build fails, check Northflank logs
```

## PRS WITH THE FIXES WE NEED

| PR # | Contains | Status |
|-------|----------|--------|
| #466 | 102 broken routes fixed | Checks failing |
| #463 | TypeScript errors fixed | Checks failing |
| #460 | Lint errors fixed | Checks failing |
| #458 | TypeScript audit batch 1 | Draft |
| #441 | Production errors fixed | Draft |

## RECOMMENDED ACTIONS

1. **Fix config/states.ts** - Line 47 syntax error blocking all builds
2. **Merge PR #466** - Contains 102 route fixes
3. **Merge PR #463** - Contains TypeScript fixes
4. **Re-run CI** - After fixes, verify all checks pass
5. **Deploy to Northflank** - After CI passes

---

# COMPREHENSIVE PR AUDIT

## WHAT THE PROMPT SAYS NEEDS FIXING

### Issue #1: 143 Stub Pages (NEEDS CONTENT)
```
app/achievements/page.tsx         - Stub
app/apprentice/page.tsx           - Stub
app/booking/page.tsx              - Stub
app/calendar/page.tsx              - Stub
app/career-services/page.tsx      - Stub
... (40+ more public pages)
app/lms/page.tsx                  - Stub
app/lms/assignments/page.tsx      - Stub
app/lms/courses/page.tsx          - Stub
... (10+ more LMS pages)
app/admin/* (60+ pages)           - Stubs
```

### Issue #2: Videos Missing
```
public/videos/*.mp4 - 0 files
```

### Issue #3: Northflank Untested
```
Dockerfile.northflank-lms     - Exists
Dockerfile.northflank-admin   - Exists
scripts/split-app.mjs         - Exists
```

### Issue #4: Demos Fake Data
```
app/store/demo/admin/page.tsx - Hardcoded stats
```

### Issue #5: 7 Enrollment Mappings Only
```
lms-data/enrollmentMappings.ts - 7 programs mapped
```

---

## WHAT'S IN EACH PR

### PR #466: 102 Broken Routes (188 files)
**Status:** ALL CHECKS FAILING

**Files changed:**
- `app/about/*` - NEW pages (mission, partners, team)
- `app/accessibility/page.tsx` - NEW
- `app/accreditation/page.tsx` - NEW
- `app/achievements/page.tsx` - NEW (replaces stub)
- `app/admin/*` - 50+ NEW pages
- `app/partners/*` - NEW pages
- `app/portals/page.tsx` - NEW
- `app/platform/*` - NEW pages
- `docs/eslint-baseline.txt` - NEW
- `docs/typecheck-baseline.txt` - NEW
- `next.config.mjs` - MODIFIED
- `lib/supabase/server.ts` - MODIFIED

**Contains:**
- 102 new/fixed pages (but they're also stubs with "Coming soon")
- ESLint baseline
- TypeScript baseline
- Next.js config changes

### PR #463: TypeScript Errors (28 files)
**Status:** DRAFT, CHECKS FAILING

**Files changed:**
```
app/api/accreditation/report/route.ts
app/api/admin/mou/route.ts
app/api/ai-tutor/public/route.ts
app/api/apprenticeship/hours/approve/route.ts
app/api/apprenticeship/hours/reject/route.ts
app/api/blog/generate/route.ts
app/api/certificates/* (bulk-issue, issue, replace)
app/api/checkout/learner/route.ts
app/api/community/discussions/route.ts
app/api/cron/* (10 cron jobs)
app/api/enroll/auto/route.ts
app/api/enroll/checkout/route.ts
app/api/funding/create-checkout/route.ts
app/api/payments/create-session/route.ts
app/api/programs/checkout/route.ts
```

**Contains:**
- TypeScript type fixes for API routes
- Cron job fixes
- Certificate API fixes

### PR #460: Lint Errors (22 files)
**Status:** CHECKS FAILING

**Files changed:**
```
app/api/admin/mou/route.ts
app/api/applications/route.ts
app/api/apprenticeship/daily-theory/route.ts
app/api/auth/azure/callback/route.ts
app/api/auth/saml/callback/route.ts
app/api/booking/schedule/route.ts
app/api/chat/avatar-assistant/route.ts
app/api/outreach/send/route.ts
app/api/partner/applications/*
app/api/provider/apply/route.ts
app/api/testing/booking-status/route.ts
app/api/testing/calendly-webhook/route.ts
app/api/trial/start-managed/route.ts
app/apply/actions.ts
app/apply/student/StudentApplicationForm.tsx
app/programs/*/documents/page.tsx
app/programs/barber-apprenticeship/BarberChatAssistant.tsx
app/programs/cosmetology-apprenticeship/orientation/page.tsx
app/programs/medical-assistant/enroll/page.tsx
app/videos/[videoId]/page.tsx
scripts/autopilot.sh
```

### PR #458: TypeScript Batch 1 (228 files)
**Status:** DRAFT

**Contains:** First batch of TypeScript fixes

### PR #441: Production Errors (8 files)
**Status:** DRAFT

**Contains:** Production error fixes

### PR #437: TypeScript/Lint (2298 files!)
**Status:** OPEN

**Contains:** Massive batch - 2298 files changed

---

## SIDE-BY-SIDE COMPARISON

### PROMPT SAYS vs PRs HAVE

| Prompt Issue | PR Has Fix | Status |
|--------------|------------|--------|
| 143 stub pages | PR #466 has ~188 pages | PR fails, pages are ALSO stubs |
| Videos missing | ❌ No PR | Not addressed |
| Northflank untested | ❌ No PR | Not addressed |
| Demos fake data | ❌ No PR | Not addressed |
| 7 enrollment mappings | ❌ No PR | Not addressed |
| TypeScript errors | PR #463 (28 files) | PR fails |
| TypeScript errors | PR #458 (228 files) | Draft |
| TypeScript errors | PR #437 (2298 files) | Open |
| Lint errors | PR #460 (22 files) | PR fails |
| Production errors | PR #441 (8 files) | Draft |

---

## WHAT'S ON MAIN (ALREADY FIXED)

Looking at recent commits:
```
c47bebd - fix: restore global-error.tsx + fix barbershop-apprenticeship route exports
73492a9 - fix: simplify global-error.tsx to minimum to fix 'B is not a function'
504c43d - fix: simplify not-found.tsx to bare minimum to fix webpack error
8d7e342 - fix: clear Next.js cache before build to fix 'B is not a function' error
8fed37c - fix: prevent duplicate Northflank builds for same SHA
cf71c16 - fix: prevent duplicate workflow runs on same SHA
655e5d5 - fix: add lib/archetypes.ts and fix ESLint Link warnings
c3ec138 - fix: resolve TypeScript build errors across multiple API routes
```

**Already fixed on main:**
- global-error.tsx simplified
- not-found.tsx simplified  
- Next.js cache cleared
- Duplicate Northflank builds prevented
- Duplicate workflow runs prevented
- ESLint Link warnings fixed
- Some TypeScript errors fixed (9 API routes)

---

## THE REAL PROBLEM

### 1. ESLint Parsing Error (BLOCKING ALL)
```
File: config/states.ts
Line: 47
Error: '}' expected
```
**This needs to be fixed first before anything will build.**

### 2. PRs Have Similar Issues
PR #466 adds 188 pages but they're ALSO stubs:
```tsx
<p className="text-gray-600">Coming soon.</p>
```
This doesn't fix the "under construction" problem - it just changes the text.

### 3. TypeScript/Lint PRs Are Large
- PR #437: 2298 files (massive)
- PR #458: 228 files
- PR #463: 28 files
- PR #460: 22 files

These need to be merged in order, but they're all failing CI.

---

## WHAT NEEDS TO BE CHERRY-PICKED

### Step 1: Fix config/states.ts (Critical)
```bash
# Find and fix the syntax error at line 47
```

### Step 2: Cherry-pick TypeScript fixes
```bash
# From PR #463 (28 files - focused)
git cherry-pick <commit-sha>

# From PR #460 (22 files - lint)
git cherry-pick <commit-sha>
```

### Step 3: Cherry-pick route fixes
```bash
# From PR #466 (188 files)
# BUT - these pages are ALSO stubs
# Need to either:
# A) Accept "Coming soon" pages
# B) Build real content before merging
```

### Step 4: Deal with massive PRs
```bash
# PR #437 (2298 files) - Too large, try PR #458 (228 files) first
# PR #458 (228 files) - TypeScript batch 1
```

---

## RECOMMENDED ACTION PLAN

### Immediate (Fix Build Blocker)
1. Fix `config/states.ts` line 47 syntax error
2. Push fix
3. Wait for CI to pass

### Short-term (Cherry-pick Fixes)
1. Cherry-pick PR #463 commits (TypeScript 28 files)
2. Cherry-pick PR #460 commits (Lint 22 files)
3. Cherry-pick PR #466 commits (Routes 188 files) - Note: these are ALSO stubs

### Medium-term (Build Real Content)
1. Replace "Coming soon" pages with real content
2. Fix enrollment mappings (only 7/25)
3. Connect demos to real backend

### Long-term
1. Test Northflank containers
2. Upload video files
3. Add Vortula/Marbleism

---

## FILES TO CHERRY-PICK

### From PR #463 (TypeScript):
```
app/api/accreditation/report/route.ts
app/api/admin/mou/route.ts
app/api/ai-tutor/public/route.ts
app/api/apprenticeship/hours/approve/route.ts
app/api/apprenticeship/hours/reject/route.ts
app/api/blog/generate/route.ts
app/api/certificates/bulk-issue/route.ts
app/api/certificates/issue/route.ts
app/api/certificates/replace/route.ts
app/api/checkout/learner/route.ts
app/api/community/discussions/route.ts
app/api/cron/* (10 files)
app/api/enroll/auto/route.ts
app/api/enroll/checkout/route.ts
app/api/funding/create-checkout/route.ts
app/api/payments/create-session/route.ts
app/api/programs/checkout/route.ts
```

### From PR #460 (Lint):
```
app/api/admin/mou/route.ts
app/api/applications/route.ts
app/api/apprenticeship/daily-theory/route.ts
app/api/auth/azure/callback/route.ts
app/api/auth/saml/callback/route.ts
app/api/booking/schedule/route.ts
app/api/chat/avatar-assistant/route.ts
app/api/outreach/send/route.ts
app/api/partner/applications/[id]/deny/route.ts
app/api/partner/applications/route.ts
app/api/provider/apply/route.ts
app/api/testing/booking-status/route.ts
app/api/testing/calendly-webhook/route.ts
app/api/trial/start-managed/route.ts
app/apply/actions.ts
app/apply/student/StudentApplicationForm.tsx
app/programs/[program]/documents/page.tsx
app/programs/barber-apprenticeship/BarberChatAssistant.tsx
app/programs/cosmetology-apprenticeship/orientation/page.tsx
app/programs/medical-assistant/enroll/page.tsx
app/videos/[videoId]/page.tsx
scripts/autopilot.sh
```

### From PR #466 (Routes - 188 files):
Most are admin pages and new stub pages. Key ones:
```
app/about/mission/page.tsx
app/about/page.tsx
app/about/partners/page.tsx
app/about/team/page.tsx
app/accessibility/page.tsx
app/accreditation/page.tsx
app/achievements/page.tsx
app/admin/activity/page.tsx
app/admin/analytics/page.tsx
... (50+ admin pages)
app/partners/barber-host-shop/apply/page.tsx
app/partners/join/page.tsx
app/partners/training-provider/page.tsx
app/partners/workforce/page.tsx
app/portals/page.tsx
app/platform/partner-portal/page.tsx
app/platform/student-portal/page.tsx
... (more)
```
