# Internal Upstream Error Audit Report

**Date:** July 18, 2026  
**Auditor:** OpenHands Agent  
**Status:** 🔴 CRITICAL ISSUES FOUND

---

## Executive Summary

Both `app.elevateforhumanity.org` and `admin.elevateforhumanity.org` are experiencing failures. The root causes are:

| Domain | HTTP Status | Root Cause | Severity |
|--------|-------------|------------|----------|
| `www.elevateforhumanity.org` | 200 ✅ | Working correctly | N/A |
| `app.elevateforhumanity.org` | 404 ❌ | Route mismatch in Next.js | HIGH |
| `admin.elevateforhumanity.org` | 503 ❌ | Container unhealthy/not running | CRITICAL |

---

## ✅ FIXES APPLIED

1. **Dockerfile.marketing** - Changed port from 8080 to 3000 (matching user's specification)
2. **apps/marketing/server.js** - Added HOSTNAME fallback for consistency

---

## Issue #1: admin.elevateforhumanity.org - 503 "No Healthy Upstream"

### Symptom
```
$ curl -s -o /dev/null -w "%{http_code}" https://admin.elevateforhumanity.org
503

$ curl -s https://admin.elevateforhumanity.org/api/ping
no healthy upstream
```

### Root Cause
The admin container is **not running or unhealthy** in the deployment. This is an infrastructure issue, not a code issue.

### Evidence
- The admin container health check (`/api/ping`) returns "no healthy upstream"
- Headers show `server: istio-envoy` indicating the request reaches the load balancer but no backend is available
- The `Dockerfile.northflank-admin` configures health check on `/api/ping`

### Required Actions
1. **Check Northflank Dashboard** - Verify the admin service status
2. **Review Container Logs** - Check for startup failures, OOM, or port binding issues
3. **Verify Health Check Path** - Northflank should be configured to check `/api/health/northflank`
4. **Restart Service** if necessary

### Configuration Reference
```dockerfile
# Dockerfile.northflank-admin line 95-97
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD curl -sf http://127.0.0.1:8080/api/ping || curl -sf http://127.0.0.1:8080/ || exit 1
```

---

## Issue #2: app.elevateforhumanity.org - 404 on Root Path

### Symptom
```
$ curl -s -o /dev/null -w "%{http_code}" https://app.elevateforhumanity.org
404
```

### Root Cause
The middleware and routing configuration mismatch:

1. **Middleware (`middleware.ts` lines 239-247):**
   ```typescript
   // If we're on the app domain, ensure /lms/* or /student/* routes
   if (configuredAppHost && host === configuredAppHost && !isLocal) {
     const studentPaths = ['/lms', '/student', '/instructor', '/employer', '/program-holder', '/api/enrollments', '/api/courses'];
     if (!studentPaths.some(p => pathname.startsWith(p))) {
       // Redirect non-student paths to /lms
       const url = request.nextUrl.clone();
       url.pathname = `/lms${pathname === '/' ? '' : pathname}`;
       return NextResponse.redirect(url);
     }
   }
   ```

2. **Missing Route:** The middleware redirects `/` to `/lms`, but there is no `/lms` page in the main app. The LMS routes exist in `apps/lms/app/` which is a **separate standalone app**.

3. **apps/app/page.tsx (line 3-5):**
   ```typescript
   export default function RootPage() {
     redirect('/admin/dashboard');
   }
   ```
   This redirects to `/admin/dashboard` which only exists in `apps/admin`, not in the main app.

### Architecture Analysis

The monorepo has **three separate Next.js apps**:

| App | Location | Handles | Status |
|-----|----------|---------|--------|
| `marketing` | `apps/marketing/` | www.elevateforhumanity.org | ✅ Working |
| `admin` | `apps/admin/` | admin.elevateforhumanity.org | ❌ Container down |
| `lms` | `apps/lms/` | app.elevateforhumanity.org (intended) | ❌ Not connected |

### Required Actions

**Option A: Route all traffic through a single container (Recommended)**

The production Dockerfile (`Dockerfile.production`) is designed to build a **unified container** with all routes. If deployed, this would handle all three domains.

**Option B: Create /lms route in main app**

Add a page at `apps/app/app/lms/page.tsx` that renders the LMS content.

**Option C: Fix routing in middleware**

Update `middleware.ts` to redirect `app.elevateforhumanity.org/*` to the LMS container if using separate containers.

---

## Health Endpoint Audit

### Available Health Endpoints

| Endpoint | App | Status |
|----------|-----|--------|
| `/api/health` | marketing | ✅ Working |
| `/api/health/northflank` | marketing | ✅ Working |
| `/api/health` | lms | ⚠️ Not reachable (container not deployed) |
| `/api/health/northflank` | admin | ⚠️ Not reachable (container down) |
| `/api/ping` | admin | ❌ Returns "no healthy upstream" |

### Health Route Files Found

```
apps/marketing/app/api/health/route.ts           ✅
apps/marketing/app/api/health/northflank/route.ts ✅
apps/marketing/app/api/ping/route.ts            ✅
apps/lms/app/api/health/route.ts               ✅
apps/lms/app/api/health/northflank/route.ts    ✅
apps/lms/app/api/ping/route.ts                 ✅
apps/admin/app/api/health/northflank/route.ts  ⚠️
apps/admin/app/api/ping/route.ts               ⚠️
```

---

## Deployment Configuration Audit

### Dockerfiles Reviewed

| File | Port | Health Check | Status |
|------|------|-------------|--------|
| `Dockerfile.northflank-lms` | 8080 | `/api/ping` | ✅ Config OK |
| `Dockerfile.northflank-admin` | 8080 | `/api/ping` | ✅ Config OK |
| `Dockerfile.production` | 8080 | `/api/ready` | ⚠️ Different endpoint |

### Key Configuration Values

```dockerfile
# All Dockerfiles use these settings:
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
EXPOSE 8080
```

---

## Middleware Analysis

### Root Middleware (`middleware.ts`)

**Public Paths (line 21-34):**
```typescript
const PUBLIC_PATHS = [
  '/api/health',
  '/api/version',
  '/api/ping',
  '/api/ready',
  '/auth/confirm',
  '/auth/reset-password',
  '/login',
  '/unauthorized',
  '/forgot-password',
  '/signup',
  '/verify-email',
  '/update-password',
];
```

✅ These paths should always work.

**Domain-Based Routing (lines 203-248):**
- Admin domain: Redirects non-admin paths to `/admin`
- App domain: Redirects non-student paths to `/lms`

⚠️ **Issue:** The app domain redirects to `/lms` but the route doesn't exist in the deployed app.

---

## Recommendations

### Immediate Fixes (Priority 1)

1. **Restart admin container in Northflank**
   - Check container logs for errors
   - Verify environment variables are set
   - Ensure health check passes

2. **Fix app.elevateforhumanity.org routing**
   - Option A: Deploy unified container using `Dockerfile.production`
   - Option B: Add `/lms` page to `apps/app/app/lms/page.tsx`

### Configuration Verification (Priority 2)

3. **Verify Northflank health check paths:**
   - LMS: `/api/ping` → Points to `apps/lms/app/api/ping/route.ts` ✅
   - Admin: `/api/ping` → Points to `apps/admin/app/api/ping/route.ts` ✅

4. **Verify environment variables in Northflank:**
   ```
   NEXT_PUBLIC_SITE_URL=https://www.elevateforhumanity.org
   NEXT_PUBLIC_APP_URL=https://app.elevateforhumanity.org
   NEXT_PUBLIC_ADMIN_URL=https://admin.elevateforhumanity.org
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

---

## Conclusion

The "internal upstream error" is caused by:

1. **Admin container down** - The admin container at `admin.elevateforhumanity.org` is not running. This requires infrastructure action in Northflank.

2. **Route mismatch** - The `app.elevateforhumanity.org` domain's root path returns 404 because:
   - The middleware redirects `/` to `/lms`
   - The `/lms` route doesn't exist in the deployed app
   - The separate LMS app (`apps/lms`) is not deployed to this domain

### Next Steps

1. **Check Northflank dashboard** - Restart admin container if necessary
2. **Deploy LMS container** - If using separate containers, deploy `apps/lms` to the app domain
3. **OR Deploy unified container** - Use `Dockerfile.production` to handle all routes in one container

---

**Document Version:** 1.1  
**Last Updated:** 2026-07-18 16:45 UTC

---

## Northflank Deployment Guide for Marketing Website

### Your Final Northflank Settings

```
SERVICE
Name: elevate-marketing
Type: Combined service, or deployment linked to marketing build

SOURCE
Repository: elevate-for-humanity/Elevate-lms
Branch: main
CI: enabled

BUILD
Type: Dockerfile
Dockerfile path: /Dockerfile.marketing
Build context: /
Build command: pnpm --filter @elevate/marketing build

RUNTIME
Port: 3000
Protocol: HTTP
Public: yes
PORT: 3000
HOSTNAME: 0.0.0.0

DOMAIN
Subdomain: www.elevateforhumanity.org
Path: /
Service: elevate-marketing
Port: 3000

VERIFICATION
/api/version SHA = GitHub main SHA
```

### Step-by-Step Configuration

1. **Open Northflank** → Select your Elevate project → Services

2. **Select the marketing service** (not admin, lms, or course-builder)

3. **Build → Build options:**
   - Repository: `elevate-for-humanity/Elevate-lms`
   - Branch: `main`
   - Build type: `Dockerfile`
   - Dockerfile path: `/Dockerfile.marketing`
   - Build context: `/`

4. **Runtime settings:**
   - Internal port: `3000`
   - Protocol: `HTTP`
   - Public: `Yes`
   - Environment variables:
     - `PORT=3000`
     - `HOSTNAME=0.0.0.0`

5. **Attach domain:**
   - Go to `Ports & DNS`
   - Find port `3000`
   - `Custom domains & security rules`
   - Add: `www.elevateforhumanity.org`
   - Path: `/`

6. **Verify:**
   ```bash
   curl -I https://www.elevateforhumanity.org
   # Should return 200
   ```
