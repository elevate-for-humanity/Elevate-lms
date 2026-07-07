# ENROLLMENT DECISION ENGINE - AUTOMATIC VS. MANUAL REVIEW

**Generated:** July 7, 2026  
**Status:** NOT STARTED  
**Objective:** Automate enrollment when possible, route exceptions to manual queue

---

## OVERVIEW

The Enrollment Decision Engine automatically determines whether an applicant qualifies for immediate enrollment or requires manual review.

**Goal:** Automate enrollment whenever all required conditions are satisfied while routing exceptions to an Admissions Review Queue.

---

## PHASE 1: APPLICATION SUBMISSION VALIDATION 🟡

**Status:** PARTIAL

### Validation Checklist

| Validation | Status | Implementation |
|------------|--------|----------------|
| Application is complete | ✅ | Form validation |
| Required fields completed | ✅ | Schema validation |
| Electronic signatures collected | ⚠️ | Basic signature |
| Identity verification | ⚠️ | Manual |
| Required documents uploaded | ⚠️ | Upload exists |
| Program prerequisites met | ⚠️ | Manual check |
| PARiS Interview completed | ⚠️ | Basic flow |
| Individual Success Plan generated | ⚠️ | Template |
| Orientation requirements | ❌ | Not implemented |
| Duplicate application check | ✅ | Email check |
| Fraud validation | ❌ | Not implemented |
| Eligibility validation | ⚠️ | WIOA verification |
| Funding pathway determined | ✅ | Status field |
| Seat availability confirmed | ❌ | Not implemented |

### Required Components

- [ ] Identity verification API integration
- [ ] Fraud detection system
- [ ] Seat capacity tracking
- [ ] Prerequisites validation engine

---

## PHASE 2: APPLICATION FEE ENFORCEMENT 🟡

**Status:** PARTIAL

### Business Rules

| Rule | Status | Implementation |
|------|--------|----------------|
| Fee required before processing | ✅ | Stripe checkout |
| Waivers documented | ⚠️ | Manual record |
| Payment failure notifications | ⚠️ | Email only |
| Audit trail | ⚠️ | Basic |

### Current Flow

```
Application Submitted
        ↓
Check: Application Fee Paid?
        ↓
    ┌───┴───┐
   NO        YES
    ↓         ↓
Payment    Continue
Pending    Processing
```

### Required Components

- [ ] Waiver documentation system
- [ ] Payment retry logic
- [ ] "Application Fee Required" status display
- [ ] Automatic notifications (Email + SMS)
- [ ] Fee waiver audit trail

---

## PHASE 3: AUTOMATIC ENROLLMENT DECISION ✅

**Status:** PARTIAL

### Required Conditions Matrix

| Condition | Required | Status | Auto-Enroll? |
|-----------|----------|--------|--------------|
| Application complete | ✅ | ✅ | YES |
| Application fee satisfied | ✅ | ⚠️ | YES (if paid) |
| Approved waiver | ✅ | ⚠️ | YES (if waiver) |
| Required documents approved | ✅ | ⚠️ | NO - Queue |
| PARiS Interview completed | ✅ | ⚠️ | NO - Queue |
| Individual Success Plan | ✅ | ⚠️ | YES (after PARiS) |
| Eligibility verified | ✅ | ⚠️ | NO - Queue |
| Funding verified | ✅ | ⚠️ | NO - Queue |
| Self-pay approved | ✅ | ⚠️ | YES (if paid) |
| Identity verified | ✅ | ⚠️ | NO - Queue |
| Required approvals | ✅ | ⚠️ | NO - Queue |
| Program capacity available | ✅ | ❌ | NO - Queue |
| No compliance holds | ✅ | ⚠️ | NO - Queue |

### Auto-Enrollment Actions

When ALL conditions are TRUE, automatically:

