# Line-by-Line Audit: app.elevateforhumanity.org & admin.elevateforhumanity.org

**Date:** July 18, 2026  
**Auditor:** OpenHands Agent  
**Status:** 🔴 CRITICAL BUGS FOUND

---

## Executive Summary

| Domain | HTTP Status | Root Cause | Severity |
|--------|-------------|------------|----------|
| `www.elevateforhumanity.org` | 200 ✅ | Working correctly | N/A |
| `app.elevateforhumanity.org` | 404 ❌ | Route mismatch + missing container | CRITICAL |
| `admin.elevateforhumanity.org` | 503 ❌ | Dockerfile bug + container down | CRITICAL |

---

# ISSUE #1: app.elevateforhumanity.org - 404 Route Mismatch

## Symptom
```
$ curl -s -o /dev/null -w "%{http_code}" https://app.elevateforhumanity.org
404
```

## Line-by-Line Analysis

### Middleware: /lms Redirect Logic

**File:** `middleware.ts` (lines 239-248)

```typescript
239:  // If we're on the app domain, ensure /lms/* or /student/* routes
240:  if (configuredAppHost && host === configuredAppHost && !isLocal) {
241:    const studentPaths = ['/lms', '/student', '/instructor', '/employer', '/program-holder', '/api/enrollments', '/api/courses'];
242:    if (!studentPaths.some(p => pathname.startsWith(p))) {
243:      // Redirect non-student paths to /lms
244:      const url = request.nextUrl.clone();
245:      url.pathname = `/lms${pathname === '/' ? '' : pathname}`;
246:      return NextResponse.redirect(url);
247:    }
248:  }
```

**Line 240 Analysis:** 
- ✅ Checks `configuredAppHost` matches the request host
- ⚠️ `configuredAppHost` comes from `NEXT_PUBLIC_APP_URL` env var
- If `NEXT_PUBLIC_APP_URL` is not set, `configuredAppHost` is `null` and redirect never fires

**Line 245 Analysis:**
- 🔴 **BUG:** When `pathname === '/'`, redirects to `/lms` (with empty suffix)
- ✅ `/lms` path exists in `apps/lms/app/lms/page.tsx`
- ❌ But the deployed container doesn't include `apps/lms/` routes!

### The Root Problem

**File:** `apps/app/page.tsx` (line 1-5)
```typescript
1:  import { redirect } from 'next/navigation';
2:
3:  export default function RootPage() {
4:    redirect('/admin/dashboard');
5:  }
```

This is `apps/app/page.tsx`, not `apps/lms/app/page.tsx`.

**Architecture Mismatch:**
- `apps/app/` → Redirects `/` to `/admin/dashboard` (admin routes)
- `apps/lms/` → Has the `/lms` page and student routes
- **The deployed app at `app.elevateforhumanity.org` is `apps/app/`, not `apps/lms/`**

### Route Availability Analysis

| Route | apps/app/ | apps/lms/ | Deployed? |
|-------|-----------|-----------|-----------|
| `/` | ✅ redirect to /admin | ❌ no page.tsx | ✅ (but wrong redirect) |
| `/lms` | ❌ | ✅ page.tsx exists | ❌ |
| `/admin/dashboard` | ✅ | ✅ | ✅ |
| `/student` | ❌ | ✅ | ❌ |
| `/api/ping` | ✅ | ✅ | ✅ |

### Fix Required

**Option A: Deploy apps/lms/ to app.elevateforhumanity.org**
- Configure Northflank to deploy `apps/lms/` to the app domain
- Use `Dockerfile.northflank-lms` with the `/lms` routes

**Option B: Fix middleware to not redirect**
- Change middleware to allow `/` to pass through on app domain
- Add a proper root page in `apps/app/`

**Option C: Use unified container**
- Deploy `Dockerfile.production` which includes all routes

---

# ISSUE #2: admin.elevateforhumanity.org - 503 No Healthy Upstream

## Symptom
```
$ curl -s https://admin.elevateforhumanity.org/api/ping
no healthy upstream

$ curl -s -o /dev/null -w "%{http_code}" https://admin.elevateforhumanity.org
503
```

## Line-by-Line Analysis

### Dockerfile.northflank-admin - COPY Paths Bug

**File:** `Dockerfile.northflank-admin` (lines 84-91)

