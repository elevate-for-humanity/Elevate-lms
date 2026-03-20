# Enrollment State Policy

> **Version:** 1.0 — May 2026
> **Owner:** Operations / Engineering
> **Status:** Active

---

## 1. Enrollment State Definitions

| State | `enrollment_state` | `status` | LMS Access | Description |
|---|---|---|---|---|
| Applied | `applied` | `pending_approval` | None | Application submitted, awaiting admin review |
| Pending Funding Verification | `pending_funding_verification` | `pending_funding_verification` | None | Enrolled via instant-access flow; funding source not yet confirmed |
| Onboarding | `onboarding` | `active` | Full | Funding verified or payment confirmed; student completing orientation |
| Active | `active` | `active` | Full | Actively progressing through coursework |
| Orientation | `orientation` | `active` | Full | In orientation phase |
| Revoked | `revoked` | `revoked` | None | Enrollment terminated (non-payment, policy violation, or SLA expiry) |

---

## 2. State Transition Rules

```
applied
  |-- pending_funding_verification  (instant-access flow, no payment)
  |-- onboarding                    (admin approves + payment confirmed)

pending_funding_verification
  |-- onboarding   (admin verifies funding via /admin/funding-verification)
  |-- revoked      (admin rejects, or 14-day SLA expires with no contact)

onboarding
  |-- active       (student completes orientation)
  |-- revoked      (admin action)

active
  |-- revoked      (admin action)
```

DB CHECK constraint enforcing valid values:

```sql
CHECK (enrollment_state IN (
  'applied',
  'pending_funding_verification',
  'onboarding',
  'orientation',
  'active',
  'revoked'
))
```

---

## 3. Required Actions Per Funding Path

### 3a. Self-Pay (Stripe)

1. Student pays via Stripe Checkout.
2. Stripe fires `checkout.session.completed` webhook.
3. Webhook handler upserts a row into `stripe_sessions_staging` with `payment_status = 'paid'`.
4. `enroll_application` RPC verifies the staging row before creating any enrollment record.
5. Enrollment is created directly in `onboarding` state with `funding_verified = true`.

**Admin action required:** None.

---

### 3b. Employer / Third-Party Funding

1. Student submits application with `funding_source = 'employer'`.
2. Admin reviews supporting documentation (PO, letter of intent, etc.).
3. Admin navigates to `/admin/funding-verification` and clicks **Verify**.
4. `verifyFunding()` server action:
   - Sets `enrollment_state = 'onboarding'`, `status = 'active'`
   - Sets `funding_verified = true`, `funding_verified_at`, `funding_verified_by`
   - Resolves the `payment_integrity_flags` row
   - Writes `audit_logs` entry with `action = 'funding.verified'`
5. Student gains full LMS access immediately.

**SLA:** 14 days from enrollment date.

---

### 3c. Workforce / Grant Funding (e.g., WorkOne Indiana)

1. Student submits application with `funding_source = 'workforce'`.
2. Admin coordinates with the funding agency to confirm authorization.
3. Same verification flow as 3b once authorization is received.

**SLA:** 14 days from enrollment date.

---

### 3d. Instant-Access Legacy Cohort (Feb 22 – Mar 10 2026)

- 36 students enrolled via a temporary instant-access flow with no payment and no application record.
- None had logged in or completed any lessons as of May 2026.
- All 36 moved to `pending_funding_verification` via migration `20260503000013`.
- Re-engagement emails sent May 2026 with Indiana-specific funding guidance.
- Must be resolved via the admin queue or SLA escalation before any LMS access is granted.

---

## 4. LMS Access Gates

Routes that enforce the `pending_funding_verification` block:

| Route | Behavior | HTTP Status |
|---|---|---|
| `POST /api/lessons/[lessonId]/complete` | Returns error before recording progress | 403 |
| `POST /api/certificates/generate` | Returns error before generating PDF | 403 |
| `GET /learner/dashboard` | Shows status banner; auto-repair fires if Stripe shows paid | N/A |
| `POST /api/system/reconcile-payment` | Self-healing: checks Stripe live, repairs missing enrollment | 200 / 409 |

The learner dashboard does not block page load — it shows a banner explaining the student's status and next steps. All lesson and certificate API calls are blocked server-side.

---

## 5. Admin Funding Verification Queue

**URL:** `/admin/funding-verification`

