# Elevate LMS — System Changelog

Active record of system integrity, enforcement, and platform changes.

---

## 2026-03-19 — Enrollment Write-Path Integrity

**Area:** Enrollment / Database Integrity / Audit

Introduced `enrollment_insert_audit` to record provenance of every `program_enrollments` insert.

- Captures: `db_user`, `pg_session_user`, `via_rpc`, `timestamp`
- `via_rpc=true` — insert originated from `enroll_application` RPC (SECURITY DEFINER)
- `via_rpc=false` — direct write (service_role or non-RPC paths)

Added integrity audit check: `PRIVILEGED_BYPASS_DETECTED` surfaced in `/api/admin/applications/health`.

**Impact:** All enrollment writes are attributable. Direct DB writes are no longer silent.

**Risk closed:** Undetected integrity violations from privileged write paths.

**Remaining exposure (explicit):** Bypass still exists by design. Now monitored, not prevented.

---

## 2026-03-19 — Payment Integrity Gate

**Area:** Enrollment / Payments / Funding

Hardened `enroll_application` RPC to enforce payment/funding coupling. Valid enrollment requires one of:

- `funding_verified = true`
- `has_workone_approval = true`
- Valid paid Stripe session (`kind IN ('full','bnpl')`)

Added:
- `stripe_sessions_staging` — authoritative Stripe sync layer
- Views: `v_paid_not_enrolled`, `v_enrolled_not_paid`
- `payment_integrity_flags` for anomaly tracking

**Impact:** No enrollment without verified financial backing.

**Risk closed:** Phantom enrollments, unpaid access, inconsistent payment states.

---

## 2026-03-19 — Funding Verification Gate

**Area:** LMS Access / Compliance

Introduced `pending_funding_verification` as a blocking state.

System behavior:
- Lesson completion → 403
- Certificate generation → 403

Admin interface:
- `/admin/funding-verification` queue with SLA tracking
- Actions: Verify, Reject, Note
- Daily escalation via cron (`funding-escalation`)

**Impact:** Students cannot progress or certify until funding is validated.

**Risk closed:** Unverified or fraudulent funding leading to credential issuance.

---

## 2026-03-19 — LMS Readiness Gate

**Area:** Enrollment / Content Integrity

`enroll_application` now fails with `LMS_NOT_READY` unless:

- Program is bound (`apprenticeship_programs`)
- Active course exists (`training_courses`)
- Published lessons exist (`curriculum_lessons`)
- All scoped to `program_id`

**Impact:** No enrollment into incomplete or misconfigured programs.

**Risk closed:** Students entering empty or invalid LMS environments.

---

## 2026-03-19 — State Machine Enforcement Alignment

**Area:** Applications / Enrollment Flow

Corrected mismatch between RPC logic and DB trigger. Canonical transition enforced:

```
review → approved → ready_to_enroll → enrolled
```

Removed invalid direct transition: `approved → enrolled` (blocked).

**Impact:** All enrollment flows match DB-level enforcement.

**Risk closed:** Silent failures and inconsistent application states.

---

## 2026-03-19 — Schema-Level Enrollment Guarantees

**Area:** Database / Structural Integrity

Applied hard constraints to `program_enrollments`:

- `program_id NOT NULL`
- FK → `apprenticeship_programs(id)` ON DELETE RESTRICT
- `UNIQUE(user_id, program_id)`

Trigger blocks direct inserts (`DIRECT_INSERT_BLOCKED`) unless via privileged roles.

**Impact:** Invalid or duplicate enrollments cannot exist at the database level.

**Risk closed:** Structural corruption of enrollment records.

---

## 2026-03-19 — Revocation Consistency

**Area:** LMS Access / Authorization

All reads on `program_enrollments` now require `revoked_at IS NULL`. Revoked users are invisible to LMS access, dashboards, certification, and reporting. Re-enrollment allowed after revocation.

**Impact:** Revocation is a hard access boundary, not advisory.

**Risk closed:** Revoked users retaining system access.

---

## 2026-03-19 — LMS Access Gates (Runtime)

**Area:** API / Access Control

Endpoints enforcing enrollment validity:
- `POST /api/lessons/[lessonId]/complete`
- `POST /api/certificates/generate`

Return 403 if `pending_funding_verification` or invalid enrollment state.

**Impact:** Access enforcement is consistent across runtime surfaces.

**Risk closed:** Bypassing LMS rules via direct API calls.

---

## 2026-03-19 — Payment System Reconciliation

**Area:** Payments / Data Integrity

Audit results:
- `v_paid_not_enrolled` = 6 — all identified as license purchases or test transactions, no real student impact
- 41 enrollments created outside valid payment paths — moved to `pending_funding_verification`, not revoked (preserved real student access pending review)

**Impact:** All payment inconsistencies identified and classified.

**Risk closed:** Unknown payment/enrollment mismatches.

---

## 2026-03-19 — Admin Funding Verification Queue

**Area:** Admin / Compliance Ops

- SLA-based verification queue
- Audit logging on all admin actions
- Escalation via scheduled job
- Webhook health logging

**Impact:** Compliance workflow is systematized, not manual.

**Risk closed:** Untracked or delayed funding verification.

---

## 2026-03-19 — UI and Media Integrity Lockdown

**Area:** Frontend / UX Integrity

Introduced invariant enforcement:
- `CanonicalVideo` — no autoplay abuse, controlled playback
- `CanonicalHero`, `HeroMediaFrame` — no text or CTAs on video frames
- Prebuild scripts blocking: raw `<video>`, invalid autoplay, empty alt text, remote image violations
- `lib/hero-video-audit.ts` — dev-time validator wired into both canonical hero components

**Impact:** UI cannot regress into non-compliant patterns.

**Risk closed:** UX inconsistencies and accessibility violations.

---

## 2026-03-19 — Stripe Webhook Registration

**Area:** Payments / Infrastructure

Registered canonical webhook endpoint in Stripe (`we_1TCt2JH4a2yrVOt56sqWmOKR`):
- URL: `https://www.elevateforhumanity.org/api/webhooks/stripe`
- Events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, subscription lifecycle, `invoice.payment_succeeded`, `invoice.payment_failed`, `charge.refunded`
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` set in Netlify production environment

**Impact:** Stripe events now reach the canonical handler. Payment webhooks were previously unregistered.

**Risk closed:** Silent payment failures, missed enrollment triggers, unverified webhook payloads.

---

## Current System Posture

| Area | State |
|------|-------|
| Enrollment boundary | Strictly enforced |
| Payment coupling | Required |
| LMS readiness | Validated at enrollment |
| Revocation | Hard enforced |
| Privileged bypass | Allowed, observable, logged |
| Audit surface | Active and queryable |
| Stripe webhook | Registered and verified |

---

## Known Exception — Privileged Enrollment Bypass

Direct writes via `service_role` remain possible. All such events are logged, surfaced in `/api/admin/applications/health`, and classified as `PRIVILEGED_BYPASS_DETECTED`.

**Status:** Intentional escape hatch with monitoring. Not eliminated.

**Tracked in:** Issue #54 (upstream gate in `approve.ts`)

---

## Declared Next Direction

- Move from observability → enforcement on bypass path
- Add upstream gate in `approve.ts`: programs with `has_lms_course=true` must have an active `training_courses` row before enrollment is created
- Introduce alerting + SLA for integrity violations
- Continue tightening RPC as single source of truth for enrollment writes
