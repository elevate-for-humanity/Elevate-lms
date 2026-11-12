# MARKETING DUPLICATE BUILD AUDIT

## ISSUE IDENTIFIED

**Two marketing pods running simultaneously:**
- `elevate-marketing-b8b88495d-t8zkx`
- `elevate-marketing-67f96fc756-8jghj`

---

## ROOT CAUSE

According to `STANDALONE_SERVICES_CORRECTION.md`, there was a **duplicate service** called `elevate-marketing-standalone` that should have been deleted.

This duplicate service may still be running, causing two separate deployments.

---

## AUDIT FINDINGS

### Workflow Analysis

**deploy-marketing.yml:**
- Line 4-6: Triggers on push to `main`, `fix/**`, `chore/**`
- Line 9-33: Path filters for all apps, packages, Dockerfiles, and config
- Line 44-47: Uses concurrency group `northflank-marketing-deploy`
- Line 52-211: Full build and deployment workflow

**NO DUPLICATE TRIGGER FOUND:**
- Only one workflow triggers marketing deployment
- deploy-lms.yml does NOT trigger marketing
- deploy-admin.yml does NOT trigger marketing
- ci-cd.yml does NOT trigger deployments

### Path Filter Analysis

The path filters in deploy-marketing.yml:
```yaml
paths:
  - 'apps/marketing/**'      # Marketing app changes
  - 'apps/lms/**'            # LMS app changes  
  - 'apps/admin/**'          # Admin app changes
  - 'packages/**'            # Shared packages
  - 'public/**'              # Public assets
  - 'styles/**'              # Styles
  - 'data/**'                # Data files
  - 'types/**'               # Type definitions
  - 'lib/**'                 # Library code
  - 'hooks/**'               # React hooks
  - 'contexts/**'            # React contexts
  - 'config/**'              # Config files
  - 'content/**'             # Content files
  - 'utils/**'               # Utilities
  - 'next.config.mjs'        # Next.js config
  - 'tailwind.config.js'      # Tailwind config
  - 'tsconfig.json'          # TypeScript config
  - 'Dockerfile.marketing'    # Marketing Dockerfile
  - 'Dockerfile.lms'         # LMS Dockerfile
  - 'Dockerfile.northflank-admin'  # Admin Dockerfile
  - 'scripts/northflank/**'  # Northflank scripts
  - 'pnpm-lock.yaml'         # Dependencies
  - 'package.json'           # Package manifest
  - '.github/workflows/deploy-marketing.yml'  # This workflow
```

### Possible Causes for Multiple Pods

1. **Duplicate service still running**: `elevate-marketing-standalone` was never deleted
2. **Rolling deployment overlap**: New deployment started before old one finished
3. **Northflank internal replication**: Multiple replicas during rollout
4. **Manual deployment**: Someone manually deployed a different image

---

## LINE-BY-LINE WORKFLOW ANALYSIS

### deploy-marketing.yml (lines 1-50)

```
Line 1:  name: Deploy Marketing (www)
Line 2:  
Line 3:  on:
Line 4:    push:
Line 5:      branches:
Line 6:        - main
Line 7:        - 'fix/**'
Line 8:        - 'chore/**'
Line 9:      paths:
Line 10-33:  [extensive path filters]
Line 34:    workflow_dispatch:
Line 35-39:  manual trigger inputs
Line 40:
Line 41:  permissions:
Line 42:    contents: read
Line 43:
Line 44:  # FIX #1: Use separate concurrency group
Line 45:  concurrency:
Line 46:    group: northflank-marketing-deploy
Line 47:    cancel-in-progress: true
Line 48:
Line 49:  env:
Line 50:    EXPECTED_SHA: ${{ github.sha }}
```

**Analysis:** ✅ Concurrency group is properly configured with `cancel-in-progress: true`

### deploy-marketing.yml (lines 51-100)

