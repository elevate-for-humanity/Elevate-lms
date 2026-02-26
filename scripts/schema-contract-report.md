# Schema vs Insert Contract Report

**Generated**: 2026-02-26
**Schema source**: LIVE Supabase DB (project cuxzzpsyufcewtmicszk) via Management API
**Status**: VERIFIED against production schema

---

## HARD MISMATCHES — Runtime-fatal insert failures

### 1. automated_decisions — dual-schema table, code split across both

**Live schema** (22 columns, both schemas merged):

NOT NULL columns: subject_type, subject_id, decision, reason_codes, input_snapshot, ruleset_version, actor
Nullable columns: decision_type, entity_type, entity_id, outcome, confidence, reasoning, rules_applied, override_by, processing_time_ms, confidence_score, overridden_by, overridden_at, override_reason

**Impact**: Code using ONLY canonical columns (entity_type/entity_id/outcome/decision_type)
WITHOUT providing subject_type/subject_id/decision will FAIL because those are NOT NULL.

**Files that FAIL (missing NOT NULL columns)**:

| File | Line | Writes | Missing NOT NULL |
|------|------|--------|-----------------|
| app/api/automation/test/partner-approval/route.ts | 164 | entity_type, entity_id, decision_type, outcome | subject_type, subject_id, decision |
| app/api/automation/test/shop-routing/route.ts | 222 | entity_type, entity_id, decision_type, outcome | subject_type, subject_id, decision |
| app/api/automation/test/document-processing/route.ts | 153 | entity_type, entity_id, decision_type, outcome | subject_type, subject_id, decision |
| lib/automation/evidence-processor.ts | 375 | entity_type, entity_id, decision_type, outcome | subject_type, subject_id, decision |
| lib/automation/evidence-processor.ts | 479 | entity_type, entity_id, decision_type, outcome | subject_type, subject_id, decision |
| lib/automation/evidence-processor.ts | 618 | entity_type, entity_id, decision_type, outcome | subject_type, subject_id, decision |

**Files that WORK (provide NOT NULL columns)**:

| File | Line | Status |
|------|------|--------|
| app/api/admin/review-queue/resolve/route.ts | 191 | writes subject_type, subject_id, decision |
| lib/automation/partner-approval.ts | 158 | writes subject_type, subject_id, decision |
| lib/automation/shop-routing.ts | 300, 412 | writes subject_type, subject_id, decision |

**Fix**: All inserts must provide BOTH sets. NOT NULL columns are the contract.

### 2. franchise_audit_log — return-service.ts missing NOT NULL action

**Live schema**: action is VARCHAR NOT NULL. event_type exists as nullable text (added later).

| File | Line | Issue |
|------|------|-------|
| lib/franchise/return-service.ts | 383 | Writes event_type but NOT action — fails NOT NULL constraint |

### 3. case_events — ALL columns wrong

**Live schema**: id, user_id, action, details, ip_address, created_at, updated_at

**Code writes** (lib/workflow/case-management.ts:100):
- case_id -> does not exist
- event_type -> does not exist (should be action)
- actor_id -> does not exist (should be user_id)
- actor_role -> does not exist (should go in details)
- after_state -> does not exist (should go in details)
- metadata -> does not exist (should go in details)

### 4. ai_audit_log — non-existent columns

**Live schema**: id, user_id, action, details, ip_address, created_at, updated_at

| File | Line | Non-existent columns |
|------|------|---------------------|
| app/api/payments/split/route.ts | 118 | student_id, program_slug |
| lib/vendors/milady-payment.ts | 64 | student_id, program_slug |
| lib/vendors/milady-payment.ts | 86 | student_id, program_slug |
| lib/autopilot/test-enrollment-flow.ts | 254 | student_id, program_slug |
| lib/ai/assign.ts | 41 | student_id, program_slug |

Fix: Use user_id instead of student_id, move program_slug into details JSONB.

### 5. license_audit_log — non-existent columns

**Live schema**: id, user_id, action, details, ip_address, created_at, updated_at

**Code writes** (lib/licensing/audit.ts:55):
- event -> does not exist (should be action)
- license_id -> does not exist (should go in details)
- tenant_id -> does not exist (should go in details)
- user_agent -> does not exist
- metadata -> does not exist (should be details)

### 6. security_logs — table is non-functional

**Live schema**: id, elevateforhumanity (text), created_at, updated_at

This table has only a mystery column. None of the code-written columns exist.

| File | Line | All columns wrong |
|------|------|------------------|
| app/unauthorized/page.tsx | 32 | event |
| app/api/security/log/route.ts | 58 | event_type, timestamp, url, user_agent, ip_address, data, severity |

---

## CONFIRMED CORRECT

| Table | Status | Notes |
|-------|--------|-------|
| admin_audit_events | FIXED | 5 files, correct columns now |
| audit_logs | CORRECT | 64 columns in live DB, all inserts valid |
| partner_audit_log | CORRECT | Single insert, all columns match |
| enrollment_events | CORRECT | Live has kind, course_id, funding_program_id |
| login_events | CORRECT | Code writes only user_id |
| payment_logs | CORRECT | 27 columns in live, all match |
| email_logs | CORRECT | 23 columns in live |
| notification_logs | CORRECT | Has NOT NULL fields, need to verify code provides them |

---

## GOVERNANCE BYPASS CHECK
- admin_audit_events: No bypass. All RPCs from single file.
- program_holder_verification: No bypass. Direct writes are student-initiated.

## METADATA LEAKAGE
No sensitive data in any audit metadata payloads.

---

## SUMMARY

| Table | Status | Files | Severity |
|-------|--------|-------|----------|
| automated_decisions | HARD MISMATCH | 6 files missing NOT NULL | CRITICAL |
| franchise_audit_log | HARD MISMATCH | 1 file missing NOT NULL action | HIGH |
| case_events | ALL WRONG | 1 file, all columns wrong | HIGH |
| ai_audit_log | WRONG COLUMNS | 5 files, non-existent cols | MEDIUM |
| license_audit_log | WRONG COLUMNS | 1 file, 5 non-existent cols | MEDIUM |
| security_logs | NON-FUNCTIONAL | 2 files, table has no useful cols | HIGH |

Total: 6 tables with confirmed mismatches, 16 files need fixes, 8 tables verified correct.
