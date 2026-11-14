# INTELLIGENT LEAD, APPLICATION & AUTOMATED ENROLLMENT ENGINE

**Generated:** July 7, 2026  
**Status:** NOT STARTED  
**Objective:** Platform operates as a virtual admissions office

---

## OVERVIEW

The platform functions as a **Virtual Admissions Office**.

Every lead, application, payment, document, interview, enrollment, and communication is processed automatically.

**Manual intervention only occurs when an application fails one or more required business rules.**

This design enables scaling without adding administrative staff.

---

# PART A: LEAD GENERATION

---

## PHASE 1: LEAD GENERATION 🟡

**Status:** PARTIAL

Every inquiry automatically creates a Lead Record.

### Auto-Captured Fields

| Field | Source | Status |
|-------|--------|--------|
| Name | Form submission | ✅ |
| Email | Form submission | ✅ |
| Phone | Form submission | ✅ |
| Program of Interest | Application | ✅ |
| Lead Source | UTM/Referrer | ⚠️ |
| Campaign | UTM parameters | ⚠️ |
| Referral Source | Campaign code | ⚠️ |
| Workforce Region | Application | ⚠️ |
| Funding Interest | Application | ✅ |
| Date Created | Auto timestamp | ✅ |
| IP Address | Server capture | ⚠️ |
| Device Info | Browser detection | ❌ |

### Implementation

```typescript
// On any website form submission
async function createLead(formData: FormSubmission) {
  const lead = {
    id: uuid(),
    full_name: formData.name,
    email: formData.email,
    phone: formData.phone,
    program_interest: formData.program,
    source: getUTMSource() || getReferrer(),
    campaign: getUTMCampaign(),
    funding_interest: formData.funding || true,
    created_at: new Date().toISOString(),
    status: 'new',
    lead_score: calculateInitialScore(formData),
  };
  
  await db.from('leads').insert(lead);
  await triggerWelcomeSequence(lead.id);
  
  return lead;
}
```

### Required Components

- [ ] Website visitor tracking (analytics integration)
- [ ] Universal form → Lead creation
- [ ] UTM parameter capture library
- [ ] Referral code tracking
- [ ] Lead deduplication (email/phone)
- [ ] Source attribution reporting

---

# PART B: LEAD MANAGEMENT

---

## PHASE 2: LEAD DASHBOARD 🟡

**Status:** NOT STARTED

### Pipeline Columns

| Stage | Color | Auto-Entry | Auto-Exit |
|-------|-------|------------|-----------|
| New Lead | Blue | On creation | After 24h no contact |
| Contacted | Yellow | After outreach | On action |
| Appointment Scheduled | Purple | Calendar booked | On appointment |
| Application Started | Orange | First form field | On submit |
| Application Submitted | Green | Form complete | After review |
| Application Fee Required | Red | Fee not paid | On payment |
| Application Fee Paid | Green | Payment confirmed | Continue |
| Documents Needed | Yellow | Missing docs | On upload |
| PARiS Interview Required | Orange | Pending PARiS | On complete |
| Funding Verification | Blue | WIOA pending | On verified |
| Ready for Enrollment | Green | All conditions | Auto-enroll |
| Auto Enrolled | Green | System enrolled | Enrolled |
| Manual Review | Red | Exception | On resolution |
| Waitlisted | Gray | No capacity | On open seat |
| Not Interested | Gray | Declined | Closed |
| Closed | Gray | 60 days inactive | Archived |

### Dashboard Features

| Feature | Status | Priority |
|---------|--------|----------|
| Kanban board view | ❌ | HIGH |
| Drag-and-drop columns | ❌ | HIGH |
| Lead detail slide-out | ⚠️ | HIGH |
| Activity timeline | ❌ | MEDIUM |
| Quick action buttons | ⚠️ | HIGH |
| Bulk operations | ❌ | MEDIUM |
| Search & filters | ⚠️ | HIGH |
| Lead scoring display | ❌ | HIGH |
| Priority ranking | ❌ | HIGH |

### Required Components