```dockerfile
84:  # Copy standalone build (monorepo root = /app)
85:  COPY --from=builder /app/apps/admin/.next/standalone ./
86:  COPY --from=builder /app/.next/static ./.next/static
87:  COPY --from=builder /app/.next/server ./.next/server
88:  COPY --from=builder /app/public ./public
```

**🔴 CRITICAL BUG - Lines 86-87:**

The build command (line 66) is:
```dockerfile
RUN pnpm --filter @elevate/admin build --no-lint
```

This builds `apps/admin/` and outputs to `/app/apps/admin/.next/`.

**Line 85:** ✅ CORRECT - Copies standalone from `/app/apps/admin/.next/standalone`

**Line 86:** ❌ WRONG - Copies static from `/app/.next/static` (root, NOT admin)
**Line 87:** ❌ WRONG - Copies server from `/app/.next/server` (root, NOT admin)

These paths don't exist or contain the wrong build artifacts!

### Comparison with Working Dockerfile

**File:** `Dockerfile.marketing` (lines 84-89) - CORRECT PATTERN

```dockerfile
84:  
85:  COPY --from=builder /app/apps/marketing/.next/standalone ./
86:  COPY --from=builder /app/apps/marketing/.next/static ./.next/static
87:  COPY --from=builder /app/apps/marketing/.next/server ./.next/server
88:  COPY --from=builder /app/apps/marketing/public ./public
89:  COPY --from=builder /app/node_modules ./node_modules
```

**All paths correctly reference `/app/apps/marketing/`**

### Admin Dockerfile Build Flow Analysis

1. **Build:** `pnpm --filter @elevate/admin build` 
   - Output location: `/app/apps/admin/.next/`
   - ✅ Correct

2. **Runtime COPY:**
   - Standalone: `/app/apps/admin/.next/standalone` ✅
   - Static: `/app/.next/static` ❌ (should be `/app/apps/admin/.next/static`)
   - Server: `/app/.next/server` ❌ (should be `/app/apps/admin/.next/server`)
   - Public: `/app/public` ⚠️ (should be `/app/apps/admin/public` or no public needed)

### Missing Health Route Analysis

**File:** `apps/admin/app/api/ping/route.ts` (lines 1-5)
```typescript
1:  import { NextResponse } from 'next/server';
2:
3:  export async function GET() {
4:    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
5:  }
```

✅ The route file exists and is correctly implemented.

**Why it fails:**
1. Dockerfile copies wrong paths
2. Container doesn't have correct static/server files
3. `/api/ping` route might not be served correctly
4. Health check fails → "no healthy upstream"

---

# FIXES REQUIRED

## Fix #1: admin Dockerfile - CORRECT THE COPY PATHS

**File:** `Dockerfile.northflank-admin`

```diff
- COPY --from=builder /app/.next/static ./.next/static
- COPY --from=builder /app/.next/server ./.next/server
- COPY --from=builder /app/public ./public
+ COPY --from=builder /app/apps/admin/.next/static ./.next/static
+ COPY --from=builder /app/apps/admin/.next/server ./.next/server
+ COPY --from=builder /app/apps/admin/public ./public
```

## Fix #2: app.elevateforhumanity.org - Two Options

### Option A: Deploy LMS container separately
Create new Northflank service using `Dockerfile.northflank-lms`

### Option B: Fix middleware routing
Update `middleware.ts` to not redirect app domain to /lms

---

# Northflank Configuration for Admin

```
SERVICE
Name: elevate-admin
Type: Deployment (or combined)

SOURCE
Repository: elevate-for-humanity/Elevate-lms
Branch: main
CI: enabled

BUILD
Type: Dockerfile
Dockerfile path: /Dockerfile.northflank-admin
Build context: /

RUNTIME
Port: 8080
HOSTNAME: 0.0.0.0

DOMAIN
admin.elevateforhumanity.org → Port 8080

HEALTH CHECK
Path: /api/ping
Interval: 30s
Timeout: 10s
Start period: 120s
Retries: 3
```

---

# Northflank Configuration for App (LMS)

```
SERVICE
Name: elevate-lms
Type: Deployment (or combined)

SOURCE
Repository: elevate-for-humanity/Elevate-lms
Branch: main
CI: enabled

BUILD
Type: Dockerfile
Dockerfile path: /Dockerfile.northflank-lms
Build context: /

RUNTIME
Port: 8080
HOSTNAME: 0.0.0.0

DOMAIN
app.elevateforhumanity.org → Port 8080

HEALTH CHECK
Path: /api/ping
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-07-18 17:00 UTC
