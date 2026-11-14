# Platform End-to-End Audit — May 2026

Evidence-based audit of forms, RBAC, payments, LMS, testing center, security, observability, DR, and workforce reporting. Use with `bash scripts/audit-auth-gaps.sh`, `bash scripts/audit-env-vars.sh`, and `node scripts/audit-public-html.mjs`.

## Executive summary

| Area | Status | Blocker for unmanned 30-day ops? |
|------|--------|----------------------------------|
| Application → enrollment → training → credential | **Partial** — Stripe webhook + `program_enrollments` + LMS completion chain exist; intake mirror and manual admin steps break automation | Yes |
| Form success UX | **Gaps** — intake returns `success: true` with `mirror_failed`; several actions ignore DB errors | Yes |
| API RBAC | **Gaps** — ~40 routes call `apiRequireAdmin` without `if (auth.error) return auth.error` | Yes |
| Payments | **Mostly wired** — canonical path `/api/programs/enroll/checkout` + Stripe webhook; orphan `ProgramEnrollment.tsx` / missing `kind` on legacy checkout | Medium |
| Testing center | **Admin API exists** — `app/api/admin/testing-center/route.ts`; learner scheduling depends on live DB + exam authorizations | Medium |
| Workforce exports | **Partial** — applicants export, certifications export; gaps on compliance/WIOA unified export; `/api/provider/export` documented but no route file | Medium |
| Security | **Review** — private `documents` bucket `getPublicUrl` in some upload paths; service role must stay server-only | Yes |
| DR / backups | **Weak** — `scripts/rollback-migration.sh` without rollback SQL; schema backup script LMS-only | Yes |
| Observability | **Partial** — `withApiAudit`, `lib/logger`; trace IDs / Sentry context not uniform on all critical paths | Medium |
| Mobile / a11y | **CI gate** — axe in `.github/workflows/compliance-gate.yml`; page-by-page remediation ongoing | Low |


## Production activation (scale / 10k users)

See **`docs/production-activation-2026-05.md`** and run `bash scripts/production-readiness-gate.sh`.

---