- [ ] Kanban board component (drag-drop)
- [ ] Lead detail panel
- [ ] Activity timeline
- [ ] Quick action toolbar
- [ ] Filter/search system

---

## PHASE 3: AUTOMATED COMMUNICATION 🟡

**Status:** PARTIAL

### Communication Matrix

| Trigger | Timing | Channel | Template | Status |
|---------|--------|---------|----------|--------|
| Lead created | Immediate | Email | Welcome | ✅ |
| Lead created | Immediate | SMS | Welcome | ⚠️ |
| Lead created | 1 hour | Email | Program info | ❌ |
| App started | Immediate | Email | Confirmation | ✅ |
| App submitted | Immediate | Email | Receipt | ✅ |
| App submitted | Immediate | SMS | Confirmation | ⚠️ |
| Fee required | Immediate | Email | Payment link | ✅ |
| Fee required | 24 hours | SMS | Reminder | ❌ |
| Fee required | 3 days | Email | Final notice | ❌ |
| Documents needed | Immediate | Email | Checklist | ✅ |
| PARiS required | Immediate | Email | Instructions | ✅ |
| PARiS required | 3 days | SMS | Reminder | ❌ |
| Ready to enroll | Immediate | Email | Congratulations | ✅ |
| Enrolled | Immediate | SMS | Welcome | ⚠️ |

### Drip Campaign Sequences

#### Incomplete Application (7-day sequence)

```
Day 0: Application Started email
Day 1: Helpful tips email
Day 3: Reminder email + SMS
Day 5: One-on-one offer email
Day 7: Final reminder email
Day 7: Auto-enroll if all complete
```

#### Inactive Lead (30-day sequence)

```
Day 7: Re-engagement email ("Still interested?")
Day 14: Different content email
Day 21: Special offer email
Day 30: Final email + close lead
```

### Required Components

- [ ] Email template system
- [ ] SMS integration (Twilio)
- [ ] Drip campaign engine
- [ ] Activity logging
- [ ] Unsubscribe management
- [ ] A/B testing capability

---

# PART C: APPLICATION PROCESSING

---

## PHASE 4: APPLICATION VALIDATION 🟡

**Status:** PARTIAL

### Validation Rules

| Check | Auto-Fail | Manual Review | Status |
|-------|-----------|---------------|--------|
| Required fields | ✅ | - | ✅ |
| Email format | ✅ | - | ✅ |
| Phone format | ✅ | - | ✅ |
| Duplicate application | ✅ | - | ⚠️ |
| Fraud score | - | ✅ | ❌ |
| Identity verification | - | ✅ | ⚠️ |
| Age requirement | ✅ | - | ⚠️ |
| Program prerequisites | - | ✅ | ❌ |
| Geographic eligibility | ✅ | - | ⚠️ |

### Implementation

```typescript
async function validateApplication(applicationId: string) {
  const app = await getApplication(applicationId);
  const validations = [];
  
  // Required fields
  if (!app.full_name) validations.push({ field: 'full_name', error: 'required' });
  if (!app.email) validations.push({ field: 'email', error: 'required' });
  
  // Format validation
  if (app.email && !isValidEmail(app.email)) {
    validations.push({ field: 'email', error: 'invalid_format' });
  }
  
  // Duplicate check
  const duplicate = await db.from('applications')
    .select('id')
    .eq('email', app.email)
    .neq('id', applicationId)
    .single();
  
  if (duplicate) {
    validations.push({ field: 'email', error: 'duplicate' });
  }
  
  // Age check
  if (app.date_of_birth && calculateAge(app.date_of_birth) < 16) {
    validations.push({ field: 'date_of_birth', error: 'under_age' });
  }
  
  return {
    valid: validations.length === 0,
    errors: validations,
    requires_manual_review: validations.some(v => v.error === 'duplicate')
  };
}
```

---

## PHASE 5: APPLICATION FEE 🟡

**Status:** PARTIAL

### Business Rules

| Rule | Implementation | Status |
|------|----------------|--------|
| Fee required before enrollment | Stripe checkout | ✅ |
| Waiver documentation | Approved waiver record | ⚠️ |
| Payment retry logic | 3 attempts over 7 days | ❌ |
| Fee waiver audit | Waiver table + reason | ⚠️ |
| Payment receipt | Email confirmation | ✅ |

