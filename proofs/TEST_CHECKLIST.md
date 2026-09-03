# Live Test Checklist

## Prerequisites

- [ ] RESEND_API_KEY configured in environment
- [ ] SUPABASE_URL and SUPABASE_ANON_KEY configured
- [ ] App running (`pnpm dev`)

---

## TEST 1: Document Upload → Staff Email

**Trigger:** Student uploads document at `/apprentice/documents`

**Expected:**

- Upload confirmation shown to student
- Email sent to all admin users
- Email contains: student name, document type, program, review link

**Code path:** `app/api/apprentice/documents/route.ts` → line 179

**Verification:**

- [ ] Upload succeeds (UI confirmation)
- [ ] Staff email received (check Resend dashboard or inbox)
- [ ] Email contains correct student/document info

**Proof:** Screenshot upload confirmation + email received

---

## TEST 2: Program Completion → Certificate Email

**Trigger:** POST to `/api/enrollments/complete-program` with valid enrollment_id

**Expected:**

- Certificate record created (or existing returned if idempotent)
- Enrollment status updated to 'completed'
- Certificate email sent to student immediately

**Code path:** `lib/certificates/issue-certificate.ts` → line 148

**Test command:**

```bash
curl -X POST https://[your-domain]/api/enrollments/complete-program \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [token]" \
  -d '{"enrollment_id": "[valid-enrollment-id]"}'
```

**Verification:**

- [ ] First call returns certificate with `already_completed: false`
- [ ] Second call returns same certificate with `already_completed: true`
- [ ] Student receives certificate email
- [ ] Certificate URL is accessible without admin auth

**Proof:** JSON responses + email received + certificate page screenshot

---

## TEST 3: Enrollment Approval → Partner Email

**Trigger:** Approve enrollment that has `program_holder_id` set

**Expected:**

- Enrollment status updated to 'active'
- Student receives approval email
- Partner (program holder) receives notification email

**Code path:** `app/api/enroll/approve/route.ts` → lines 198-199, 246-247

**Verification:**

- [ ] Enrollment approved successfully
- [ ] Student email received
- [ ] Partner email received (if program_holder_id exists)

**Proof:** API response + both emails received

---

## Summary

| Test                     | Code Wired        | Email Trigger                  | Status |
| ------------------------ | ----------------- | ------------------------------ | ------ |
| Document Upload → Staff  | ✅ Line 179       | sendDocumentUploadNotification | READY  |
| Completion → Certificate | ✅ Line 148       | sendCertificateNotification    | READY  |
| Approval → Partner       | ✅ Lines 198, 246 | sendEmail (resend)             | READY  |

All triggers are implemented. Tests require:

1. Valid RESEND_API_KEY in production environment
2. Test user accounts with appropriate roles
3. Test enrollment with program_holder_id for partner test
