# ChunkLoadError & Cache Audit Report
**Date:** July 14, 2026  
**Status:** Comprehensive Audit Complete

---

## Executive Summary

The ChunkLoadError issue has been analyzed across the entire codebase. The root cause is a combination of **deployment timing**, **cache configuration**, and **missing error boundaries**. The following report details findings and remediation actions taken.

---

## Audit Findings

### 1. Cache Configuration Analysis

#### ✅ What Was Found: Correct Configuration

| Route Pattern | Cache-Control | Status |
|--------------|---------------|--------|
| `/_next/static/:path*` | `public, max-age=31536000, immutable` | ✅ Immutable caching is correct |
| `/_next/image` | `public, max-age=3600, stale-while-revalidate=86400` | ✅ Image optimization cached |
| `/studio/:path*` | `no-store, max-age=0` | ✅ No caching for studio |
| `/programs/:path*` | `public, max-age=60, stale-while-revalidate=300` | ⚠️ Short TTL |
| Marketing pages (listed) | `public, max-age=60, stale-while-revalidate=300` | ⚠️ Short TTL |
| All other routes | `no-store, max-age=0` | ✅ No caching |

#### ⚠️ Issues Identified

1. **Marketing pages list is incomplete** - `/support` is NOT in the marketing pages cache list
2. **`/support` falls back to no-store** - This is actually correct behavior
3. **`/partners` IS in marketing pages list** - Cached for 60s + 300s SWR
4. **X-Build-ID header present** - Good for debugging, but requires proper deployment

---

### 2. ChunkLoadError Root Causes

#### 🔴 Primary Cause: Deployment Timing
```
User visits page → Browser caches JS chunk
→ New deployment deploys → Old chunk deleted
→ Browser requests old chunk → 404 → ChunkLoadError
```

#### 🔴 Secondary Cause: Standalone Output Mode
- `output: 'standalone'` bundles chunks for container deployment
- Northflank deployments may not atomically replace chunks
- Old containers may still serve stale references

#### 🟡 Tertiary Cause: Missing Error Boundaries
- `/support` page had NO error boundary
- `/partners` page had NO error boundary
- Dynamic imports in admin dashboard lacked error handling

---

## Remediation Actions Taken

### 1. ✅ Created Error Boundaries

| File | Purpose |
|------|---------|
| `app/support/error.tsx` | Error boundary for support page |
| `app/partners/error.tsx` | Error boundary for partners page |

### 2. ✅ Enhanced Dynamic Imports

**File:** `components/admin/dashboard/DashboardDeferredPanels.tsx`

Added:
- Error boundary class component
- Retry functionality for failed dynamic imports
- Better error messages

### 3. ✅ Created Global Chunk Error Handler

**File:** `components/system/ChunkErrorHandler.tsx`

Provides:
- `ChunkErrorFallback` component with refresh mechanism
- Error type detection for ChunkLoadError patterns
- User-friendly recovery UI

### 4. ✅ Admin Dashboard Error Handler

**File:** `app/admin/dashboard/error.tsx`

Already includes:
- ChunkLoadError detection
- Auto-reload mechanism
- Session storage to prevent infinite loops
- Clear messaging for users

---

## Cache Configuration Recommendations

### Immediate Actions

1. **Add cache purge webhook** for deployment:
   ```typescript
   // After deployment completes
   // Purge Cloudflare/Northflank cache for affected routes
   ```

2. **Implement X-Deployment-ID tracking**:
   ```bash
   # Set during build
   DEPLOY_ID=$(date +%s)
   ```

3. **Reduce stale-while-revalidate for JS chunks**:
   ```javascript
   // next.config.mjs
   headers: [
     {
       source: '/_next/static/:path*',
       headers: [{ 
         key: 'Cache-Control', 
         value: 'public, max-age=31536000, immutable' 
       }],
     },
   ]
   ```

### Long-term Solutions

1. **Atomic Deployments**
   - Deploy to new directory/container
   - Switch load balancer only after successful deploy
   - Keep old chunks available during transition

2. **Version-Aware Chunk Loading**
   - Include build ID in chunk references
   - Client-side version checking

3. **Service Worker Strategy**
   - Cache-first for assets
   - Network-first for HTML
   - Version-aware updates

---

## Current Error Boundary Coverage

| Route | Error Boundary | Auto-Reload |
|-------|---------------|-------------|
| `/` (homepage) | ✅ `/app/error.tsx` | ✅ |
| `/support` | ✅ Created | ✅ |
| `/partners` | ✅ Created | ✅ |
| `/programs/:program` | ✅ `/app/programs/error.tsx` | ✅ |
| `/admin/dashboard` | ✅ Custom handler | ✅ |
| All other routes | ✅ `/app/error.tsx` | ✅ |

---

## Verification Steps

To verify fixes are working:

1. **Build the application:**
   ```bash
   pnpm build
   ```

2. **Check for build errors:**
   ```bash
   grep -i "error\|warning" .next/build/errors 2>/dev/null
   ```

3. **Test error boundaries:**
   - Navigate to `/support`
   - Navigate to `/partners`
   - Verify pages load without ChunkLoadError

4. **Monitor production:**
   - Check Sentry for ChunkLoadError patterns
   - Review Cloudflare/Northflank cache hit rates

---

## Related Configuration Files

| File | Purpose |
|------|---------|
| `next.config.mjs` | Cache headers, build ID |
| `components/system/ChunkErrorHandler.tsx` | Global error handling |
| `app/error.tsx` | Root error boundary |
| `components/system/ErrorFallback.tsx` | Reusable error UI |

---

## Next Steps

1. **Deploy these changes**
2. **Monitor for ChunkLoadError patterns**
3. **Review cache hit rates in Northflank dashboard**
4. **Consider implementing SWR for chunk updates**

---

## References

- [Next.js Deployment Documentation](https://nextjs.org/docs/app/building-your-application/deploying)
- [Cache-Control Headers Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [ChunkLoadError in Webpack](https://webpack.js.org/api/module-methods/#dynamic-expressions-in-import)
