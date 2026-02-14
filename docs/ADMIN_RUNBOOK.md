# Admin Runbook

**Purpose:** Operational procedures for when things break  
**Audience:** Admins, staff, auditors  
**Last Updated:** 2026-01-29

---

## Golden Rules

1. **State truth lives in the database**, not in email confirmations or UI screenshots
2. **Never manually INSERT/UPDATE** lifecycle tables - use RPCs
3. **Idempotent retries are safe** - when in doubt, retry with same key
4. **Log every corrective action** - auditors will ask

---

## A. Application Lifecycle Issues

### Scenario: Application stuck / user claims they submitted

**Diagnosis:**
```sql
SELECT id, application_state, submitted_at, state_history
FROM career_applications
WHERE email = 'user@example.com';
```

**Truth test:** If `application_state ≠ 'submitted'` → it is NOT a valid submission.

**Actions:**

| State | Meaning | Action |
|-------|---------|--------|
| `started` | User abandoned early | Contact user, they must complete |
| `eligibility_complete` | Stopped at education | User must continue |
| `documents_complete` | Stopped at program selection | User must continue |
| `review_ready` | Ready but didn't click submit | User must accept terms and submit |
| `submitted` | Valid submission | No action needed |

**If user is genuinely blocked:**
1. Allow backward transition via admin tool (if available)
2. User re-completes steps normally
3. Document the intervention in `audit_logs`

**Never do this:**
- Manually set `application_state = 'submitted'` unless correcting a documented system failure
- Trust user screenshots over database state

---

### Scenario: Invalid transition logged in audit_logs

**Check:**
```sql
SELECT * FROM audit_logs 
WHERE action = 'invalid_state_transition'
ORDER BY created_at DESC LIMIT 10;
```

**Meaning:** User or system attempted an illegal state jump.

**Action:** 
- If isolated: No action, system correctly rejected
- If pattern: Investigate client-side bug or manipulation attempt

---

## B. Enrollment Issues

### Scenario: Student says "I'm enrolled but can't see courses"

**Diagnosis checklist:**

1. **Check program enrollment:**
```sql
SELECT * FROM program_enrollments 
WHERE student_id = 'USER_UUID';
```

2. **Check course enrollments:**
```sql
SELECT e.*, c.title 
FROM enrollments e
JOIN courses c ON c.id = e.course_id
WHERE e.user_id = 'USER_UUID';
```

3. **Check audit log:**
```sql
SELECT * FROM audit_logs 
WHERE action = 'enrollment_created'
AND details->>'user_id' = 'USER_UUID';
```

**If missing enrollments:**
- Re-run enrollment via admin using **new** idempotency key
- Do NOT manually insert rows

**Command (via Supabase SQL editor):**
```sql
SELECT rpc_enroll_student(
  'USER_UUID'::uuid,
  'PROGRAM_UUID'::uuid,
  'admin-fix-' || gen_random_uuid()::text,
  'admin_correction',
  '{"funding_source": "WIOA"}'::jsonb
);
```

---

### Scenario: Duplicate enrollment attempt / error on retry

**Safe actions:**
- Retry with **same** idempotency key → returns existing enrollment
- Retry with **new** key → only if no `program_enrollment` exists

**Check existing:**
```sql
SELECT * FROM program_enrollments 
WHERE student_id = 'USER_UUID' AND program_id = 'PROGRAM_UUID';
```

If row exists → enrollment succeeded, investigate course access separately.

---

### Scenario: Profile shows wrong enrollment_status

**Check:**
```sql
SELECT id, enrollment_status FROM profiles WHERE id = 'USER_UUID';
```

**If stuck at 'pending' but enrollment exists:**
```sql
UPDATE profiles SET enrollment_status = 'active' WHERE id = 'USER_UUID';
```

Document this correction.

---

## C. Partner Approval Issues

### Scenario: Partner approved but cannot log in

**Diagnosis:**
```sql
SELECT 
  pa.id,
  pa.shop_name,
  pa.approval_status,
  pa.partner_id,
  p.account_status,
  pu.user_id,
  pu.status as user_status
FROM partner_applications pa
LEFT JOIN partners p ON p.id = pa.partner_id
LEFT JOIN partner_users pu ON pu.partner_id = p.id
WHERE pa.contact_email = 'partner@example.com';
```

**Status meanings:**

| approval_status | account_status | user_id | Meaning |
|-----------------|----------------|---------|---------|
| `approved_pending_user` | `pending_user` | NULL | Auth user creation failed |
| `approved` | `active` | UUID | Fully approved |
| `approved` | `pending_user` | UUID | Link RPC didn't complete |

**If `approved_pending_user`:**

1. Create auth user manually via Supabase dashboard
2. Run link RPC:
```sql
SELECT rpc_link_partner_user(
  'PARTNER_UUID'::uuid,
  'AUTH_USER_UUID'::uuid,
  'partner@example.com',
  'admin-link-' || gen_random_uuid()::text
);
```

