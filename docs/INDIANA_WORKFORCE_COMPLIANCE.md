# Indiana Workforce & State Approval Mapping

**Purpose:** Compliance alignment for Indiana DWD, workforce boards, and grant reviewers  
**Audience:** Regulators, credential partners, funding agencies  
**Last Updated:** 2026-01-29

---

## Overview

This document maps the Elevate LMS platform capabilities to Indiana workforce and state approval requirements for apprenticeship, career training, and workforce funding programs.

---

## 1. Student Intake & Eligibility Control

### Indiana Expectation

Clear, documented intake process with eligibility validation and auditability.

### Platform Implementation

- Multi-step intake enforced by server-side state machine
- Eligibility captured before advancement (`eligibility_complete` state)
- No application can be submitted unless all required steps are completed in order
- All transitions logged with timestamps and user identity

### Compliance Statement

> Student eligibility and intake completion are enforced at the database level through a controlled application state machine. Applications cannot be submitted unless all required eligibility and documentation steps are completed and validated.

### Evidence

```sql
-- Show state machine enforcement
SELECT id, application_state, submitted_at, state_history
FROM career_applications
WHERE application_state = 'submitted';

-- Show rejected invalid transitions
SELECT * FROM audit_logs WHERE action = 'invalid_state_transition';
```

---

## 2. Application Integrity & Recordkeeping

### Indiana Expectation

No partial records, no unverifiable submissions, auditable lifecycle.

### Platform Implementation

- Single source of truth for submission (`state = submitted` + `submitted_at`)
- Full state history retained in JSONB array
- Invalid or out-of-order submissions rejected and logged
- No manual backdoor to submission status

### Compliance Statement

> The system maintains an immutable record of application lifecycle events, including all state transitions, timestamps, and rejection attempts, ensuring full auditability.

### Evidence

```sql
-- Complete application audit trail
SELECT
  id,
  email,
  application_state,
  submitted_at,
  state_history,
  created_at
FROM career_applications
WHERE id = 'APPLICATION_UUID';
```

---

## 3. Enrollment & Participation Tracking

### Indiana Expectation

Accurate enrollment records, no duplicate participation, recoverable errors.

### Platform Implementation

- Enrollment provisioning via atomic transactional RPC (`rpc_enroll_student`)
- Program + course enrollments created together or not at all
- Unique constraints prevent duplicate enrollments
- Idempotency keys prevent duplicate processing on retries
- Enrollment failures leave no partial data

### Compliance Statement

> Enrollment records are provisioned through atomic database transactions to prevent partial or duplicate records. Retry-safe idempotency ensures consistent outcomes under failure conditions.

### Evidence

```sql
-- Enrollment with full audit trail
SELECT
  pe.id as enrollment_id,
  pe.student_id,
  pe.program_id,
  pe.funding_source,
  pe.created_at,
  al.details as audit_details
FROM program_enrollments pe
JOIN audit_logs al ON al.entity_id = pe.id AND al.action = 'enrollment_created'
WHERE pe.student_id = 'STUDENT_UUID';

-- Idempotency tracking
SELECT * FROM idempotency_keys WHERE operation = 'enroll_student';
```

---

## 4. Employer / Partner Controls

### Indiana Expectation

Approved partners only, controlled access, documented approvals.

### Platform Implementation

**Approval Status Workflow:**
| Status | Meaning |
|--------|---------|
| `pending` | Awaiting admin review |
| `approved_pending_user` | DB approved, auth user not yet created |
| `approved` | Fully approved with auth user linked |
| `denied` | Application rejected |
| `suspended` | Partner access suspended |

- No partner gains system access until fully `approved`
- Auth creation failures do not result in phantom partners
- Admin-visible retry path for stuck approvals
- All approvals logged with admin identity

### Compliance Statement

> Employer and partner access is controlled through a two-phase approval process that prevents partial approvals and ensures all access is explicitly granted and auditable.

### Evidence

```sql
-- Partner approval audit trail
SELECT
  pa.id,
  pa.shop_name,
  pa.approval_status,
  pa.reviewed_at,
  pa.reviewed_by,
  al.details
FROM partner_applications pa
LEFT JOIN audit_logs al ON al.entity_id = pa.partner_id AND al.action = 'partner_approved'
WHERE pa.approval_status = 'approved';
```

---

## 5. Failure Handling & Recovery

### Indiana Expectation

Systems must handle errors without corrupting records.

### Platform Implementation

- No optimistic submission (server validates before persisting)
- Explicit failure responses with error codes
- Draft recovery for applicants (24-hour localStorage persistence)
- Admin runbook for exception handling
- Automated alerts for stuck approvals (>24 hours)

### Compliance Statement

> The platform is designed to fail safely, ensuring no incomplete or invalid records are persisted during system or network failures.

