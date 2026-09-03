# Deployment Audit - July 14, 2026 (Updated)

## Executive Summary

| Domain | Status | Final Destination | Issue |
|--------|--------|-------------------|-------|
| **www.elevateforhumanity.org** | ✅ 200 | `/lms` | ⚠️ DEV build (`x-build-id: dev`) |
| **admin.elevateforhumanity.org** | ✅ 200 | `/login?redirect=/admin` | Working |
| **app.elevateforhumanity.org** | ✅ 200 | `/lms` | Working |
| **elevateforhumanity.org** | ❌ 000 | Connection refused | DNS not configured |
| **work-1** | ❌ 502 | — | Northflank down |
| **work-2** | ❌ 502 | — | Northflank down |

## CRITICAL: TWO DEPLOYMENT PIPELINES EXIST

The infrastructure has **TWO separate hosting platforms**:

### Platform 1: Kubernetes/Istio (Primary - Serving Production Traffic)
- `www.elevateforhumanity.org` ✅ Working
- `admin.elevateforhumanity.org` ✅ Working  
- `app.elevateforhumanity.org` ✅ Working
- **BUT: Running DEV build** (`x-build-id: dev`, `x-deployment-id: local`)
- Server: `istio-envoy`

### Platform 2: Northflank (Secondary - DOWN)
- `work-1-eblcqqqelhohlbvj.prod-runtime.all-hands.dev` ❌ 502
- `work-2-eblcqqqelhohlbvj.prod-runtime.all-hands.dev` ❌ 502
- This is where the GitHub Actions deploy

## Root Causes

1. **Primary site (www) is NOT Northflank** - It's a Kubernetes/Istio cluster running a DEV build
2. **Northflank services are 502** - The services exist but containers are failing
3. **GitHub Actions deploy to Northflank** - But production traffic goes to a different cluster

## Missing Routes on www (DEV Build)

These routes return 404 on the DEV build:

- `/hiset`
- `/workkeys`
- `/certification-testing`
- `/testing`
- `/barber-apprenticeship`
- `/admin/dashboard`

## Today's Commits (12 total)

```
ae2d915 fix: Move redirect() inside component function to fix Next.js build error
5a9c65d fix: Add noindex to redirect stubs for SEO compliance
e149f83 fix: Testing center - address audit findings
2839de7 fix: Add missing imports for requireAdminClient and requireRole
089ec14 fix: Update production gate to ignore form placeholders
88fedd1 fix: Final phone placeholder cleanup
92f0e11 fix: Complete phone number cleanup
3810c6e fix: Update phone numbers and address to real contact info
ced4de9 fix: Replace placeholder phone numbers with real contact numbers
1748e3b feat: Unified container architecture + Dev Studio security
675c503 feat: Implement PARIS Operations Kernel - Authoritative Data Layer
bc54196 feat: align marketing service with same secrets as LMS/Admin
```

## Required Actions

### Priority 1: Fix Northflank (or consolidate)
- Investigate why Northflank containers are 502
- Either fix Northflank OR migrate all traffic to Northflank
- OR: Identify what cluster is serving www and deploy there

### Priority 2: Replace DEV build with PROD build
- Find where the DEV build was deployed from
- Deploy the correct production build (ae2d915)
- Update DNS to point to correct cluster

### Priority 3: Fix DNS
- `elevateforhumanity.org` (no www) returns connection refused
- Should redirect to www or be configured properly

## Build Fix Applied

The redirect() fix for `/certification-testing`, `/hiset`, `/workkeys` was pushed in commit ae2d915. This fixes the Next.js build error that was causing Northflank builds to fail.
