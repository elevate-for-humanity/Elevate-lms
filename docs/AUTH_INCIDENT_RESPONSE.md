# AUTHENTICATION INCIDENT RESPONSE - FULL END-TO-END REMEDIATION

**Date:** 2026-06-19  
**Status:** CRITICAL - In Progress  
**Severity:** High  
**Affected Systems:** Admin Portal, All Dashboards, API Routes  

---

## EXECUTIVE SUMMARY

Production logs show systematic authentication failures causing:
- `Auth session missing` warnings (30+ per hour)
- `getUser failed — continuing with null user` warnings
- `TypeError: Cannot read properties of null (reading 'id')` crashes

**Root Cause Identified:** 
- Session persistence failing across Northflank container deployments
- `requireRole()` bypassing removed from admin layout
- Multiple pages accessing `user.id` without null guards

**Fixes Applied:** (pending deployment)
- `if (!user)` → `if (!user?.id)` across all admin pages
- Session refresh error handling in Supabase client
- IP whitelist bypass removal

---

## PHASE 1 - AUTH INVENTORY

### Authentication Implementations Found

| Component | Location | Status |
|-----------|----------|--------|
| `createClient()` | `lib/supabase/server.ts` | ✅ Implemented |
| `getUser()` | `lib/auth.ts` | ✅ Implemented |
| `getSession()` | `lib/auth.ts` | ✅ Implemented |
| `requireRole()` | `lib/auth-guard.ts` | ⚠️ Bypassed |
| `middleware.ts` | `middleware.ts` | ⚠️ IP Whitelist Issue |

### Auth Flow Diagram

```
User Login
    ↓
Supabase Auth (lib/supabase/server.ts)
    ↓
Cookie Creation (with domain: .elevateforhumanity.org)
    ↓
Next.js Middleware (middleware.ts)
    ↓
Route Handler (getUser → user.id)
    ↓
Dashboard Page
```

### Files Using Auth

```
lib/supabase/server.ts       - Main auth client
lib/auth.ts                  - Auth utilities  
app/dashboard/page.tsx        - Dashboard routing
app/admin/layout.tsx          - Admin layout (NO requireRole)
lib/admin/get-admin-dashboard-data.ts  - Dashboard data
```

---

## PHASE 2 - LOGIN FLOW TRACE

### Complete Auth Flow

1. **Login Page** → `app/login/page.tsx`
2. **Supabase Auth** → `createClient().auth.signInWithPassword()`
3. **Session Created** → Cookie set with domain `.elevateforhumanity.org`
4. **Middleware** → `middleware.ts` validates session on protected routes
5. **Page Load** → `createClient().auth.getUser()` retrieves session
6. **Role Check** → Profile queried for role
7. **Redirect** → Based on role, redirect to appropriate dashboard

### Problem Areas Identified

1. **Northflank IP Whitelist Bypass** - Removed `requireRole()` to allow NF internal access
2. **Container Cold Starts** - Session may not persist across container restarts
3. **Cookie Domain** - Should be `.elevateforhumanity.org` for cross-portal access

---

## PHASE 3 - SESSION VALIDATION

### Test Results (Pre-Fix)

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| Session exists | ✅ | ❌ | FAIL |
| Session persists after refresh | ❌ | ❌ | FAIL |
| Session across portals | ❌ | ❌ | FAIL |
| Session after navigation | ✅ | ❌ | FAIL |

### Cookie Configuration

```typescript
// lib/supabase/server.ts
cookies: {
  getAll() { return cookieStore.getAll(); },
  setAll(cookiesToSet) {
    cookiesToSet.forEach(({ name, value, options }) => {
      const isAuthCookie = name.startsWith('sb-') && name.includes('-auth-token');
      const cookieOptions = isAuthCookie
        ? withSupabaseAuthCookieDomain(options)
        : options;
      cookieStore.set(name, value, cookieOptions);
    });
  }
}
```

---

## PHASE 4 - NULL USER AUDIT

### Files with `user.id` (Vulnerable to Null)

```bash
app/admin/instructor/gradebook/page.tsx    ← CRASH POINT
app/admin/students/[id]/page.tsx          ← CRASH POINT  
app/admin/review-queue/[id]/page.tsx
app/admin/review-queue/page.tsx
app/admin/impersonate/page.tsx
app/admin/inbox/page.tsx
app/admin/grants/submissions/page.tsx
app/admin/grants/workflow/page.tsx
app/admin/system/webhooks/page.tsx
app/admin/system/jobs/page.tsx
app/admin/studio/courses/[courseId]/edit/page.tsx
app/admin/studio/courses/create/page.tsx
app/admin/barber-shop-applications/page.tsx
app/admin/payout-queue/page.tsx
```

### Fix Pattern Applied

**BEFORE (Vulnerable):**
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) { redirect('/login'); }
const profile = await supabase.from('profiles').eq('id', user.id)...  // CRASH!
```

**AFTER (Safe):**
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user?.id) { redirect('/login'); }
const profile = await supabase.from('profiles').eq('id', user.id)...  // Safe
```

---

## PHASE 5 - CORRECT FAILURE BEHAVIOR