### Recovery Procedures

- See `docs/ADMIN_RUNBOOK.md` for operational procedures
- Automated monitoring via `/api/cron/check-stuck-approvals`

---

## 6. Audit & Oversight

### Indiana Expectation

Ability to demonstrate compliance on request.

### Platform Implementation

**Logged Events:**

- Application state transitions
- Invalid transition attempts
- Enrollment creation
- Partner approvals
- Partner user linking
- Notification delivery

**Audit Log Structure:**

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  actor_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ
);
```

### Compliance Statement

> All critical actions are logged with user attribution and timestamps, enabling transparent review by internal or external auditors.

### Standard Audit Queries

```sql
-- All actions for a specific student
SELECT * FROM audit_logs
WHERE details->>'user_id' = 'STUDENT_UUID'
ORDER BY created_at;

-- All partner approvals in date range
SELECT * FROM audit_logs
WHERE action = 'partner_approved'
AND created_at BETWEEN '2026-01-01' AND '2026-12-31';

-- All enrollment activity
SELECT * FROM audit_logs
WHERE action = 'enrollment_created'
ORDER BY created_at DESC;
```

---

## 7. Data Integrity Guarantees

### Technical Controls

| Control                   | Implementation                                      |
| ------------------------- | --------------------------------------------------- |
| State machine enforcement | `application_state` enum with validated transitions |
| Atomic transactions       | PL/pgSQL functions with automatic rollback          |
| Idempotency               | `idempotency_keys` table with unique constraints    |
| Row-level locking         | `SELECT ... FOR UPDATE` prevents race conditions    |
| Unique constraints        | Prevent duplicate enrollments                       |
| RLS policies              | Block direct table manipulation                     |

### Compliance Statement

> Data integrity is enforced through database-level controls including state machines, atomic transactions, idempotency tracking, and row-level security policies.

---

## 8. Reporting Capabilities

### Available Reports

| Report                       | Data Source                             | Purpose                |
| ---------------------------- | --------------------------------------- | ---------------------- |
| Enrollment by Program        | `program_enrollments`                   | Participation tracking |
| Enrollment by Funding Source | `program_enrollments.funding_source`    | Grant reporting        |
| Application Pipeline         | `career_applications.application_state` | Intake funnel          |
| Partner Activity             | `partner_applications`, `partners`      | Employer engagement    |
| Completion Rates             | `enrollments.status`                    | Outcome tracking       |

### Sample Report Query

```sql
-- Enrollment summary by program and funding
SELECT
  p.name as program_name,
  pe.funding_source,
  COUNT(*) as enrollment_count,
  COUNT(*) FILTER (WHERE pe.status = 'COMPLETED') as completed,
  COUNT(*) FILTER (WHERE pe.status = 'IN_PROGRESS') as in_progress
FROM program_enrollments pe
JOIN programs p ON p.id = pe.program_id
WHERE pe.created_at >= '2026-01-01'
GROUP BY p.name, pe.funding_source
ORDER BY p.name, pe.funding_source;
```

---

## Appendix A: System Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  (Next.js - UI only, no business logic)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Database Layer                           │
│  (PostgreSQL via Supabase)                                  │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ State Machine   │  │ Atomic RPCs     │                   │
│  │ (application_   │  │ (rpc_enroll_    │                   │
│  │  state enum)    │  │  student, etc)  │                   │
│  └─────────────────┘  └─────────────────┘                   │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ Audit Logs      │  │ Idempotency     │                   │
│  │ (audit_logs)    │  │ (idempotency_   │                   │
│  │                 │  │  keys)          │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Appendix B: Key Database Functions

| Function                      | Purpose                                 |
| ----------------------------- | --------------------------------------- |
| `start_application()`         | Initialize application with audit trail |
| `advance_application_state()` | Validated state transitions             |
| `submit_application()`        | Final submission with validation        |
| `rpc_enroll_student()`        | Atomic enrollment orchestration         |
| `rpc_approve_partner()`       | Phase 1 partner approval                |
| `rpc_link_partner_user()`     | Phase 2 auth linking                    |

---

## Appendix C: Contact & Documentation

| Resource                | Location                              |
| ----------------------- | ------------------------------------- |
| Technical Documentation | `docs/OPERATIONAL_READINESS_AUDIT.md` |
| Admin Procedures        | `docs/ADMIN_RUNBOOK.md`               |
| Onboarding Checklist    | `docs/COHORT_ONBOARDING_CHECKLIST.md` |
| Database Migrations     | `supabase/migrations/`                |

---

## Certification

> The Elevate LMS platform enforces intake, enrollment, and partner participation through controlled workflows with audit logging and transactional safeguards, meeting Indiana workforce program requirements for data integrity, auditability, and compliance.