### Fee Enforcement Flow

```
Application Submitted
        ↓
┌───────────────────────────────────────┐
│         CHECK: Application Fee        │
└───────────────────────────────────────┘
        ↓
   ┌────┴────┐
   ↓          ↓
 PAID        UNPAID
   ↓          ↓
Continue    ┌─────────────────────────────────────┐
            │      APPLICATION FEE REQUIRED       │
            └─────────────────────────────────────┘
                        ↓
    ┌─────────────────┬─────────────────┬─────────────────┐
    ↓                 ↓                 ↓                 ↓
Payment Link      Email Sent       SMS Sent          Queue Entry
Sent (email)      (24h)           (48h)             (72h)
    ↓                 ↓                 ↓                 ↓
  PAID              PAID              PAID           Final Notice
    ↓                 ↓                 ↓                 ↓
 Continue         Continue          Continue       Close Application
```

### Required Components

- [ ] Automated payment link generation
- [ ] Payment retry automation
- [ ] SMS reminders
- [ ] Final notice template
- [ ] Auto-close after expiration

---

## PHASE 6: PARiS INTERVIEW 🟡

**Status:** PARTIAL

### Required Completion

| Component | Stored | Attached to Binder | Status |
|-----------|--------|-------------------|--------|
| Career interest interview | ✅ | ✅ | ⚠️ |
| Soft skills assessment | ✅ | ✅ | ⚠️ |
| Employment readiness | ✅ | ✅ | ⚠️ |
| Learning style | ✅ | ✅ | ⚠️ |
| Barrier assessment | ✅ | ✅ | ⚠️ |
| Workforce readiness | ✅ | ✅ | ⚠️ |
| Goal setting | ✅ | ✅ | ⚠️ |
| Career pathway | ✅ | ✅ | ⚠️ |
| Program fit analysis | ✅ | ✅ | ⚠️ |
| Support needs | ✅ | ✅ | ⚠️ |
| Career Readiness Score | ✅ | ✅ | ⚠️ |
| Individual Success Plan | ✅ | ✅ | ⚠️ |

### PARiS Gate

```typescript
async function checkPARISComplete(applicationId: string): Promise<boolean> {
  const paris = await db.from('paris_interviews')
    .select('*')
    .eq('application_id', applicationId)
    .single();
  
  if (!paris) return false;
  
  const requiredFields = [
    'career_interests',
    'skills_assessment',
    'employment_readiness',
    'barriers',
    'goals',
    'support_needs'
  ];
  
  return requiredFields.every(field => paris[field] !== null);
}
```

---

# PART D: ENROLLMENT DECISION

---

## PHASE 7: AUTOMATIC ENROLLMENT 🟡

**Status:** PARTIAL

### Decision Matrix

| Condition | Required | Status | Auto-Enroll |
|-----------|----------|--------|-------------|
| Application complete | ✅ | ✅ | - |
| Application fee paid | OR waiver | ⚠️ | YES |
| Documents approved | ✅ | ⚠️ | NO |
| PARiS Interview complete | ✅ | ⚠️ | NO |
| ISP generated | ✅ | ⚠️ | YES |
| Eligibility verified | ✅ | ⚠️ | NO |
| Funding verified | OR self-pay | ⚠️ | NO |
| Identity verified | (if required) | ⚠️ | NO |
| No compliance holds | ✅ | ⚠️ | NO |
| Program capacity | ✅ | ❌ | NO |

### Auto-Enrollment Trigger