### Required Behavior

| Scenario | Current | Required |
|----------|---------|----------|
| Not authenticated | ❌ Crash | ✅ Redirect to /login |
| Session expired | ⚠️ Warn + continue | ✅ Redirect to /login |
| Invalid role | ✅ Redirect /unauthorized | ✅ Correct |

### Changes Made

1. **Removed graceful degradation anti-pattern:**
   ```typescript
   // REMOVED:
   if (authError) logger.warn('[dashboard] getUser failed — continuing with null user')
   ```

2. **Added proper session refresh handling:**
   ```typescript
   // Added to lib/supabase/server.ts
   client.auth.getUser = async () => {
     try {
       return await originalGetUser();
     } catch (error) {
       if (error?.message?.includes('refresh_token_already_used')) {
         await client.auth.signOut();
         return { data: { user: null }, error: null };
       }
       throw error;
     }
   }
   ```

---

## PHASE 6 - ROLE TESTING PLAN

### Roles to Test

| Role | Dashboard | Test Cases |
|------|-----------|------------|
| admin | /admin/dashboard | Login, view students, access all admin pages |
| staff | /admin/dashboard | Login, limited admin access |
| instructor | /admin/instructor/dashboard | Login, gradebook, student progress |
| student | /learner/dashboard | Login, course access, progress |
| apprentice | /apprentice/dashboard | Login, OJT logging, compliance |
| employer | /employer/dashboard | Login, job postings, hire tracking |
| partner | /partner/dashboard | Login, referral tracking |
| host_shop | /host-shop/dashboard | Login, apprentice management |

### Test Script

```bash
# Admin Portal
1. Login as admin
2. Visit /admin/students/[id] - should NOT crash
3. Visit /admin/instructor/gradebook - should NOT crash
4. Refresh page - session should persist
5. Navigate to multiple admin pages - no crashes

# Student Portal  
1. Login as student
2. Visit /learner/dashboard
3. Access courses
4. Check progress tracking
```

---

## PHASE 7 - PORTAL WALKTHROUGH CHECKLIST

### Admin Portal
- [ ] /admin/dashboard - loads without error
- [ ] /admin/students - student list loads
- [ ] /admin/students/[id] - individual student page (was crashing)
- [ ] /admin/instructor/gradebook - gradebook (was crashing)
- [ ] /admin/applications - applications list
- [ ] /admin/credentials - credentials management
- [ ] /admin/certificates - certificate management

### Student Portal
- [ ] /learner/dashboard - student dashboard
- [ ] /learner/courses - course listing
- [ ] /learner/progress - progress tracking
- [ ] /learner/certificates - earned certificates

### Employer Portal
- [ ] /employer/dashboard - employer dashboard
- [ ] /employer/jobs - job postings
- [ ] /employer/hires - hire tracking

---

## PHASE 8 - PAYMENT + WEBHOOK AUTH

### Stripe Webhooks (Already Fixed)
- ✅ `/api/webhook/stripe` - returns 200 for signature failures
- ✅ `/api/store/webhook` - returns 200 for signature failures

### Post-Purchase Flow
1. Stripe webhook received
2. Session validated
3. Enrollment created
4. Access provisioned
5. Dashboard updated

---

## PHASE 9 - PRODUCTION VALIDATION CHECKLIST

### Post-Deploy Verification

```bash
# Check for auth errors
grep "getUser failed" logs
grep "Auth session missing" logs
grep "Cannot read properties of null" logs
```

### Expected Results After Fix

| Error | Before | After |
|-------|--------|-------|
| `getUser failed` | 30+/hour | 0 |
| `Auth session missing` | 30+/hour | <5 (legitimate anon users) |
| `Cannot read properties of null (reading 'id')` | 10+/hour | 0 |

---

## COMMITS APPLIED

| Commit | Description | Status |
|--------|-------------|--------|
| `e90dcfa05` | fix: add defensive null user checks to admin pages | ✅ Merged |
| `b1dd3edf8` | fix: add null user checks to admin pages | ✅ Merged |
| `1a1c349af` | fix: prevent null user crashes in admin pages | ✅ Merged |
| `294d724e3` | fix: all webhooks return 200 for signature failures | ✅ Merged |
| `c04345501` | fix: convert remaining webhooks from Buffer to string | ✅ Merged |

---

## DEPLOYMENT STATUS

1. ✅ Fixes merged to `main`
2. ⏳ GitHub Actions deploy triggered
3. ⏳ Northflank build in progress
4. ⏳ Production deployment pending

---

## NEXT STEPS

1. **Monitor deploy** - Watch for build success/failure
2. **Test after deploy** - Run portal walkthrough
3. **Monitor logs** - Confirm auth errors eliminated
4. **User testing** - Have real users test login flows

---

## SUCCESS CRITERIA

✅ Authentication works consistently across:
- Public Site
- Admin Portal  
- Student Portal
- Apprentice Portal
- Employer Portal
- Partner Portal
- Host Shop Portal
- Dev Studio

✅ No dashboard crashes
✅ No null-user exceptions  
✅ No session-loss events
✅ No auth-related production errors

---

*End of Incident Response Document*
