# LOGIN & APPLY PAGE - LINE-BY-LINE AUDIT
Generated: July 22, 2026

## ISSUE SUMMARY

| Page | Expected | Actual | HTTP Status |
|------|----------|--------|------------|
| `/apply` | Main apply page | Redirects to `/programs/barber-apprenticeship/apply` | 307 Loop |
| `/login` | Login page | **MISSING** - No page exists | 404 |

---

## BUG #1: /apply Redirect Loop

### Problem
`/apply` redirects to `/programs/barber-apprenticeship/apply` which has a broken link to itself.

### Redirect Chain
```
/apply → /programs/barber-apprenticeship/apply (307)
           ↓
    (page has broken link)
           ↓
    /programs/barber-apprenticeship/apply (infinite loop)
```

### Code Location
**File:** `/next.config.mjs` lines 429-437

```javascript
// Line 429-437
{
  source: '/apply',
  has: [{ type: 'query', key: 'program', value: 'barber-apprenticeship' }],
  destination: '/programs/barber-apprenticeship/apply',
  permanent: true,
},
```

**File:** `/apps/marketing/app/programs/barber-apprenticeship/apply/page.tsx` lines 69-82

```tsx
// Line 69-82 - SELF-REFERENCING LINK!
<Link
  href="/programs/barber-apprenticeship/apply"  // ← POINTS TO ITSELF!
  className="flex items-start gap-5 p-6 ..."
>
```

### Fix Required
1. Change line 70 in barber-apprenticeship apply page to:
   - `/programs/barber-apprenticeship/apply/shop` (partner shop application)
   - Or `/programs/barber-apprenticeship/apply/partner` (partner application)

2. Or remove the redirect rule entirely if `/apply` should be the main intake.

---

## BUG #2: /login Page Missing

### Problem
Multiple routes redirect to `/login` but NO page exists at `/login`.

### Redirect Sources → /login
| Line | Source | Destination |
|------|--------|-------------|
| 308 | `/employer/login` | `/login` |
| 404 | `/partners/login` | `/partner/login` |
| 444 | `/admin-portal` | `/login` |
| 454 | `/logout` | `/login` |
| 461 | `/auth/signin` | `/login` |
| 462 | `/sign-in` | `/login` |
| 463 | `/signin` | `/login` |

### Existing Login Pages (but not at /login)
| Path | File |
|------|------|
| `/apps/app/login/page.tsx` | Main login |
| `/apps/lms/app/login/page.tsx` | LMS login |
| `/apps/admin/app/login/page.tsx` | Admin login |

### Fix Required
**Option A:** Create `/apps/marketing/app/login/page.tsx`

**Option B:** Add redirect in next.config.mjs:
```javascript
{ source: '/login', destination: '/apps/login', permanent: true },
```

---

## LINE-BY-LINE: /apply/page.tsx

**File:** `/apps/marketing/app/apply/page.tsx`

| Line | Content | Status |
|------|---------|--------|
| 1-2 | Imports | ✅ OK |
| 15 | `dynamic = 'force-dynamic'` | ✅ OK |
| 26-32 | staticProgramOptions | ✅ OK |
| 39 | Normalizes programSlug | ✅ OK |
| 43 | Normalizes programSlug from params | ✅ OK |
| 47-51 | Resolves programTitle | ✅ OK |
| 58-71 | Database query (fallback works) | ✅ OK |
| 73-145 | Page render | ✅ OK |

**VERDICT:** `/apply/page.tsx` is fine. The issue is in the redirects.

---

## LINE-BY-LINE: barber-apprenticeship/apply/page.tsx

**File:** `/apps/marketing/app/programs/barber-apprenticeship/apply/page.tsx`

| Line | Content | Status | Issue |
|------|---------|--------|-------|
| 1-6 | Imports | ✅ OK | |
| 17-87 | Page component | ✅ OK | |
| 62 | `enrollHref="/programs/barber-apprenticeship/apply/apprentice"` | ✅ OK | |
| 63 | `inquiryHref="/programs/barber-apprenticeship/request-info"` | ✅ OK | |
| **70** | `href="/programs/barber-apprenticeship/apply"` | ❌ **BUG** | Points to itself! |

**Line 70 Fix:**
```tsx
// BEFORE (broken):
href="/programs/barber-apprenticeship/apply"

// AFTER (fix):
href="/programs/barber-apprenticeship/apply/partner"
```

---

## RECOMMENDED FIXES

### Fix 1: barber-apprenticeship/apply Self-Reference

```tsx
// File: apps/marketing/app/programs/barber-apprenticeship/apply/page.tsx
// Line 70

// Change from:
href="/programs/barber-apprenticeship/apply"

// To:
href="/programs/barber-apprenticeship/partner-application"
```

### Fix 2: Add /login Page Redirect

Add to next.config.mjs:
```javascript
{
  source: '/login',
  destination: '/apps/login',
  permanent: true,
},
```

Or create `/apps/marketing/app/login/page.tsx` that imports from `/apps/app/login/page.tsx`.

---

## AUDIT RESULTS

| Check | Status |
|-------|--------|
| `/apply` page exists | ✅ Yes |
| `/apply` has working form | ✅ Yes |
| `/apply` database query | ✅ Works (fallback) |
| `/login` page exists | ❌ **NO** |
| Login redirects work | ❌ **NO** - 404 |
| barber-apprenticeship/apply link | ❌ **BUG** - Self-reference |
| Other apply pages | ✅ Working |