```typescript
async function evaluateEnrollmentEligibility(applicationId: string) {
  const checks = {
    applicationComplete: await checkApplicationComplete(applicationId),
    feeSatisfied: await checkFeePaid(applicationId) || await checkWaiverApproved(applicationId),
    documentsApproved: await checkAllDocumentsApproved(applicationId),
    parisComplete: await checkPARISComplete(applicationId),
    eligibilityVerified: await checkEligibilityVerified(applicationId),
    fundingVerified: await checkFundingVerified(applicationId) || await checkSelfPay(applicationId),
    identityVerified: await checkIdentityVerified(applicationId),
    noComplianceHolds: await checkNoComplianceHolds(applicationId),
    capacityAvailable: await checkCapacityAvailable(applicationId),
  };
  
  const allPassed = Object.values(checks).every(c => c === true);
  const failures = Object.entries(checks).filter(([k, v]) => !v).map(([k]) => k);
  
  if (allPassed) {
    await autoEnrollStudent(applicationId);
    await notifyEnrollmentComplete(applicationId);
  } else {
    await routeToManualReview(applicationId, failures);
  }
  
  return { eligible: allPassed, failures };
}
```

### Auto-Enrollment Actions

When ALL conditions are TRUE, automatically execute:

| Action | Status | Notes |
|--------|--------|-------|
| Set enrollment status to "enrolled" | ✅ | |
| Generate student ID | ✅ | UUID |
| Create student account | ✅ | Supabase auth |
| Create LMS account | ⚠️ | Partial |
| Generate credentials | ✅ | Email + temp password |
| Assign student role | ✅ | |
| Enroll in program | ✅ | |
| Assign instructor | ⚠️ | Manual |
| Assign certifications | ⚠️ | Basic |
| Create Student Dashboard | ⚠️ | Redirect |
| Create Digital Binder | ⚠️ | Structure exists |
| Create Financial Ledger | ⚠️ | Records |
| Create Attendance Record | ❌ | Not implemented |
| Create Academic Record | ⚠️ | LMS |
| Create Compliance Checklist | ❌ | Not implemented |
| Schedule Orientation | ❌ | Not implemented |
| Send Welcome Email | ✅ | |
| Send Welcome SMS | ⚠️ | Basic |
| Notify assigned staff | ⚠️ | Email only |

---

## PHASE 8: MANUAL REVIEW QUEUE 🟡

**Status:** PARTIAL

### Queue Entry Triggers

| Reason | Priority | SLA |
|--------|----------|-----|
| Missing documents | HIGH | 24h |
| Failed identity verification | HIGH | 24h |
| Funding issue | MEDIUM | 48h |
| Eligibility exception | HIGH | 24h |
| PARiS incomplete | MEDIUM | 48h |
| Payment exception | HIGH | 24h |
| Compliance hold | HIGH | 24h |
| Capacity override | MEDIUM | 48h |
| Duplicate application | LOW | 72h |

### Queue Dashboard Display

| Field | Status |
|-------|--------|
| Applicant Name | ✅ |
| Program Applied | ✅ |
| Current Status | ✅ |
| Failure Reasons | ⚠️ |
| Missing Documents | ⚠️ |
| Missing Payments | ✅ |
| PARiS Status | ⚠️ |
| Assigned Reviewer | ❌ |
| Priority Level | ❌ |
| Days in Queue | ❌ |
| SLA Due | ❌ |

### Required Components

- [ ] Priority scoring algorithm
- [ ] SLA tracking
- [ ] Auto-assignment logic
- [ ] Escalation rules
- [ ] Resolution tracking

---

## PHASE 9: AUTOMATIC REPROCESSING 🟡

**Status:** NOT STARTED

### Re-Evaluation Triggers

| Event | Triggers Re-Evaluation | Status |
|-------|----------------------|--------|
| Document uploaded | ✅ | ⚠️ |
| Document approved | ✅ | ⚠️ |
| PARiS completed | ✅ | ⚠️ |
| Payment received | ✅ | ✅ |
| Funding verified | ✅ | ⚠️ |
| Identity verified | ✅ | ⚠️ |
| Compliance cleared | ✅ | ❌ |
| Eligibility approved | ✅ | ⚠️ |

### Implementation

