# Workflow Duplicate Audit Report

## Summary
**Total Workflows:** 26  
**Unique Purpose Workflows:** 18  
**Duplicate/Similar Workflows:** 8 pairs identified

---

## DUPLICATE WORKFLOW ANALYSIS

### 1. CI/CD Workflows (3 similar)

| File | Purpose | Recommendation |
|------|---------|----------------|
| `ci.yml` | Simple lint on PR | **DEPRECATE** - Use ci-cd.yml |
| `ci-cd.yml` | Full pipeline with build, test, typecheck | **KEEP** |
| `build.yml` | Multi-container build | **KEEP** - Different purpose |

**Recommendation:** Mark `ci.yml` as deprecated, it overlaps with ci-cd.yml

---

### 2. Compliance & Security (2 similar)

| File | Purpose | Recommendation |
|------|---------|----------------|
| `compliance-gate.yml` | Security audit, npm audit | **MERGE** into integrity-gate.yml |
| `integrity-gate.yml` | Pre-auth checks, migration lint, daily run | **KEEP** (more comprehensive) |

**Recommendation:** Merge compliance-gate.yml content into integrity-gate.yml

---

### 3. Deployment Workflows (3 similar patterns)

| File | Purpose | Recommendation |
|------|---------|----------------|
| `deploy-marketing.yml` | Deploy www site | **KEEP** |
| `deploy-lms.yml` | Deploy LMS app | **KEEP** |
| `deploy-admin.yml` | Deploy admin app | **KEEP** |

**Status:** ✅ These are intentionally separate for different apps

---

### 4. Health Check Workflows (2 similar)

| File | Purpose | Recommendation |
|------|---------|----------------|
| `health-check.yml` | Northflank health verification | **MERGE** into deploy-*.yml as post-deploy step |
| `dashboard-diagnostics.yml` | Comprehensive diagnostics | **KEEP** - Different scope |

**Recommendation:** Extract health-check.yml into a reusable action, call from deploy workflows

---

### 5. Migration Workflows (2 overlapping)

| File | Purpose | Recommendation |
|------|---------|----------------|
| `supabase-migrations.yml` | Manual migration trigger | **KEEP** |
| `supabase-auto-migrate-seed.yml` | Auto migrate + seed | **KEEP** |
| `apply-pending-migrations.yml` | Apply pending migrations | **DEPRECATE** - Duplicates supabase-migrations.yml |

**Recommendation:** Mark `apply-pending-migrations.yml` as deprecated

---

## CONSOLIDATION PLAN

### Phase 1: Remove True Duplicates
- [ ] Delete `ci.yml` (ci-cd.yml covers this)
- [ ] Delete `apply-pending-migrations.yml` (covered by supabase-migrations.yml)

### Phase 2: Merge Related Workflows  
- [ ] Merge `compliance-gate.yml` into `integrity-gate.yml`
- [ ] Create reusable action for `health-check.yml`

### Phase 3: Cleanup
- [ ] Update deploy workflows to call shared health check
- [ ] Update documentation

---

## RECOMMENDED FINAL WORKFLOW LIST (18 workflows)

### CI/CD (2)
- `ci-cd.yml` - Main pipeline (merged ci.yml)
- `build.yml` - Multi-container build

### Deployment (4)
- `deploy-marketing.yml`
- `deploy-lms.yml`
- `deploy-admin.yml`
- `promote-to-production.yml`

### Database (2)
- `supabase-migrations.yml`
- `supabase-auto-migrate-seed.yml`
- `db-backup.yml`

### Quality & Compliance (3)
- `integrity-gate.yml` (merged compliance-gate.yml)
- `branch-protection.yml`
- `design-policy-enforcement.yml`

### Monitoring (3)
- `dashboard-diagnostics.yml`
- `deployment-notification.yml`
- `survival-guard.yml`

### Content & Automation (3)
- `cron-scheduler.yml`
- `daily-content-generation.yml`
- `scheduled-social-posts.yml`

### Utility (1)
- `autopilot.yml`
- `copyright-monitor.yml`
- `predeploy-check.yml`
- `deploy-production-dispatch.yml`

---

## WORKFLOW NAMING CONVENTION

Recommend standardizing naming:
```
<action>-<target>-.yml

Examples:
- ci-cd.yml (not ci.yml)
- deploy-lms.yml
- deploy-marketing.yml
- deploy-admin.yml
- db-migrate.yml
- db-backup.yml
- quality-gate.yml
```