| Action | Status | Implementation |
|--------|--------|----------------|
| Approve enrollment | ⚠️ | Status update |
| Generate Student ID | ✅ | UUID |
| Create Student Account | ✅ | Supabase auth |
| Create LMS Account | ⚠️ | Partial |
| Secure login credentials | ✅ | Email/password |
| Assign user roles | ✅ | Role system |
| Enroll in programs | ✅ | Enrollment table |
| Assign instructors | ⚠️ | Manual |
| Assign certifications | ⚠️ | Basic |
| Create Student Dashboard | ⚠️ | Redirect to /lms |
| Create Digital Binder | ⚠️ | Structure exists |
| Create Financial Ledger | ⚠️ | Records |
| Create Attendance Record | ❌ | Not implemented |
| Create Academic Record | ⚠️ | LMS |
| Create Compliance Checklist | ❌ | Not implemented |
| Schedule Orientation | ❌ | Not implemented |
| Send Welcome Email | ✅ | Email sent |
| Send Welcome SMS | ⚠️ | Basic |
| Notify assigned staff | ⚠️ | Email only |

---

## PHASE 4: MANUAL REVIEW QUEUE 🟡

**Status:** PARTIAL

### Failure Reasons → Queue Entry

| Reason | Status | Queue Entry |
|--------|--------|-------------|
| Missing documents | ⚠️ | ✅ Partial |
| Failed identity verification | ⚠️ | ✅ Manual |
| Application fee outstanding | ✅ | ✅ Working |
| Funding pending | ⚠️ | ✅ Manual |
| PARiS Interview incomplete | ⚠️ | ✅ Manual |
| Eligibility requires review | ⚠️ | ✅ Manual |
| Program prerequisites not verified | ⚠️ | ✅ Manual |
| Compliance hold | ⚠️ | ✅ Manual |
| Capacity override required | ❌ | ❌ Not implemented |
| Exceptional circumstances | ⚠️ | ✅ Manual |

### Admissions Queue Dashboard

**Required Display:**

| Field | Status | Notes |
|-------|--------|-------|
| Applicant Name | ✅ | Shown in list |
| Program | ✅ | In application |
| Current Status | ✅ | Status field |
| Outstanding Requirements | ⚠️ | Manual tracking |
| Missing Documents | ⚠️ | Checklist partial |
| Missing Payments | ✅ | Status shown |
| Missing PARiS Interview | ⚠️ | Manual check |
| Missing Approvals | ⚠️ | Manual |
| Compliance Issues | ⚠️ | Manual |
| Assigned Reviewer | ⚠️ | Not automated |
| Priority Level | ❌ | Not implemented |
| Days Waiting | ❌ | Not calculated |

### Required Components

- [ ] Auto-priority scoring
- [ ] Days-in-queue tracking
- [ ] Auto-assignment to reviewers
- [ ] Escalation rules
- [ ] SLA tracking

---

## PHASE 5: STATUS TRACKING ✅

**Status:** MOSTLY COMPLETE

### Status States

| Status | Description | Auto-Set? |
|--------|-------------|-----------|
| Draft | Started but not submitted | ✅ |
| Submitted | Application received | ✅ |
| Application Fee Required | Fee not paid | ✅ |
| Payment Pending | Processing payment | ✅ |
| Documents Required | Missing documents | ✅ |
| PARiS Interview Required | PARiS not done | ✅ |
| Eligibility Review | Staff reviewing | ⚠️ |
| Funding Verification | WIOA check | ⚠️ |
| Manual Review Queue | Needs staff action | ✅ |
| Approved for Auto Enrollment | Eligible, pending confirmation | ❌ |
| Automatically Enrolled | Auto-enrolled | ✅ |
| Enrolled by Admissions | Staff enrolled | ✅ |
| Waitlisted | No capacity | ❌ |
| Declined | Rejected | ✅ |

### Status Update Requirements

| Requirement | Status |
|-------------|--------|
| Status updates trigger notifications | ⚠️ |
| Status changes logged in audit | ⚠️ |
| Real-time status display | ✅ |

---

## PHASE 6: AUTOMATED RE-EVALUATION 🟡

**Status:** NOT STARTED