```typescript
// Database trigger or webhook
async function onRequirementComplete(applicationId: string, requirement: string) {
  // Log the completion
  await logActivity(applicationId, `${requirement}_completed`);
  
  // Re-evaluate eligibility
  const { eligible, failures } = await evaluateEnrollmentEligibility(applicationId);
  
  if (eligible) {
    // Auto-enroll!
    await autoEnrollStudent(applicationId);
    await notifyEnrollmentComplete(applicationId);
    
    // Remove from queue if present
    await removeFromQueue(applicationId);
    
    // Log the decision
    await logDecision(applicationId, 'auto_enrolled', { trigger: requirement });
  } else {
    // Update queue with remaining failures
    await updateQueueItem(applicationId, { failures });
  }
}
```

### Required Components

- [ ] Event trigger system
- [ ] Re-evaluation queue processor
- [ ] Queue removal logic
- [ ] Audit logging

---

# PART E: DASHBOARD AUTOMATION

---

## PHASE 10: PRE-CREATED DASHBOARDS 🟡

**Status:** PARTIAL

Once enrolled, automatically create:

### Student Dashboard Components

| Component | Status | Pre-Populated |
|-----------|--------|----------------|
| Welcome message | ✅ | ✅ Name |
| Orientation checklist | ⚠️ | ⚠️ Partial |
| Program progress | ✅ | ✅ |
| Course list | ✅ | ✅ |
| Calendar | ⚠️ | ⚠️ Basic |
| Tasks | ⚠️ | ⚠️ |
| Messages | ✅ | ✅ |
| Notifications | ✅ | ✅ |
| Financial status | ⚠️ | ⚠️ |
| Attendance | ⚠️ | ⚠️ |
| Grades | ✅ | ✅ |
| Certifications | ⚠️ | ⚠️ |
| Digital Binder | ⚠️ | ⚠️ |
| Career Center | ⚠️ | ⚠️ |

### Pre-Login Dashboard

Student should log in and find:

- [ ] Welcome message with name
- [ ] Orientation video ready
- [ ] Assigned instructor visible
- [ ] Course schedule available
- [ ] First assignment ready
- [ ] Digital Binder populated
- [ ] Financial status clear
- [ ] Next steps obvious

---

# PART F: LEAD INTELLIGENCE

---

## PHASE 11: LEAD SCORING 🟡

**Status:** NOT STARTED

### Score Components

| Factor | Weight | Calculation | Status |
|--------|--------|-------------|--------|
| Program fit | 20% | Match level | ❌ |
| Funding likelihood | 20% | Eligibility | ❌ |
| Engagement level | 20% | Email opens, clicks | ❌ |
| Completion probability | 20% | Application progress | ❌ |
| Risk indicators | 20% | Barriers, issues | ❌ |

### Scoring Implementation

```typescript
function calculateLeadScore(lead: Lead): LeadScore {
  const scores = {
    programFit: calculateProgramFit(lead), // 0-100
    fundingLikelihood: calculateFundingLikelihood(lead), // 0-100
    engagementLevel: calculateEngagement(lead), // 0-100
    completionProbability: calculateCompletionProb(lead), // 0-100
    riskIndicators: calculateRisk(lead), // 0-100 (inverse)
  };
  
  const totalScore = (
    scores.programFit * 0.20 +
    scores.fundingLikelihood * 0.20 +
    scores.engagementLevel * 0.20 +
    scores.completionProbability * 0.20 +
    scores.riskIndicators * 0.20
  );
  
  return {
    total: Math.round(totalScore),
    grade: totalScore >= 80 ? 'A' : totalScore >= 60 ? 'B' : totalScore >= 40 ? 'C' : 'D',
    components: scores,
    priority: totalScore >= 70 ? 'HIGH' : totalScore >= 40 ? 'MEDIUM' : 'LOW'
  };
}
```

### Dashboard Priority

Leads should be sorted by:

1. Priority (HIGH → LOW)
2. Score (High → Low)
3. Days in queue (Oldest first)

---

# PART G: COMPLETE AUTOMATION FLOW

---

## FULL LIFECYCLE FLOW