**Do NOT:**
- Delete partner records
- Downgrade approval status
- Create duplicate partner entries

---

### Scenario: Partner stuck >24 hours in approved_pending_user

**This triggers automatic alert via `/api/cron/check-stuck-approvals`**

**Manual check:**
```sql
SELECT * FROM partner_applications
WHERE approval_status = 'approved_pending_user'
AND reviewed_at < NOW() - INTERVAL '24 hours';
```

**Action:**
1. Investigate why auth creation failed (check Supabase auth logs)
2. Manually create auth user if needed
3. Run `rpc_link_partner_user`
4. Document resolution

---

### Scenario: Partner needs to be suspended

```sql
UPDATE partners SET account_status = 'suspended' WHERE id = 'PARTNER_UUID';
UPDATE partner_applications SET approval_status = 'suspended' WHERE partner_id = 'PARTNER_UUID';
```

Log reason in `audit_logs`.

---

## D. Notification Issues

### Scenario: User didn't receive email

**Check queue:**
```sql
SELECT * FROM notification_outbox
WHERE to_email = 'user@example.com'
ORDER BY created_at DESC;
```

**Status meanings:**
- `queued` → Waiting for cron processor
- `sent` → Delivered to email provider
- `failed` → Exhausted retries

**If failed:**
```sql
-- Reset for retry
UPDATE notification_outbox
SET status = 'queued', attempts = 0, scheduled_for = NOW()
WHERE id = 'NOTIFICATION_UUID';
```

**If missing entirely:** Queue manually:
```sql
INSERT INTO notification_outbox (to_email, template_key, template_data, status, scheduled_for)
VALUES (
  'user@example.com',
  'enrollment_welcome',
  '{"name": "User Name", "program_name": "Program"}'::jsonb,
  'queued',
  NOW()
);
```

---

## E. Audit / Regulator Requests

### "How do you prevent partial records?"

**Answer:**
1. DB-enforced state machine with `application_state` enum
2. Atomic RPC orchestration (`rpc_enroll_student`, `rpc_approve_partner`)
3. Idempotent retries via `idempotency_keys` table
4. Full audit logging in `audit_logs`

**Evidence:**
```sql
-- Show state machine enforcement
SELECT * FROM audit_logs WHERE action = 'invalid_state_transition';

-- Show atomic enrollments
SELECT * FROM audit_logs WHERE action = 'enrollment_created';

-- Show idempotency
SELECT * FROM idempotency_keys ORDER BY created_at DESC LIMIT 20;
```

### "Show me the enrollment for student X"

```sql
SELECT 
  pe.id as enrollment_id,
  pe.created_at as enrolled_at,
  pe.status,
  pe.funding_source,
  p.name as program_name,
  al.details as audit_details
FROM program_enrollments pe
JOIN programs p ON p.id = pe.program_id
LEFT JOIN audit_logs al ON al.entity_id = pe.id AND al.action = 'enrollment_created'
WHERE pe.student_id = 'USER_UUID';
```

### "Prove this application was submitted correctly"

```sql
SELECT 
  id,
  application_state,
  submitted_at,
  state_history,
  (SELECT details FROM audit_logs WHERE entity_id = ca.id AND action = 'application_submitted') as submission_audit
FROM career_applications ca
WHERE id = 'APPLICATION_UUID';
```

---

## F. Emergency Procedures

### Database connection issues

1. Check Supabase status page
2. Verify environment variables
3. Check connection pool limits

### Cron jobs not running

1. Check Netlify/Netlify scheduled function logs
2. Manually trigger: `POST /api/cron/process-notifications`
3. Check `CRON_SECRET` is set

### Mass enrollment failure

1. **Stop** - do not retry blindly
2. Check `audit_logs` for pattern
3. Identify root cause (missing program? RLS issue?)
4. Fix root cause
5. Re-run enrollments with new idempotency keys

---

## Appendix: Key Tables

| Table | Purpose |
|-------|---------|
| `career_applications` | Application lifecycle state |
| `program_enrollments` | Student-program relationship |
| `enrollments` | Student-course access |
| `partners` | Partner entities |
| `partner_applications` | Partner approval workflow |
| `partner_users` | Partner-auth user link |
| `audit_logs` | All lifecycle events |
| `idempotency_keys` | Retry safety |
| `notification_outbox` | Email queue |

---

## Appendix: Key RPCs

| RPC | Purpose |
|-----|---------|
| `start_application` | Begin application |
| `advance_application_state` | Move through steps |
| `submit_application` | Final submission |
| `rpc_enroll_student` | Atomic enrollment |
| `rpc_approve_partner` | Phase 1 partner approval |
| `rpc_link_partner_user` | Phase 2 auth linking |
