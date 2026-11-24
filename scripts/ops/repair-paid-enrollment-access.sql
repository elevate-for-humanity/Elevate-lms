-- Repair existing program_enrollments rows that were created before the
-- access fields existed (PR #2822, all-students enrollment fix).
--
-- WHO THIS IS FOR: learners who PAID (or whose funding was verified and
-- who were manually approved) but whose row is missing access_status /
-- access_granted_at / self_pay_application_verified_at, so they sign in
-- and bounce to /lms/access-pending. New enrollments get these fields at
-- creation time after #2822; this script repairs rows created before it.
--
-- DO NOT RUN THIS ON PRODUCTION BLINDLY:
--   1. Run it in elevate-lms-qa first (elevate-lms-qa, isdgjcdabhxxozarmxta).
--   2. Run the SELECT in section 1 first and eyeball the rows. It must
--      only list rows you recognise as paid/approved learners.
--   3. Apply to production only after the QA run is verified and
--      Elizabeth confirms the list.
--   4. Never auto-apply this from a migration or a job. It is a one-time
--      manual repair, run by an admin in the SQL Editor.
--
-- WHAT IT WILL NOT DO:
--   - Deposit-only rows (payment_status = 'deposit_paid') are NOT repaired:
--     the login gate treats a deposit as not-yet-paid.
--   - Unpaid, agency-pending, revoked, cancelled, suspended or refunded
--     rows are NOT repaired.
--   - Rows whose enrollment_requirements are still unverified are NOT
--     repaired here: use POST /api/admin/enrollments/[id]/grant-access
--     for those, so the requirements check is enforced.
--   - Existing access_granted_at / self_pay_application_verified_at
--     timestamps are NEVER overwritten (COALESCE keeps the original).
--
-- Section 1: list the rows that would be repaired (run this first).
select
  id,
  user_id,
  program_slug,
  status,
  payment_status,
  funding_source,
  payment_reference,
  access_status,
  access_granted_at,
  self_pay_application_verified_at,
  approved_at,
  approved_by
from program_enrollments
where revoked_at is null
  and cancelled_at is null
  and suspended_at is null
  and refunded_at is null
  and status in ('active', 'enrolled', 'in_progress', 'confirmed')
  and (access_status is null or access_status not in ('active', 'granted'))
  and (
    -- (a) verified self-pay payment: paid + reference present
    (
      payment_status in ('paid', 'paid_in_full', 'payment_completed', 'completed')
      and lower(coalesce(funding_source, '')) in ('self_pay', 'self-pay', 'selfpay', 'self', 'self-funded', 'self_funded', '')
      and payment_reference is not null
    )
    -- (b) manually approved + verified state funding
    or (
      approved_at is not null
      and approved_by is not null
      and lower(coalesce(funding_source, '')) in ('wioa', 'wrg', 'workone', 'jri')
      and funding_verified = true
      and eligibility_status = 'eligible'
    )
  );

-- Section 2: repair (a) — verified self-pay rows.
update program_enrollments
set access_status = 'active',
    access_granted_at = coalesce(access_granted_at, now()),
    self_pay_application_verified_at = coalesce(self_pay_application_verified_at, now()),
    updated_at = now()
where revoked_at is null
  and cancelled_at is null
  and suspended_at is null
  and refunded_at is null
  and status in ('active', 'enrolled', 'in_progress', 'confirmed')
  and (access_status is null or access_status not in ('active', 'granted'))
  and payment_status in ('paid', 'paid_in_full', 'payment_completed', 'completed')
  and lower(coalesce(funding_source, '')) in ('self_pay', 'self-pay', 'selfpay', 'self', 'self-funded', 'self_funded', '')
  and payment_reference is not null;

-- Section 3: repair (b) — manually approved + verified state-funded rows.
update program_enrollments
set access_status = 'active',
    access_granted_at = coalesce(access_granted_at, now()),
    updated_at = now()
where revoked_at is null
  and cancelled_at is null
  and suspended_at is null
  and refunded_at is null
  and status in ('active', 'enrolled', 'in_progress', 'confirmed')
  and (access_status is null or access_status not in ('active', 'granted'))
  and approved_at is not null
  and approved_by is not null
  and lower(coalesce(funding_source, '')) in ('wioa', 'wrg', 'workone', 'jri')
  and funding_verified = true
  and eligibility_status = 'eligible';

-- Section 4: re-check — after sections 2–3 this must return 0 rows for
-- the same conditions as section 1. Any rows left are stuck for a
-- different reason (deposit-only, unpaid, agency-pending, requirements
-- unverified) and need the grant-access route or a payment fix, not
-- another run of this script.
select count(*) as still_stuck
from program_enrollments
where revoked_at is null
  and cancelled_at is null
  and suspended_at is null
  and refunded_at is null
  and status in ('active', 'enrolled', 'in_progress', 'confirmed')
  and (access_status is null or access_status not in ('active', 'granted'))
  and (
    (
      payment_status in ('paid', 'paid_in_full', 'payment_completed', 'completed')
      and lower(coalesce(funding_source, '')) in ('self_pay', 'self-pay', 'selfpay', 'self', 'self-funded', 'self_funded', '')
      and payment_reference is not null
    )
    or (
      approved_at is not null
      and approved_by is not null
      and lower(coalesce(funding_source, '')) in ('wioa', 'wrg', 'workone', 'jri')
      and funding_verified = true
      and eligibility_status = 'eligible'
    )
  );