### Re-Evaluation Triggers

| Trigger | Status | Implementation |
|---------|--------|----------------|
| Document uploaded | ⚠️ | Hook exists |
| Document approved | ⚠️ | Manual |
| PARiS Interview completed | ⚠️ | Status check |
| Payment received | ✅ | Webhook |
| Funding verified | ⚠️ | Manual |
| Identity verified | ⚠️ | Manual |
| Compliance hold cleared | ❌ | Not implemented |

### Required Logic

```typescript
// Pseudo-code for re-evaluation
async function reEvaluateApplication(applicationId: string) {
  const app = await getApplication(applicationId);
  
  const conditions = {
    applicationComplete: app.status !== 'Draft',
    feeSatisfied: app.fee_paid || app.waiver_approved,
    documentsApproved: await checkDocuments(app.id),
    parisComplete: app.paris_interview_completed,
    eligibilityVerified: app.eligibility_status === 'verified',
    fundingVerified: app.funding_status === 'verified' || app.payment_status === 'paid',
    identityVerified: app.identity_verified,
    noComplianceHolds: app.compliance_holds.length === 0,
  };
  
  if (Object.values(conditions).every(c => c === true)) {
    await autoEnroll(app.id);
    await notifyApplicant(app.id, 'enrolled');
  }
}
```

### Required Components

- [ ] Re-evaluation event triggers
- [ ] Condition evaluation engine
- [ ] Auto-enrollment queue processor
- [ ] Notification system enhancement

---

## DECISION FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION SUBMITTED                        │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     VALIDATION CHECK                             │
│  • Complete application?                                         │
│  • Required fields?                                              │
│  • Signatures collected?                                         │
│  • Prerequisites met?                                            │
└─────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
               FAIL                        PASS
                    │                           │
                    ▼                           ▼
            ┌───────────────┐         ┌─────────────────────────┐
            │ Return to     │         │ APPLICATION FEE CHECK   │
            │ Applicant     │         └─────────────────────────┘
            └───────────────┘                   │
                                      ┌─────────┴─────────┐
                                      ▼                   ▼
                                 WAIVED              PAID
                                      │                   │
                                      ▼                   ▼
                          ┌───────────────────┐   ┌──────────────────┐
                          │ Continue          │   │ Continue         │
                          │ Processing        │   │ Processing       │
                          └───────────────────┘   └──────────────────┘
                                              │
                                              ▼
                              ┌───────────────────────────────┐
                              │    PARI.S INTERVIEW CHECK     │
                              └───────────────────────────────┘
                                              │
                                    ┌─────────┴─────────┐
                                    ▼                   ▼
                               INCOMPLETE           COMPLETE
                                    │                   │
                                    ▼                   ▼
                            ┌───────────────┐   ┌───────────────────────┐
                            │ Add to Queue  │   │ ELIGIBILITY CHECK     │
                            │ PARiS Needed  │   └───────────────────────┘
                            └───────────────┘             │
                                              ┌────────────┴────────────┐
                                              ▼                         ▼
                                         VERIFIED                 NOT VERIFIED
                                              │                         │
                                              ▼                         ▼
                                    ┌─────────────────┐       ┌─────────────────┐
                                    │ Continue        │       │ Add to Queue    │
                                    │ Processing      │       │ Review Needed   │
                                    └─────────────────┘       └─────────────────┘
                                                            │
                                                            ▼
                              ┌───────────────────────────────────────────┐
                              │         FUNDING VERIFICATION              │
                              └───────────────────────────────────────────┘
                                                            │
                                              ┌──────────────┬──────────────┐
                                              ▼              ▼              ▼
                                         FUNDED         SELF-PAY        PENDING
                                              │              │              │
                                              ▼              ▼              ▼
                                    ┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
                                    │ Continue        │ │ Continue if  │ │ Add to Queue │
                                    │ Processing      │ │ paid         │ │ Funding Pending│
                                    └─────────────────┘ └──────────────┘ └──────────────┘
                                                            │
                                              ┌─────────────┴─────────────┐
                                              ▼                           ▼
                                            PAID                       NOT PAID
                                              │                           │
                                              ▼                           ▼
                                    ┌─────────────────┐       ┌─────────────────────┐
                                    │ ✓ ALL CONDITIONS │       │ Add to Queue        │
                                    │    MET          │       │ Payment Required     │
                                    └─────────────────┘       └─────────────────────┘
                                              │
                                              ▼
                              ┌───────────────────────────────────────────┐
                              │       AUTO-ENROLL STUDENT                 │
                              │  • Create accounts                         │
                              │  • Generate credentials                     │
                              │  • Create dashboard                        │
                              │  • Create binder                           │
                              │  • Send notifications                       │
                              └───────────────────────────────────────────┘
