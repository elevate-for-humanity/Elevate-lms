# Enrollment Funding States — Operational Policy

**Last updated:** 2026-05-03  
**Applies to:** `program_enrollments.enrollment_state`, `payment_integrity_flags`, admin reporting

---

## State Definitions

### Normal progression

```
applied → approved → confirmed → orientation_complete → documents_complete → active
```

| State | Meaning | LMS Access |
|---|---|---|
| `applied` | Application submitted, not yet reviewed | No |
| `approved` | Admin approved, awaiting student confirmation | No |
| `confirmed` | Student confirmed, pre-orientation | No |
| `orientation_complete` | Orientation done, awaiting documents | No |
| `documents_complete` | Documents uploaded, under review | No |
| `active` | Fully cleared — payment confirmed, documents verified | Yes |

### Lateral holding states

| State | Meaning | LMS Access | Resolution path |
|---|---|---|---|
| `pending_funding_verification` | Provisionally admitted; source-of-funds not confirmed | **Yes (provisional)** | Admin confirms payment → move to `active`; or revoke |
| `enrolled` | Legacy / direct-insert rows; treated as active unless flagged | Yes | Migrate to `active` or flag |

### Terminal states

| State | Meaning | LMS Access |
|---|---|---|
| `completed` | Program completed | No (read-only) |
| `withdrawn` | Student withdrew | No |
| `cancelled` | Admin cancelled | No |
| `revoked` | Access revoked (see `revoked_at`) | No |

---

## pending_funding_verification — Policy

This state was introduced 2026-05-03 to hold ~40 enrollments that were created via direct admin import with `funding_source='pending'` and no Stripe session or application record.

**What it means:**
- Student is provisionally admitted and has LMS access
- Payment source has not been confirmed
- Admin must resolve within the SLA window (default: 14 days)

**What it does not mean:**
- Student is financially cleared
- Payment has been received
- Enrollment is permanent

**LMS access is intentional, not accidental.** The policy decision is: provisional students retain access while funding is being confirmed, to avoid disrupting students who are legitimately enrolled but whose paperwork is delayed. If this policy changes, update `enrollment_grants_lms_access()` in the DB — one function, not 30 query sites.

**Admin resolution options:**
1. **Payment confirmed** → set `enrollment_state = 'active'`, resolve flag with `resolution = 'payment_confirmed'`
2. **Waived** (e.g. scholarship, grant, error) → resolve flag with `resolution = 'waived'`, set appropriate `funding_source`
3. **Cannot confirm** → revoke via `revoke_application_access_atomic()`, resolve flag with `resolution = 'enrollment_revoked'`

---

## Metric Definitions

### `v_enrolled_not_paid`

**Measures:** Unauthorized enrollment leakage — SELF_PAY/stripe enrollments in an active state with no Stripe session and no verified `application_financials` row.

**`v_enrolled_not_paid = 0` means:** No new unauthorized leakage detected since last check.

**`v_enrolled_not_paid = 0` does NOT mean:** All students are financially cleared.

The `pending_funding_verification` cohort is intentionally excluded from this view because they have been explicitly flagged and moved to a holding state. They are tracked in `v_funding_verification_queue`.

### `v_funding_verification_queue`

**Measures:** All unresolved `payment_integrity_flags` rows with enrollment context, age, SLA status, docs received, and last contact date.

**Use this view** for admin triage, not `v_enrolled_not_paid`, when asking "how many students have unresolved funding questions."

### `v_payment_integrity_dashboard`

**Measures:** All payment integrity flags (resolved and unresolved) with enrollment context. Use for audit trail and historical reporting.

---

## SLA Rules

| Flag type | SLA window | Escalation action |
|---|---|---|
| `no_payment_evidence` | 14 days | `sla_escalated_at` set; surfaces at top of `v_funding_verification_queue` |
| `blocked_pending_review` | 7 days | Same |
| `bnpl_unverified` | 14 days | Same |

SLA escalation does **not** auto-revoke. It marks the flag so the admin queue surfaces it prominently. A human must take action.

Escalation is triggered by `escalate_funding_verification_sla()`. Wire to `/api/cron/escalate-funding-sla` with `CRON_SECRET` guard. Recommended schedule: daily.

---

## Admin Actions

### Resolving a flag

```sql
UPDATE public.payment_integrity_flags
SET resolved_at = NOW(),
    resolved_by = '<admin_user_id>',
    resolution  = 'payment_confirmed'  -- or 'waived' | 'enrollment_revoked' | 'false_positive'
WHERE id = '<flag_id>';

-- If payment confirmed, activate the enrollment
UPDATE public.program_enrollments
SET enrollment_state = 'active',
    updated_at       = NOW()
WHERE id = '<enrollment_id>';
```

### Checking the queue

```sql
SELECT * FROM public.v_funding_verification_queue
ORDER BY sla_breached DESC, age_days DESC;
```

### Confirming schema is live

```sql
-- Verify pending_funding_verification cohort
SELECT COUNT(*), enrollment_state
FROM public.program_enrollments
WHERE enrollment_state = 'pending_funding_verification'
GROUP BY enrollment_state;

-- Verify no flagged rows still in active/enrolled
SELECT COUNT(*)
FROM public.payment_integrity_flags f
JOIN public.program_enrollments pe ON pe.id = f.entity_id
WHERE f.resolved_at IS NULL
  AND pe.enrollment_state IN ('active', 'enrolled', 'approved');
-- Expect 0
```
