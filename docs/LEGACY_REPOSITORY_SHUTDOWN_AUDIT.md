# LEGACY REPOSITORY SHUTDOWN AND DEPENDENCY AUDIT
## Repository: elevateforhumanity/next-platform-starter

**Audit Date:** 2026-07-16
**Audited By:** OpenHands Agent
**Current SHA:** 632bd11 (unknown content)

---

## EXECUTIVE SUMMARY

**STATUS: CRITICAL RISK - IMMEDIATE ACTION REQUIRED**

The `next-platform-starter` repository has **FULL PRODUCTION ACCESS** and can:
- Deploy to `elevate-admin` and `elevate-lms` Northflank services
- Access `elevate-platform` project
- Use production Supabase credentials
- Use production Stripe keys
- Run 8 scheduled workflows automatically

---

## 1. SCHEDULED WORKFLOWS (CRITICAL)

| Workflow | Schedule | Risk | Action |
|----------|----------|------|--------|
| `scheduled-social-posts.yml` | Weekdays 2:23 PM UTC | MEDIUM | DISABLE |
| `health-check.yml` | Every 30 minutes | **HIGH** | DISABLE |
| `cron-scheduler.yml` | 8 AM, 8 PM UTC | **HIGH** | DISABLE |
| `integrity-gate.yml` | 6 AM UTC | MEDIUM | DISABLE |
| `daily-content-generation.yml` | 9:17 AM UTC | MEDIUM | DISABLE |
| `db-backup.yml` | 7:11 AM UTC | HIGH | DISABLE |
| `copyright-monitor.yml` | Monday 9 AM UTC | LOW | DISABLE |
| `branch-protection.yml` | 2 AM UTC | LOW | DISABLE |

**The health-check running every 30 minutes against production could be contributing to errors.**

---

## 2. PRODUCTION SECRETS ATTACHED

The legacy repository contains **27 secrets** referencing production:

### Database
- `SUPABASE_URL`
- `SUPABASE_PROJECT_REF`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_ID`
- `SUPABASE_MANAGEMENT_API_KEY`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_URL`
- `SUPABASE_DB_PASSWORD`

### Payments
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Northflank
- `NORTHFLANK_API_TOKEN`
- `NORTHFLANK_TEAM_ID`
- `NORTHFLANK_PROJECT_ID` (= `elevate-platform`)
- `NORTHFLANK_ADMIN_SERVICE_ID` (= `elevate-admin`)
- `NORTHFLANK_LMS_SERVICE_ID` (= `elevate-lms`)

### Email
- `RESEND_API_KEY`

### Other
- `SLACK_WEBHOOK`
- `SLACK_WEBHOOK_URL`
- `OPENAI_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `USAJOBS_API_KEY`
- `ONET_API_KEY`
- `CAREERONESTOP_TOKEN`
- `CAREERONESTOP_USER_ID`

**ALL OF THESE should be REMOVED or ROTATED.**

---

## 3. DEPLOYMENT WORKFLOWS

| Workflow | Target | Can Deploy? |
|----------|--------|------------|
| `deploy-admin.yml` | `elevate-admin` | YES - CAN OVERWRITE |
| `deploy-lms.yml` | `elevate-lms` | YES - CAN OVERWRITE |
| `deploy-production-dispatch.yml` | Unknown | YES |

**These can deploy OLD CODE (SHA 632bd11) to production!**

---

## 4. NORTHFLANK CONFLICT RISK

Both repositories deploy to the same Northflank services:

| Service | Elevate-lms | next-platform-starter |
|---------|-------------|---------------------|
| `elevate-admin` | ✅ Current | ❌ OLD CODE |
| `elevate-lms` | ✅ Current | ❌ OLD CODE |
| Project | `elevate-platform` | `elevate-platform` |

**If next-platform-starter deploys, it overwrites Elevate-lms code!**

---

## 5. MIGRATION RISK

The legacy repo has:
- `supabase-migrations.yml` - can run migrations
- `supabase-auto-migrate-seed.yml` - can seed data
- `apply-pending-migrations.yml` - can apply pending

**These could modify the production database schema.**

---

## 6. SOCIAL POSTING

**File:** `.github/workflows/scheduled-social-posts.yml`
**Script:** `scripts/publish-scheduled-social-posts.mjs`

This workflow posts to social media. If Elevate-lms has its own social posting, there will be **duplicate posts**.

---

## 7. COMPARISON WITH ELEVATE-LMS

| Feature | Elevate-lms | next-platform-starter |
|---------|-------------|---------------------|
| Social Posting | Unknown if implemented | ✅ Has scheduled-social-posts.yml |
| Cron Scheduler | ✅ | ✅ (duplicate) |
| Health Check | ✅ | ✅ (duplicate, every 30 min) |
| DB Backup | Unknown | ✅ (could conflict) |
| Integrity Gate | ✅ | ✅ (duplicate) |
| Deploy Admin | ✅ | ✅ (CAN OVERWRITE) |
| Deploy LMS | ✅ | ✅ (CAN OVERWRITE) |

---

## 8. REQUIRED ACTIONS

### IMMEDIATE (Before Any Other Work)

1. **Delete all scheduled triggers** in next-platform-starter:
   - `scheduled-social-posts.yml`
   - `health-check.yml`
   - `cron-scheduler.yml`
   - `integrity-gate.yml`
   - `daily-content-generation.yml`
   - `db-backup.yml`
   - `copyright-monitor.yml`
   - `branch-protection.yml`

2. **Remove production secrets** from next-platform-starter GitHub secrets

3. **Disable deploy workflows** or add `if: false` guard

### AFTER DISABLING

4. Compare migrations between repos
5. Verify Elevate-lms has all required automation
6. Archive or delete next-platform-starter

---

## 9. CURRENT ELEVATE-LMS STATUS

From Elevate-lms repository:

| Check | Status |
|-------|--------|
| elevat-platform reference | ✅ Correct |
| Deploy workflows | ✅ Point to correct services |
| Secrets | ✅ Separate repo secrets |
| Scheduled workflows | ✅ Only in Elevate-lms |

**Elevate-lms is NOT connected to next-platform-starter.**

---

## 10. FINAL VERDICT

| # | Question | Answer |
|---|----------|--------|
| 1 | Was next-platform-starter still active? | **YES - 8 scheduled workflows** |
| 2 | Which workflows were running? | Social posts, health-check (30min), cron, integrity, content, backup, copyright, branch protection |
| 3 | Was it connected to production? | **YES - Full access to elevate-platform, Supabase, Stripe** |
| 4 | Which secrets were attached? | **27 production secrets** |
| 5 | Were schedules disabled? | **NO - Currently active** |
| 6 | Were credentials removed? | **NO - Still attached** |
| 7 | Was required code migrated? | **UNKNOWN** |
| 8 | Is Elevate-lms the only production source? | **NO - next-platform-starter can also deploy** |
| 9 | Can legacy repo still deploy/automate? | **YES - Full capability** |
| 10 | Is it safe to archive? | **NO - Must disable first** |

---

## RECOMMENDED IMMEDIATE ACTIONS

1. Go to https://github.com/elevateforhumanity/next-platform-starter/settings/secrets/actions
2. Delete ALL production secrets
3. Go to Actions tab → Delete all workflow runs
4. Edit each workflow file, add `if: ${{ false }}` at top
5. Or delete the entire `.github/workflows/` content
6. Verify Northflank is only accepting builds from Elevate-lms

**This repository is a security risk and should be disabled immediately.**