```

---

## REQUIRED DATABASE FIELDS

### Application Table Extensions

```sql
-- Add to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS auto_enrollment_eligible BOOLEAN;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS queue_reason TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS queue_priority INTEGER DEFAULT 0;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS assigned_reviewer UUID REFERENCES profiles(id);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS queue_entered_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_reevaluation_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS reevaluation_count INTEGER DEFAULT 0;
```

### Enrollment Queue Table

```sql
CREATE TABLE enrollment_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id),
  reason TEXT NOT NULL,
  priority INTEGER DEFAULT 5,
  status TEXT DEFAULT 'pending',
  assigned_to UUID REFERENCES profiles(id),
  notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API ENDPOINTS REQUIRED

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/enrollment/validate | POST | Validate application |
| /api/enrollment/decision | POST | Get enrollment decision |
| /api/enrollment/auto-enroll | POST | Trigger auto-enrollment |
| /api/enrollment/queue | GET | Get queue items |
| /api/enrollment/queue/:id | GET | Get queue item |
| /api/enrollment/queue/:id/assign | POST | Assign reviewer |
| /api/enrollment/queue/:id/resolve | POST | Resolve queue item |
| /api/enrollment/reevaluate | POST | Re-run decision engine |

---

## FRONTEND COMPONENTS REQUIRED

### Applicant View

| Component | Purpose |
|-----------|---------|
| ApplicationStatusBadge | Shows current status |
| RequirementsChecklist | Shows pending items |
| DocumentUploader | Upload required docs |
| PaymentButton | Pay application fee |
| ParisInterviewLauncher | Start PARiS |
| EligibilityChecker | Check WIOA status |

### Admissions Dashboard

| Component | Purpose |
|-----------|---------|
| QueueList | View all queue items |
| QueueFilters | Filter by status, priority |
| QueueDetail | View single application |
| QueueActions | Assign, escalate, resolve |
| QueueMetrics | Stats dashboard |

---

## ESTIMATED EFFORT

| Phase | Task | Hours | Priority |
|-------|------|-------|----------|
| 1 | Application Validation | 8 | HIGH |
| 2 | Fee Enforcement | 4 | HIGH |
| 3 | Auto-Enrollment | 16 | HIGH |
| 4 | Manual Review Queue | 12 | HIGH |
| 5 | Status Tracking | 4 | MEDIUM |
| 6 | Re-Evaluation Engine | 8 | HIGH |
| - | Database Schema | 4 | HIGH |
| - | API Endpoints | 8 | HIGH |
| - | Frontend Components | 16 | HIGH |
| - | Testing | 8 | HIGH |
| **Total** | | **88 hours** | |

---

## FINAL CERTIFICATION CHECKLIST

The Enrollment Decision Engine is complete only when:

- [ ] Every application is validated automatically
- [ ] Application fee rules are enforced according to policy
- [ ] Eligible applicants are automatically enrolled
- [ ] Applicants with unresolved issues are routed to queue
- [ ] Every enrollment decision is auditable
- [ ] Every status change is logged
- [ ] Manual intervention is required only for true exceptions
- [ ] Re-evaluation runs when requirements are completed

---

**Report Version:** 1.0  
**Last Updated:** July 7, 2026
