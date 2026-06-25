# INFRASTRUCTURE AUDIT SUMMARY
## Elevate LMS - June 21, 2026

---

## 📁 REPOSITORY INFO

| Property | Value |
|----------|-------|
| **Name** | elevate-for-humanity/Elevate-lms |
| **Default Branch** | main |
| **Total Commits (June)** | 998 |
| **Remote** | origin |

---

## 🌿 BRANCHES

### Local Branches (5)
```
* main
  accio-fixes-lms-20260621-1400
  admin-consolidation-2026-06-18
  lms-critical-fixes-safe
  lms-fix-crashes-20260621
  lms-fixes-only
  lms-full-sync-20260621-1440
  lms-full-sync-20260621-1441
  lms-old-code-old-deps
  lms-sync-all-fixes-20260621
```

### Remote Branches (150+)
**Codex Branches (auto-generated):**
- `codex/fix-admin-dashboard-*` (7 variants)
- `codex/investigate-system-failures-*` (9 variants)
- `codex/fix-lms-codebuild-queue-retry`
- `codex/fix-main-a11y-contrast-gate`
- `codex/fix-main-favicon-integrity`
- `codex/fix-program-page-imports-main`

**Cursor Branches (100+ variants):**
- `cursor/fix-*` - Various fixes
- `cursor/deploy-*` - Deployment fixes
- `cursor/northflank-*` - Northflank specific
- `cursor/production-*` - Production issues

**Devin Branches (20+ variants):**
- `devin/1780*` - Devin agent work
- `devin/1781*` - Devin agent work

**Feature Branches:**
- `feature/coupon-engine-platform-audit`
- `dev-studio-integrations-v2`
- `restore-good-build-0620`
- `restore-working-state`
- `revert-broken-code`

---

## ⚙️ GITHUB ACTIONS WORKFLOWS

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **ci-cd.yml** | push, PR | Main build + test pipeline |
| **deploy-lms.yml** | push (LMS paths) | Deploy to Northflank LMS |
| **deploy-admin.yml** | push (admin paths) | Deploy to Northflank Admin |
| **deploy-production-dispatch.yml** | manual | Full platform deploy |
| **autopilot.yml** | push, PR | AI Builder mode |
| **compliance-gate.yml** | push, PR | Security audit |
| **integrity-gate.yml** | push, PR, daily | Data integrity checks |
| **health-check.yml** | cron (30min) | Runtime health monitoring |
| **predeploy-check.yml** | push, PR | Pre-deploy validation |
| **survival-guard.yml** | push, PR | Reliability checks |
| **dashboard-diagnostics.yml** | push | Diagnostics |
| **lint.yml** | PR | Linting |
| **ci.yml** | push, PR | Basic CI validation |
| **supabase-migrations.yml** | push | DB migrations |
| **supabase-auto-migrate-seed.yml** | push | Auto migrate + seed |
| **db-backup.yml** | cron (daily) | Database backup |
| **cron-scheduler.yml** | cron | Admin cron endpoints |
| **daily-content-generation.yml** | cron | Content gen |
| **scheduled-social-posts.yml** | cron | Social posts |
| **promote-to-production.yml** | manual | Staging → Production |
| **branch-protection.yml** | cron (daily) | Branch cleanup |
| **copyright-monitor.yml** | cron (weekly) | Copyright monitoring |
| **design-policy-enforcement.yml** | push, PR | Design checks |
| **apply-pending-migrations.yml** | manual | Manual migration apply |
| **deployment-notification.yml** | deployment_status | Notify on deploy |

---

## 🔧 NORTHFLANK SCRIPTS

| Script | Function |
|--------|----------|
| **lib.ts** | Shared API helpers |
| **trigger-build.ts** | Start build via API |
| **wait-service.ts** | Poll deployment status |
| **verify-deployed-sha.ts** | Confirm SHA matches |
| **check-status.ts** | Get service status |
| **configure-services.ts** | Configure NF services |
| **patch-ephemeral-storage.ts** | Set 32GB storage |
| **set-service-branch.ts** | Point to branch |
| **trigger-deployment.ts** | Roll out image |
| **verify-health-checks.ts** | Verify /api/ping |
| **deploy-live.ts** | Full deploy |
| **sync-env.ts** | Sync env vars |
| **inspect-services.ts** | Inspect services |
| **configure-domains.ts** | Configure domains |
| **register-domains.ts** | Register domains |
| **create-admin-service.ts** | Create admin |
| **dump-build-storage.ts** | Dump storage |
| **ensure-build-cache.ts** | Ensure cache |
| **audit.ts** | Audit script |
| **audit-public-dns.mjs** | DNS audit |
| **canonical-env.mjs** | Env config |
| **print-cname-targets.ts** | Print CNAMEs |
| **patch-admin-branch-main.ts** | Patch admin branch |
| **service-targets.ts** | Service targets |

