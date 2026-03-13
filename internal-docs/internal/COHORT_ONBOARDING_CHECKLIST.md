# Cohort Onboarding Checklist

**Purpose:** Pre-launch validation before Day 1 of any cohort  
**Rule:** If any box is unchecked → do not onboard students  
**Last Updated:** 2026-01-29

---

## A. Program Readiness

| Check | Status | Notes |
|-------|--------|-------|
| [ ] Program exists in `programs` table | | |
| [ ] Program has correct `slug` for routing | | |
| [ ] Courses attached to program via `program_courses` | | |
| [ ] All courses are `is_published = true` | | |
| [ ] Enrollment RPC tested for this program | | |
| [ ] Funding type configured (WIOA / self-pay / employer) | | |
| [ ] Program duration and hours documented | | |

### Verification Query
```sql
SELECT 
  p.id,
  p.name,
  p.slug,
  COUNT(pc.course_id) as course_count,
  COUNT(c.id) FILTER (WHERE c.is_published = true) as published_courses
FROM programs p
LEFT JOIN program_courses pc ON pc.program_id = p.id
LEFT JOIN courses c ON c.id = pc.course_id
WHERE p.slug = 'YOUR_PROGRAM_SLUG'
GROUP BY p.id;
```

**Expected:** `course_count > 0` and `published_courses = course_count`

---

## B. Partner Readiness (if applicable)

| Check | Status | Notes |
|-------|--------|-------|
| [ ] Partner application approved | | |
| [ ] `approval_status = 'approved'` | | |
| [ ] Auth user linked and can log in | | |
| [ ] Program access granted via `partner_program_access` | | |
| [ ] Partner understands approval + retry workflow | | |
| [ ] Partner contact info verified | | |

### Verification Query
```sql
SELECT 
  pa.shop_name,
  pa.approval_status,
  p.account_status,
  pu.user_id IS NOT NULL as has_auth_user,
  COUNT(ppa.program_id) as program_access_count
FROM partner_applications pa
JOIN partners p ON p.id = pa.partner_id
LEFT JOIN partner_users pu ON pu.partner_id = p.id
LEFT JOIN partner_program_access ppa ON ppa.partner_id = p.id
WHERE pa.contact_email = 'partner@example.com'
GROUP BY pa.id, p.id, pu.user_id;
```

**Expected:** `approval_status = 'approved'`, `account_status = 'active'`, `has_auth_user = true`

---

## C. Student Intake Validation

| Check | Status | Notes |
|-------|--------|-------|
| [ ] Application flow tested end-to-end | | |
| [ ] State machine transitions verified | | |
| [ ] Terms acceptance checkbox active | | |
| [ ] Draft persistence working (localStorage) | | |
| [ ] Recovery banner appears on refresh | | |
| [ ] Invalid transitions are rejected | | |
| [ ] Submission creates audit log entry | | |

### Test Procedure
1. Start new application
2. Complete Step 1 (Personal Info)
3. Refresh page → verify recovery banner appears
4. Complete all steps to Review
5. Attempt to skip step → verify rejection
6. Accept terms and submit
7. Verify `application_state = 'submitted'` in database
8. Verify audit log entry exists

---

## D. Enrollment Flow Validation

| Check | Status | Notes |
|-------|--------|-------|
| [ ] `rpc_enroll_student` executes without error | | |
| [ ] Program enrollment created | | |
| [ ] Course enrollments created | | |
| [ ] Profile status updated to `active` | | |
| [ ] Notification created | | |
| [ ] Audit log written | | |
| [ ] Idempotent retry returns same result | | |

### Test Procedure
```sql
-- Test enrollment (use test user)
SELECT rpc_enroll_student(
  'TEST_USER_UUID'::uuid,
  'PROGRAM_UUID'::uuid,
  'test-cohort-' || gen_random_uuid()::text,
  'cohort_test',
  '{"funding_source": "WIOA"}'::jsonb
);

-- Verify results
SELECT * FROM program_enrollments WHERE student_id = 'TEST_USER_UUID';
SELECT * FROM enrollments WHERE user_id = 'TEST_USER_UUID';
SELECT * FROM audit_logs WHERE details->>'user_id' = 'TEST_USER_UUID' ORDER BY created_at DESC LIMIT 1;
```

---

## E. Notification System Validation

| Check | Status | Notes |
|-------|--------|-------|
| [ ] Email templates exist for key events | | |
| [ ] `notification_outbox` queue is processing | | |
| [ ] Test email delivered successfully | | |
| [ ] Cron job `/api/cron/process-notifications` working | | |

