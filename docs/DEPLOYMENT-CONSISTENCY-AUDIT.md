# DEPLOYMENT CONSISTENCY AUDIT
## Elevate for Humanity Platform

**Date:** July 16, 2026  
**Status:** CRITICAL ISSUES IDENTIFIED

---

## KNOWN ISSUES

### 1. No Version Endpoint

**Problem:** No `/api/version` endpoint exists to verify build consistency across replicas and hostnames.

**Evidence:**
```
x-build-id: unknown
x-deployment-id: unknown
```

**Fix:** ✅ CREATED `/app/api/version/route.ts`
```typescript
// Returns: { service, environment, gitSha, buildId, imageTag, imageDigest, builtAt, deployedAt }
```

**Action Required:** Deploy and verify endpoint returns correct values.

---

### 2. Non-www Redirect Missing/Incomplete

**Problem:** `elevateforhumanity.org` may not redirect cleanly to `www.elevateforhumanity.org`.

**Evidence:**
- External test: DNS_PROBE_FINISHED_NXDOMAIN
- Internal test: 404 from istio-envoy
- Inconsistent page loading reported

**Fix:** ✅ ADDED to `/middleware.ts`
```typescript
// Non-www to www redirect (preserves path and query)
if (!isLocal && host === 'elevateforhumanity.org') {
  url.hostname = 'www.elevateforhumanity.org';
  return NextResponse.redirect(url, 308);
}
```

**Action Required:** 
1. Verify DNS A record for `elevateforhumanity.org` points to same service as www
2. Test redirect preserves full path: `elevateforhumanity.org/programs/barber?ref=x` → `www.elevateforhumanity.org/programs/barber?ref=x`

---

### 3. Mutable Image Tags

**Problem:** Likely using `latest`, `main`, or `production` tags instead of immutable Git SHA.

**Evidence:**
- Header shows `x-build-id: unknown`
- No `/api/version` was returning correct data

**Required Fix:**
```dockerfile
# Use immutable tag with full Git SHA
FROM registry.northflank.io/elevate/marketing:71e9db6
# NOT: latest, main, production
```

**Action Required:**
1. Update Northflank deployment to use Git SHA as tag
2. Add environment variables:
   - `GIT_SHA=71e9db661b377b70baf352a02fb72592a1e3bfd1`
   - `IMAGE_DIGEST=<full docker digest>`
   - `BUILD_TIMESTAMP=<ISO timestamp>`

---

### 4. Stale .next Output in Docker

**Problem:** Docker image may include stale `.next` output from host.

**Evidence:**
- Two different page sizes (572 lines vs 312 lines)
- Loading... state on one version

**Required Dockerfile Changes:**
```dockerfile
# Ensure clean build
RUN rm -rf .next
RUN pnpm build
```

**Required .dockerignore:**
```
.next
node_modules
.git
coverage
dist
build
```

**Action Required:** Check and update Dockerfile if needed.

---

### 5. Cloudflare Cache Not Purged

**Problem:** CDN may be serving cached HTML from old deployment.

**Evidence:**
- Different page content depending on cache state
- Loading... state on cached version

**Required Actions:**
1. After deployment, purge all Cloudflare cache:
   - Purge Everything
   - Wait 5 minutes
   - Verify with curl from different IPs
2. Set cache headers to bypass for now:
   ```
   cache-control: no-store, max-age=0
   ```

---

### 6. Service Worker Cache Versioning

**Problem:** Old PWA caches may serve stale JavaScript.

**Evidence:**
- Platform has PWA functionality
- Old chunks may persist

**Required Fix:**
```typescript
// In service worker
const CACHE_NAME = `elevate-marketing-${BUILD_SHA}`;

// On activate, delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
});
```

**Action Required:** Update service worker to use Git SHA in cache name.

---

## RECOMMENDED NORTHFLANK CONFIGURATION

### Service Architecture
```
Marketing Service (single instance)
├── www.elevateforhumanity.org → marketing:latest (Git SHA tag)
└── elevateforhumanity.org → redirect to www (middleware)

Admin Service (single instance)
└── admin.elevateforhumanity.org → admin:latest (Git SHA tag)

App/LMS Service (single instance)
└── app.elevateforhumanity.org → lms:latest (Git SHA tag)
```

### Environment Variables (Marketing)
```bash
NEXT_PUBLIC_SITE_URL=https://www.elevateforhumanity.org
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
GIT_SHA=71e9db661b377b70baf352a02fb72592a1e3bfd1
IMAGE_TAG=71e9db6
IMAGE_DIGEST=sha256:abc123...
BUILD_TIMESTAMP=2026-07-16T12:00:00Z
DEPLOYED_AT=2026-07-16T12:30:00Z
NODE_ENV=production
```

### Dockerfile Requirements
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install -g pnpm@10
RUN pnpm install --frozen-lockfile
RUN rm -rf .next
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## VERIFICATION CHECKLIST

After making changes, verify each item:

- [ ] `/api/version` returns correct Git SHA
- [ ] Both www and non-www return same content
- [ ] All replicas have same image digest
- [ ] Cloudflare cache purged
- [ ] Service worker cache invalidated
- [ ] No `unknown` in response headers
- [ ] No stale chunks loading
- [ ] No `Loading...` states persisting

---

## DNS CONFIGURATION

Current DNS (from email):
```
elevateforhumanity.org
├── A      @     → Points to Northflank
├── CNAME  www   → www.elevateforhumanity.org.elev-5vfk.dns.northflank.app
├── CNAME  app   → app.elevateforhumanity.org.elev-5vfk.dns.northflank.app
├── CNAME  admin → admin.elevateforhumanity.org.elev-5vfk.dns.northflank.app
└── MX     @     → aspmx.l.google.com
```

**Issue:** Root A record points to something, but non-www isn't resolving properly.

**Recommended Fix:** Remove root A record, let middleware handle redirect from any hostname pointing to the service.

---

## NEXT STEPS

1. **Immediate (today)**
   - [ ] Deploy `/api/version` endpoint
   - [ ] Deploy middleware fix
   - [ ] Purge Cloudflare cache
   - [ ] Verify with curl from multiple sources

2. **This Week**
   - [ ] Update Northflank to use Git SHA tags
   - [ ] Add environment variables to deployment
   - [ ] Verify all replicas on same digest
   - [ ] Test service worker cache clearing

3. **Ongoing**
   - [ ] Monitor `/api/version` consistency
   - [ ] Alert on digest mismatches
   - [ ] Automate cache purge on deploy

---

*Document Version: 1.0*  
*Last Updated: July 16, 2026*