---

## 🏗️ NORTHFLANK CONFIGURATION

| Service | ID | Team | Project |
|---------|-----|------|---------|
| LMS | elevate-lms | elevates-team | elevate-platform |
| Admin | elevate-admin | elevates-team | elevate-platform |

### Environment Variables (NF)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
SSN_SALT
NEXTAUTH_SECRET
SESSION_SECRET
RESEND_API_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
OPENAI_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
ONET_API_KEY
CAREERONESTOP_USER_ID
CAREERONESTOP_TOKEN
USAJOBS_API_KEY
DEEPSEEK_API_KEY
GOOGLE_GEMINI_API_KEY
```

---

## 📊 GITHUB RUNS (Last 24h)

### Status Summary
| Status | Count |
|--------|-------|
| success | ~15 |
| failure | ~10 |
| in_progress | 3 |

### Failed Workflows
1. **Autopilot (Builder Mode)** - Builder mode errors
2. **Compliance Gate** - Policy violations
3. **Integrity Gate** - Data integrity issues
4. **CI** - TypeScript/lint errors
5. **Health Check** - Runtime errors

### Passing Workflows
1. **Deploy LMS** - ✅
2. **Deploy Admin** - ✅
3. **Pre-deploy Check** - ✅
4. **Dashboard Diagnostics** - ✅
5. **Survival Guard** - ✅
6. **Design Policy Enforcement** - ✅
7. **Deployment Notifications** - ✅

---

## 🐛 KNOWN ISSUES

### 1. Deprecated Config Options (FIXED)
```javascript
// REMOVED:
experimental: {
  workerThreads: false,  // ❌ Deprecated
  cpus: 4,              // ❌ Deprecated
}
```

### 2. Casing Duplicates (FIXED)
```
components/ui/Badge.tsx ↔ badge.tsx
components/ui/Button.tsx ↔ button.tsx
components/ui/Select.tsx ↔ select.tsx
components/ui/Tabs.tsx ↔ tabs.tsx
components/ui/Checkbox.tsx ↔ checkbox.tsx
components/ui/Label.tsx ↔ label.tsx
components/ui/Input.tsx ↔ input.tsx
components/ui/Card.tsx ↔ card.tsx
```

### 3. Redirect Conflict
```
Duplicate source "/partner-portal" at position 213 and 256
```

### 4. Runtime React Error #130
```
Digest: 2292220114
Error: Element type is invalid (got undefined)
```

---

## 🔄 BUILD FLOW

```
GitHub Push
    ↓
ci-cd.yml (test + build)
    ↓
deploy-lms.yml → Northflank API
    ├── configure-services.ts
    ├── patch-ephemeral-storage.ts
    ├── set-service-branch.ts
    ├── trigger-build.ts
    ├── wait-service.ts
    └── verify-deployed-sha.ts
    ↓
Smoke Test (/api/ping)
    ↓
Dashboard Diagnostics
    ↓
Health Check (30min cron)
```

---

## 📝 COMMITS TODAY

| SHA | Message |
|-----|---------|
| 1e9633112 | fix: remove badge.tsx and button.tsx casing duplicates |
| 0d070d567 | fix: remove duplicate select.tsx and tabs.tsx |
| c2acde997 | fix: remove deprecated workerThreads/cpus |
| 5f59b6834 | fix: restore TestingCart.tsx |
| a033c429c | Merge 7 critical fixes |
| 9b3ea6828 | fix: cherry-pick 7 critical fixes from Admin |
| 29476ff2e | Merge: 7 critical fixes for LMS |
| 7177d8500 | fix: cherry-pick 7 critical fixes |
| 3d9223bec | disable lint in build |
| 52d8e6f8a | fix: remove remaining placeholder='blur' |
| 2df4dfa0f | fix: remove placeholder='blur' |

---

## 🎯 KEY FILES

| Path | Purpose |
|------|---------|
| `next.config.mjs` | Next.js configuration |
| `Dockerfile.northflank-lms` | Docker build |
| `Dockerfile.northflank-admin` | Admin Docker |
| `package.json` | Dependencies & scripts |
| `pnpm-lock.yaml` | Lock file |
| `pnpm-workspace.yaml` | Workspace config |
| `scripts/northflank/*` | NF deployment scripts |

---

*Generated: 2026-06-21T16:00 UTC*