```
VISITOR LANDS ON WEBSITE
        ↓
┌───────────────────────────────────────┐
│     AUTOMATIC LEAD CREATION           │
│  • Capture UTM/source               │
│  • Create lead record                │
│  • Trigger welcome sequence          │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│     LEAD DASHBOARD UPDATED           │
│  • New Lead column                   │
│  • Score calculated                  │
│  • Priority assigned                 │
└───────────────────────────────────────┘
        ↓
    ┌───┴───┐
    ↓       ↓
APPLY    NO ACTION
    ↓       
┌───────────────────────────────────────┐
│     APPLICATION SUBMITTED            │
│  • Validate all fields              │
│  • Check duplicates                 │
│  • Update pipeline                  │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│     APPLICATION FEE CHECK            │
└───────────────────────────────────────┘
        ↓
   ┌────┴────┐
   ↓          ↓
 PAID        UNPAID → Payment reminders
   ↓             ↓
┌───────────────────────────────────────┐
│     PARiS INTERVIEW REQUIRED         │
│  • Schedule interview               │
│  • Generate ISP                     │
│  • Calculate readiness score        │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│     ELIGIBILITY & FUNDING CHECK     │
│  • Verify workforce eligibility    │
│  • Process funding application      │
└───────────────────────────────────────┘
        ↓
   ┌───┴───┐
   ↓       ↓
ALL OK   ISSUES
   ↓       ↓
┌───────────────────────────────┐
│     AUTO-ENROLLMENT          │
│  • Create all accounts       │
│  • Create dashboards         │
│  • Populate binder           │
│  • Send welcome              │
│  • Schedule orientation      │
└───────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│     STUDENT LOGS IN                  │
│  • Dashboard ready                  │
│  • First day prepared               │
│  • Everything automatic             │
└───────────────────────────────────────┘

EXCEPTION PATH (if any condition fails)
        ↓
┌───────────────────────────────────────┐
│     MANUAL REVIEW QUEUE              │
│  • Show failure reasons            │
│  • Assign priority                 │
│  • Track SLA                       │
└───────────────────────────────────────┘
        ↓
   STAFF REVIEWS
        ↓
┌───────────────────────────────────────┐
│     ISSUE RESOLVED                  │
│  • Approve/reject                  │
│  • Add notes                       │
│  • System re-evaluates             │
└───────────────────────────────────────┘
        ↓
   ALL CONDITIONS MET?
        ↓
   ┌───┴───┐
   ↓       ↓
  YES      NO
   ↓       ↓
AUTO-ENROLL  KEEP IN QUEUE
```

---

# ESTIMATED EFFORT

| Phase | Component | Hours | Priority |
|-------|-----------|-------|----------|
| 1 | Lead Generation | 16 | HIGH |
| 2 | Lead Dashboard (Kanban) | 32 | HIGH |
| 3 | Automated Communication | 24 | HIGH |
| 4 | Application Validation | 12 | HIGH |
| 5 | Fee Enforcement | 8 | HIGH |
| 6 | PARiS Integration | 24 | HIGH |
| 7 | Auto-Enrollment | 16 | HIGH |
| 8 | Manual Review Queue | 16 | HIGH |
| 9 | Reprocessing Engine | 12 | HIGH |
| 10 | Dashboard Pre-creation | 24 | HIGH |
| 11 | Lead Scoring | 16 | MEDIUM |
| - | Testing | 16 | HIGH |
| - | Documentation | 8 | MEDIUM |
| **Total** | | **224 hours** | |

---

# FINAL CERTIFICATION CHECKLIST

The Virtual Admissions Office is complete only when:

- [ ] Every lead is automatically captured
- [ ] Every lead appears in the pipeline
- [ ] Automated communications run without manual triggers
- [ ] Application validation is automatic
- [ ] Application fee enforcement is automatic
- [ ] PARiS interview gates enrollment
- [ ] All TRUE conditions → Auto-enroll
- [ ] Any FALSE condition → Manual queue
- [ ] Re-processing runs when requirements complete
- [ ] Student dashboards are pre-populated
- [ ] Lead scoring prioritizes attention
- [ ] Staff only handles true exceptions

**Manual intervention required only for:**
- True exceptions (missing docs, identity issues, funding problems)
- Policy decisions requiring human approval
- Escalated complaints
- Exceptional circumstances

---

**Report Version:** 2.0  
**Last Updated:** July 7, 2026