**Access:** `admin`, `super_admin`, `staff` roles (enforced server-side).

### Queue Columns

| Column | Source |
|---|---|
| Student name / email | `profiles` joined via `v_funding_verification_queue` |
| Program | `courses.title` |
| Enrolled date | `program_enrollments.created_at` |
| SLA status | Computed: `on_track` / `at_risk` (≤3 days) / `overdue` |
| Days remaining | Computed (negative = overdue) |

### Admin Actions

| Action | Effect |
|---|---|
| **Verify** | Moves enrollment to `onboarding`, sets `funding_verified = true`, resolves integrity flag, writes audit log |
| **Reject** | Moves enrollment to `revoked`, resolves integrity flag, writes audit log |
| **Note** | Attaches free-text note to the Verify or Reject action (stored in audit log and integrity flag resolution) |

---

## 6. SLA Escalation Cron

**Endpoint:** `GET /api/cron/funding-escalation`

**Auth:** `Authorization: Bearer <CRON_SECRET>` (env var `CRON_SECRET` must be set).

**Schedule:** Daily.

**Behavior:**

1. Calls `escalate_overdue_funding_verifications()` Postgres function.
2. That function finds all `pending_funding_verification` enrollments where `created_at < now() - interval '14 days'`, inserts a row into `funding_verification_escalations` for each, and returns the count.
3. Cron endpoint logs the count to `webhook_health_log`.
4. Returns `{ ok: true, escalated: N, timestamp: "..." }`.

**External cron call:**

```
GET https://www.elevateforhumanity.org/api/cron/funding-escalation
Authorization: Bearer <CRON_SECRET>
```

---

## 7. Payment Integrity Monitoring

**Endpoint:** `GET /api/admin/webhook-health`

Returns:

```json
{
  "paid_not_enrolled": 0,
  "enrolled_not_paid": 0,
  "open_integrity_flags": 36,
  "webhook_events_last_24h": 12,
  "unprocessed_events": 0
}
```

**Views:**

| View | Purpose |
|---|---|
| `v_paid_not_enrolled` | Stripe sessions with `payment_status = 'paid'` but no matching enrollment |
| `v_enrolled_not_paid` | Active enrollments with no Stripe payment and `funding_verified = false` |
| `v_funding_verification_queue` | All `pending_funding_verification` enrollments with SLA status |

**Expected steady-state:**

- `v_paid_not_enrolled`: 0 — any non-zero value requires immediate investigation
- `v_enrolled_not_paid`: 0 — non-zero indicates a potential revenue leak
- `open_integrity_flags`: decreasing toward 0 as the 36 legacy students are resolved

---

## 8. Runbook

### Student contacts admin with proof of funding

1. Open `/admin/funding-verification`.
2. Locate the student.
3. Click **Note**, enter the funding source and reference number.
4. Click **Verify**.
5. Student immediately gains full LMS access.
6. Confirm in audit log: `action = 'funding.verified'`.

### Student cannot secure funding

1. Open `/admin/funding-verification`.
2. Locate the student.
3. Click **Note**, enter reason for rejection.
4. Click **Reject**.
5. Enrollment moves to `revoked`. Student loses all access.

### Student does not respond within 14 days

- The daily cron job automatically escalates the enrollment.
- An escalation record is created in `funding_verification_escalations`.
- Admin should review escalations and decide whether to extend the SLA or revoke.
- To revoke: use the **Reject** action in the queue.

---

## 9. Changelog

| Date | Change | Migration / Ref |
|---|---|---|
| 2026-05-03 | Added `pending_funding_verification` enrollment state with DB constraint | `20260503000013` |
| 2026-05-03 | Created `stripe_sessions_staging` and payment integrity views | `20260503000010` |
| 2026-05-03 | Created `payment_integrity_flags`; flagged 36 legacy enrollments | `20260503000011` |
| 2026-05-03 | Hardened `enroll_application` RPC with Stripe staging check | `20260503000012` |
| 2026-05-03 | Fixed Stripe webhook (`withApiAudit` re-throw bug) | Code |
| 2026-05-03 | Added LMS access gates to lesson complete and certificate generate routes | Code |
| 2026-05-03 | Built admin funding verification queue (`/admin/funding-verification`) | Code |
| 2026-05-03 | Added SLA escalation cron (`/api/cron/funding-escalation`) | Code |