### Test Procedure
```sql
-- Queue test notification
INSERT INTO notification_outbox (to_email, template_key, template_data, status, scheduled_for)
VALUES (
  'admin@example.com',
  'enrollment_welcome',
  '{"name": "Test User", "program_name": "Test Program"}'::jsonb,
  'queued',
  NOW()
);

-- Trigger processing
-- POST /api/cron/process-notifications (with CRON_SECRET)

-- Verify sent
SELECT * FROM notification_outbox WHERE to_email = 'admin@example.com' ORDER BY created_at DESC LIMIT 1;
```

---

## F. Dry Run (MANDATORY)

**This must pass before any real student is onboarded.**

| Step | Status | Notes |
|------|--------|-------|
| [ ] 1. Create test student profile | | |
| [ ] 2. Complete application end-to-end | | |
| [ ] 3. Submit successfully | | |
| [ ] 4. Enroll via RPC | | |
| [ ] 5. Verify courses appear in LMS | | |
| [ ] 6. Verify welcome notification fires | | |
| [ ] 7. Clean up test data | | |

### Dry Run Script
```sql
-- 1. Create test profile
INSERT INTO profiles (id, email, full_name, role, enrollment_status)
VALUES (
  gen_random_uuid(),
  'dryrun_' || gen_random_uuid()::text || '@test.com',
  'Dry Run Test',
  'student',
  'pending'
)
RETURNING id as test_user_id;

-- 2-3. Complete application via UI or RPC
-- (Use the returned test_user_id)

-- 4. Enroll
SELECT rpc_enroll_student(
  'TEST_USER_ID'::uuid,
  'PROGRAM_UUID'::uuid,
  'dryrun-' || NOW()::text,
  'dry_run',
  '{}'::jsonb
);

-- 5. Verify courses
SELECT c.title, e.status 
FROM enrollments e 
JOIN courses c ON c.id = e.course_id 
WHERE e.user_id = 'TEST_USER_ID';

-- 6. Verify notification
SELECT * FROM notifications WHERE user_id = 'TEST_USER_ID';

-- 7. Cleanup
DELETE FROM notifications WHERE user_id = 'TEST_USER_ID';
DELETE FROM enrollments WHERE user_id = 'TEST_USER_ID';
DELETE FROM program_enrollments WHERE student_id = 'TEST_USER_ID';
DELETE FROM career_applications WHERE user_id = 'TEST_USER_ID';
DELETE FROM profiles WHERE id = 'TEST_USER_ID';
```

---

## G. Go/No-Go Decision

| Criteria | Required | Actual |
|----------|----------|--------|
| Program readiness | All checks pass | |
| Partner readiness (if applicable) | All checks pass | |
| Intake validation | All checks pass | |
| Enrollment validation | All checks pass | |
| Notification validation | All checks pass | |
| Dry run | Complete success | |

**Decision:**
- [ ] **GO** - All criteria met, proceed with cohort onboarding
- [ ] **NO-GO** - Issues identified, resolve before proceeding

**Sign-off:**

| Role | Name | Date |
|------|------|------|
| Program Admin | | |
| Technical Lead | | |

---

## H. Post-Launch Monitoring (First 48 Hours)

| Check | Frequency | Notes |
|-------|-----------|-------|
| [ ] Monitor `audit_logs` for errors | Every 4 hours | |
| [ ] Check `notification_outbox` for failures | Every 4 hours | |
| [ ] Verify first 3 enrollments succeeded | After each | |
| [ ] Check for stuck applications | Daily | |
| [ ] Review admin alerts | As received | |

### Monitoring Queries
```sql
-- Recent errors
SELECT * FROM audit_logs 
WHERE action LIKE '%error%' OR action LIKE '%invalid%'
AND created_at > NOW() - INTERVAL '24 hours';

-- Failed notifications
SELECT * FROM notification_outbox 
WHERE status = 'failed'
AND created_at > NOW() - INTERVAL '24 hours';

-- Stuck applications
SELECT * FROM career_applications
WHERE application_state NOT IN ('submitted', 'rejected')
AND created_at > NOW() - INTERVAL '48 hours'
AND updated_at < NOW() - INTERVAL '24 hours';
```

---

## Appendix: Common Issues & Fixes

| Issue | Likely Cause | Fix |
|-------|--------------|-----|
| Enrollment fails silently | Missing program_courses | Add course associations |
| No courses visible | Courses not published | Set `is_published = true` |
| Partner can't log in | Stuck in `approved_pending_user` | Complete auth linking |
| Notifications not sending | Cron not running | Check scheduled function |
| Application won't submit | Not in `review_ready` state | Complete all steps |
