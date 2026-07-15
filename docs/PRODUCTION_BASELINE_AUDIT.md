# Production Baseline Audit

**Date:** 2026-07-02
**Branch:** main
**Commit SHA:** 8fed37cdf14273c445e9c72066f61acbe926b4fe
**Last Commit:** fix: prevent duplicate Northflank builds for same SHA

## Repository Stats

| Metric | Count |
|--------|-------|
| Total Page Routes | 517 |
| API Routes | 1093 |
| Components | ~800+ |
| Total Files | 2000+ |

## CI/CD Pipeline Analysis

### Workflows Triggering on Push to Main

| Workflow | Trigger | Purpose | Build? |
|----------|---------|---------|--------|
| CI/CD Pipeline | main push | Build + Test | YES |
| Deploy LMS | main + paths | Deploy LMS | YES (Northflank) |
| Deploy Admin | main + paths | Deploy Admin | YES (Northflank) |
| Deploy Marketing | main + paths | Deploy Marketing | YES (Northflank) |
| Dashboard Diagnostics | main | Diagnostics | NO |
| Integrity Gate | main + daily | Security | NO |
| Pre-deploy Check | main | Validation | NO |
| Compliance Gate | main | Compliance | NO |
| Design Policy | TSX changes | Design | NO |
| Survival Guard | main | Reliability | NO |
| Autopilot | main | Builder | NO |

### Issue: Duplicate Builds

**Problem:** CI/CD Pipeline builds, then Deploy LMS/Admin/Marketing all rebuild independently.
**Fix Applied:** SHA deduplication in trigger-build.ts

## Workflow Concurrency Groups

| Workflow | Concurrency Group | Cancel In Progress |
|----------|-------------------|-------------------|
| CI/CD Pipeline | ci-cd-ref | YES |
| Deploy LMS | northflank-lms-deploy | YES |
| Deploy Admin | northflank-admin-deploy | YES |
| Deploy Marketing | northflank-marketing-deploy | YES |
| Dashboard Diagnostics | - | NO |
| Pre-deploy Check | predeploy-ref | YES |
| Compliance Gate | compliance-ref | YES |

## Build Commands

```bash
# LMS Build
pnpm run build:lms:phased

# Admin Build  
pnpm run build:admin

# Full Build
pnpm next build
```

## Environment Variables Required

| Variable | Purpose |
|----------|---------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon key |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role |
| STRIPE_SECRET_KEY | Stripe API key |
| STRIPE_WEBHOOK_SECRET | Stripe webhook secret |
| NEXTAUTH_SECRET | NextAuth secret |
| SESSION_SECRET | Session secret |
| OPENAI_API_KEY | OpenAI API key |
| RESEND_API_KEY | Email service |

## Runtime Configuration

| Setting | Value |
|---------|-------|
| Node Memory | --max-old-space-size=6144 |
| Source Maps | GENERATE_SOURCEMAP=false |
| Telemetry | NEXT_TELEMETRY_DISABLED=1 |

## Northflank Services

| Service | Service ID | Dockerfile |
|---------|------------|------------|
| LMS | elevate-lms | Dockerfile.northflank-lms |
| Admin | elevate-admin | Dockerfile.northflank-admin |
| Marketing | elevate-marketing | Dockerfile.marketing |

## TODO

- [ ] Complete CI build verification
- [ ] Verify no duplicate builds after SHA dedup
- [ ] Test all critical routes
- [ ] Verify Supabase connectivity
- [ ] Verify Stripe integration
- [ ] Run accessibility audit
- [ ] Check broken links
