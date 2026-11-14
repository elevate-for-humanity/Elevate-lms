# Production Activation — Enterprise Readiness (May 2026)

Companion to `docs/platform-e2e-audit-2026-05.md`. Use this checklist before declaring **full production** and targeting **10,000+ concurrent users**.

## Automated gate (run on every release candidate)

```bash
bash scripts/production-readiness-gate.sh
pnpm test
pnpm lint
NODE_OPTIONS='--max-old-space-size=8192' pnpm typecheck
```

Post-deploy smoke (replace host):

```bash
curl -sf "https://www.elevateforhumanity.org/api/ready" | jq .
curl -sf "https://www.elevateforhumanity.org/api/health" | jq '.activation, .status'
```

`/api/ready` returns **503** if critical env or DB is down — use for readiness probes.  
`/api/health` returns **500** only on hard failures (missing env, disabled audit triggers).

---

## Activation matrix

| Workstream | Target state | Verification |
|------------|--------------|--------------|
| **Apply** | Intake → `applications` row | Submit test application; admin queue shows row; no `mirror_failed` in normal prod |
| **Enroll** | Stripe → `program_enrollments` | Self-pay checkout E2E; webhook idempotency in `stripe_webhook_events` |
| **Train** | LMS lessons + checkpoints | Complete lesson; `lesson_progress` + `checkpoint_scores` rows |
| **Credential** | Certificate + verify URL | All checkpoints pass → `program_completion_certificates` |
| **Employer** | Jobs, hours, matches | Employer login; post job; hours API; matches require auth |
| **Admin** | Approve, blast, export | `apiRequireAdmin` + `auth.error` on all admin APIs (`audit-api-auth-guards.sh`) |
| **Security** | No public PII docs | `documents` bucket uses signed URLs only |
| **Scale** | Rate limits + Redis | Upstash configured; monitor fail-open on `lib/api/withRateLimit.ts` |
| **Ops** | Cron + DR | `CRON_SECRET` crons healthy; Supabase PITR documented |

---

## 10k-user scale requirements

1. **Database** — Supabase plan sized for connection pool; indexes on `program_enrollments(user_id, program_id)`, `applications(status, submitted_at)`.
2. **Northflank** — Separate `elevate-lms` + `elevate-admin` services; health on `/api/ping`; LMS readiness on `/api/ready`.
3. **CDN** — Static assets via Northflank + Supabase Storage; `revalidate-public` cron after catalog changes.
4. **Webhooks** — Single Stripe endpoint; `stripe_webhook_events` dedup (no duplicate enrollments).
5. **Enrollment writes** — **Only** `createOrUpdateEnrollment()` in `lib/enrollment-service.ts` (no stray `.insert()` on `program_enrollments`).
6. **Observability** — Sentry DSN in Northflank env; alert on health 500, webhook failures, audit_failure_count.

---

## Honest production_ready flag

As of this activation pass, `GET /api/health` sets:

- `activation.ready_for_traffic` — `true` only when env + DB pass and no critical audit trigger failure.
- `production_ready` — same boolean (legacy field name preserved for monitors).

Removed: hardcoded "10/10" marketing strings and fake `verification` booleans.

---

## Remaining human steps (cannot be code-only)

| Step | Owner |
|------|--------|
| Apply pending Supabase migrations (intake RLS, buckets) | DBA / admin |
| Load test (k6): intake, login, checkout, lesson complete | DevOps |
| Stripe live mode + webhook secret rotation | Finance / DevOps |
| WIOA export sign-off with state reporting team | Compliance |
| 30-day burn-in: on-call rotation + weekly `production-readiness-gate.sh` | Engineering |

---

## Definition of done — “full production”

- [ ] Student self-pay path works without manual DB fixes  
- [ ] Employer portal auth on all critical APIs  
- [ ] `bash scripts/audit-api-auth-guards.sh` exits 0 on `main`  
- [ ] `/api/ready` returns 200 on Northflank LMS readiness probe  
- [ ] No `getPublicUrl` on private `documents` uploads in enrollment/cert paths  
- [ ] Load test: 10k virtual users with &lt;1% error rate on apply + health endpoints  

When all boxes are checked, the platform meets **enterprise activation** for public launch at scale.