```
Line 51:
Line 52:  jobs:
Line 53:    deploy-marketing:
Line 54:      name: Build and deploy Marketing (www) on Northflank
Line 55:      runs-on: ubuntu-latest
Line 56:      env:
Line 57:        NORTHFLANK_API_TOKEN: ${{ secrets.NORTHFLANK_API_TOKEN }}
Line 58:        NORTHFLANK_TEAM_ID: ${{ secrets.NORTHFLANK_TEAM_ID || 'elevates-team' }}
Line 59:        NORTHFLANK_PROJECT_ID: ${{ secrets.NORTHFLANK_PROJECT_ID || 'elevate-platform' }}
Line 60:        NORTHFLANK_MARKETING_SERVICE_ID: ${{ secrets.NORTHFLANK_MARKETING_SERVICE_ID || 'elevate-marketing' }}
Line 61:        DEPLOY_BRANCH: main
Line 62-65:  Supabase and site URL env vars
Line 66:
Line 67:      steps:
Line 68-73:  Checkout step with SHA verification
Line 74-84:  SHA verification script
Line 85-94:  Version file generation
Line 95-99:  pnpm setup with version 10.28.2
Line 100-109: Node.js setup and dependency install
```

**Analysis:** ✅ Proper environment setup and SHA verification

### deploy-marketing.yml (lines 110-150)

```
Line 110: # Note: Ensure elevate-marketing service is set to "external-git" build mode
Line 111: # with Dockerfile path /Dockerfile.marketing in Northflank dashboard
Line 112:
Line 113: # Point Marketing service at main
Line 114: # Note: This might be triggering a second deployment
Line 115-119: Point Marketing service at main branch
Line 120-122: Trigger Marketing build
Line 123-128: Wait for build and deployment
Line 129-143: SHA verification against Northflank API
Line 144-211: Smoke test with retries
```

**Analysis:** ⚠️ The workflow:
1. Points service at main branch
2. Triggers build
3. Waits for completion
4. Triggers deployment

This is standard behavior and should NOT create duplicate pods.

---

## NORTHFLANK CONFIGURATION CHECK

### northflank_config.json

```json
{
  "vcsData": {
    "dockerFilePath": "/Dockerfile.lms"
  },
  "deployment": {
    "healthCheck": {
      "port": 8080
    }
  }
}
```

**Analysis:** ⚠️ This config shows `Dockerfile.lms` but the service is `elevate-marketing`. This might be the wrong config being applied!

---

## RECOMMENDATIONS

### 1. Check Northflank Dashboard

Verify these services:
- [ ] `elevate-marketing` - Should be using `Dockerfile.marketing`
- [ ] `elevate-marketing-standalone` - Should be DELETED

### 2. Check Service Configuration

For `elevate-marketing`:
```yaml
Build:
  Dockerfile path: /Dockerfile.marketing
  Branch: main
  
Deployment:
  Port: 3000
  Health check path: /api/ping
```

### 3. Delete Duplicate Service

Run:
```bash
NORTHFLANK_API_TOKEN=<token> npx tsx scripts/northflank/delete-duplicate-service.ts
```

### 4. Verify No Manual Deployments

Check Northflank dashboard for any manual deployments that might be running.

---

## ACTION ITEMS

| # | Action | Status |
|---|--------|--------|
| 1 | Delete `elevate-marketing-standalone` service | PENDING |
| 2 | Verify `elevate-marketing` uses correct Dockerfile | PENDING |
| 3 | Check for manual deployments | PENDING |
| 4 | Monitor for duplicate pods after cleanup | PENDING |

---

## DIAGNOSTIC COMMANDS

Run in Northflank Shell (SSH):

```bash
# List all services
kubectl get services

# List all pods with labels
kubectl get pods -l app=elevate-marketing -o wide

# Describe pods to see events
kubectl describe pods -l app=elevate-marketing

# Check deployment history
kubectl rollout history deployment/elevate-marketing

# Check replica sets
kubectl get rs -l app=elevate-marketing
```

---

## CONCLUSION

The duplicate pods are likely caused by:
1. **Duplicate service still running** (`elevate-marketing-standalone`)
2. **Or** Northflank rolling deployment not completing properly

The GitHub workflow itself is correctly configured with proper concurrency handling.
