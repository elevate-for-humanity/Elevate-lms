# BUILD AUDIT REPORT - June 21, 2026

## Executive Summary

This report documents the comprehensive audit of Northflank and GitHub Actions build pipelines, identifying root causes of deployment failures.

---

## 🔴 CRITICAL ISSUES FOUND

### 1. Deprecated `workerThreads` and `cpus` in next.config.mjs
**Severity:** CRITICAL  
**File:** `next.config.mjs`  
**Line:** ~160

**Problem:**
```javascript
// FAIL version has deprecated options:
experimental: {
  workerThreads: false,  // ❌ DEPRECATED - causes build issues
  cpus: 4,              // ❌ DEPRECATED - causes build issues
  optimizePackageImports: ['lucide-react', ...],
```

**PASS version comment:**
```javascript
experimental: {
  // workerThreads and cpus options removed - deprecated and cause build issues
  optimizePackageImports: ['lucide-react', ...],
```

**Fix Applied:** ✅ Removed deprecated options

---

### 2. Casing Duplicates in components/ui/
**Severity:** CRITICAL  
**Files:** Multiple files in `components/ui/`

**Problem:** Windows/Mac file systems are case-insensitive; Linux is case-sensitive. Git preserved both cases.

**Conflicting Files:**
| Uppercase (Jun 13:34) | Lowercase (Jun 15:06) |
|-----------------------|----------------------|
| Badge.tsx | badge.tsx |
| Button.tsx | button.tsx |
| Select.tsx | select.tsx |
| Tabs.tsx | tabs.tsx |
| Checkbox.tsx | checkbox.tsx |
| Label.tsx | label.tsx |
| Input.tsx | input.tsx |
| Card.tsx | card.tsx |

**Fix Applied:** ✅ Removed lowercase duplicates

---

### 3. Build Command Mismatch
**Severity:** HIGH  
**File:** `Dockerfile.northflank-lms`

| SHA | Dockerfile Command | Status |
|-----|-------------------|--------|
| 3fc33672d (PASS) | `pnpm run build:lms:compile` | ✅ Has `BUILD_SCOPE=1`, `NODE_OPTIONS='--max-old-space-size=8192'` |
| dbc0da9d (FAIL) | `pnpm next build --no-lint` | ❌ Missing env vars |

**Note:** This was likely a temporary misconfiguration, as both Dockerfiles are now identical.

---

### 4. React Error #130 - Element type is invalid
**Severity:** HIGH  
**Error Digest:** `2292220114`

**Error:** `Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined.`

**Root Causes:**
1. Missing `Globe` import in `app/apprentice/page.tsx`
2. Missing `ALL_PRODUCTS` and `STORE_PRODUCTS` exports in `lib/data/store-products.ts`
3. Malformed regex in `components/GlobalAvatar.tsx`:
   ```javascript
   // BROKEN:
   { pattern: /^\/learner/dashboard/i, ... }
   // FIXED:
   { pattern: /^\/learner\/dashboard/i, ... }
   ```

---

## 📊 BUILD STATUS ANALYSIS

### GitHub Actions (Last 24 Hours)

| Workflow | Status | Notes |
|----------|--------|-------|
| CI/CD Pipeline | MIXED | Core build passes/fails depending on commit |
| Deploy LMS | ✅ PASSING | Deploys to Northflank |
| Deploy Admin | ✅ PASSING | Admin builds correctly |
| Pre-deploy Check | ✅ PASSING | |
| Dashboard Diagnostics | ✅ PASSING | |
| Survival Guard | ✅ PASSING | |
| Integrity Gate | ❌ FAILING | Schema/data integrity issues |
| Compliance Gate | ❌ FAILING | Policy violations detected |
| Autopilot | ❌ FAILING | Builder mode failures |
| CI | ❌ FAILING | TypeScript/lint errors |
| Health Check | ❌ FAILING | Runtime errors |

### Northflank Deployments

| Service | Current SHA | Build Status | Issue |
|---------|-------------|--------------|-------|
| elevate-lms | 3fc33672d | FAIL | React Error #130 |
| elevate-admin | 3d9223be | PASS | Working correctly |

---

## 🔧 WORKFLOW ARCHITECTURE

### GitHub Actions Flow
```
Push/PR → CI/CD Pipeline → (success) → Deploy LMS
                                   → Deploy Admin
                                   → Integrity Gate
                                   → Compliance Gate
                                   → Autopilot
```

### Northflank Build Process
```
GitHub Push → deploy-lms.yml → Northflank API
                                 ↓
                          configure-services.ts
                          patch-ephemeral-storage.ts
                          set-service-branch.ts
                          trigger-build.ts
                                 ↓
                          wait-service.ts
                          verify-deployed-sha.ts
                                 ↓
                          Smoke Test (/api/ping)
```

---

## 📝 COMMITS PUSHED (Today)

```
1e9633112 - fix: remove badge.tsx and button.tsx casing duplicates
0d070d567 - fix: remove duplicate select.tsx and tabs.tsx (casing conflict)
c2acde997 - fix: remove deprecated workerThreads/cpus from experimental config
5f59b6834 - fix: restore TestingCart.tsx from clean LMS version
```

---

## ⚠️ REMAINING ISSUES

### 1. Integrity Gate Failures
The Integrity Gate is failing, indicating potential data/schema integrity issues that need investigation.

### 2. Compliance Gate Failures  
Policy violations detected. May need to review or update compliance rules.

### 3. Health Check Failures
Runtime errors detected at `https://www.elevateforhumanity.org`. May be related to the React Error #130 being thrown repeatedly.

### 4. Redirect Conflicts
```
⚠️ check-redirect-conflicts: 1 conflict(s) found
  Duplicate source "/partner-portal" — position 213, repeated at position 256
```

---

## 🎯 RECOMMENDATIONS

1. **Monitor Northflank** - The latest push should trigger a rebuild. Watch for build completion.

2. **Fix Redirect Conflicts** - Remove duplicate `/partner-portal` redirect in `next.config.mjs`

3. **Investigate Integrity Gate** - Review `integrity-gate.yml` failures to understand data integrity issues

4. **Add Casing Check to CI** - Prevent future casing conflicts by adding a pre-commit hook

5. **Document Build Requirements** - Create a `BUILD_REQUIREMENTS.md` listing all required env vars and config options

---

## 📁 RELATED FILES

### Workflows
- `.github/workflows/ci-cd.yml` - Main CI/CD pipeline
- `.github/workflows/deploy-lms.yml` - Northflank LMS deployment
- `.github/workflows/deploy-admin.yml` - Northflank Admin deployment
- `.github/workflows/integrity-gate.yml` - Data integrity checks
- `.github/workflows/compliance-gate.yml` - Policy compliance checks

### Northflank Scripts
- `scripts/northflank/trigger-build.ts` - Triggers Northflank builds
- `scripts/northflank/wait-service.ts` - Waits for deployment
- `scripts/northflank/verify-deployed-sha.ts` - Verifies deployment SHA

### Configuration
- `Dockerfile.northflank-lms` - LMS Docker build
- `next.config.mjs` - Next.js configuration
- `package.json` - Build scripts and dependencies

---

*Report generated: 2026-06-21T16:00:00Z*
