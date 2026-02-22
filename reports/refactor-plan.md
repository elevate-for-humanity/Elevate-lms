# File-by-File Refactor Plan

Generated: 2026-02-01 (Updated)

## Overview

This document provides a file-by-file plan to align the codebase with the three program types:

1. **`internal_apprenticeship`** - Barber (hours + placements)
2. **`external_lms_wrapped`** - HVAC (CareerSafe LMS + credential verification)
3. **`external_referral`** - Future only (intake + handoff)

---

## Priority 1: Database Schema Updates

### Migration: Add program_type Column

**File**: `supabase/migrations/YYYYMMDD_add_program_type.sql`

**Action**: CREATE

```sql
-- Add program_type column
ALTER TABLE programs ADD COLUMN IF NOT EXISTS program_type TEXT;
ALTER TABLE programs ADD CONSTRAINT programs_type_check 
  CHECK (program_type IN ('internal_apprenticeship', 'external_lms_wrapped', 'external_referral'));

-- Add related columns
ALTER TABLE programs ADD COLUMN IF NOT EXISTS credential_partner TEXT;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS internal_hours_tracked BOOLEAN DEFAULT false;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS placement_required BOOLEAN DEFAULT false;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS completion_method TEXT 
  CHECK (completion_method IN ('hours_and_documents', 'credential_verification', 'referral_handoff'));

-- Set existing programs
UPDATE programs SET 
  program_type = 'internal_apprenticeship',
  internal_hours_tracked = true,
  placement_required = true,
  completion_method = 'hours_and_documents'
WHERE slug = 'barber-apprenticeship';

UPDATE programs SET 
  program_type = 'external_lms_wrapped',
  credential_partner = 'CareerSafe',
  internal_hours_tracked = false,
  placement_required = false,
  completion_method = 'credential_verification',
  price_cents = 550000
WHERE slug = 'hvac-technician';

-- Default remaining programs
UPDATE programs SET program_type = 'internal_apprenticeship' WHERE program_type IS NULL;
```

**Tables**: `programs`

---

### Migration: Add Enrollment Columns for External LMS

**File**: `supabase/migrations/YYYYMMDD_enrollment_lms_columns.sql`

**Action**: CREATE

```sql
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS lms_access_granted_at TIMESTAMPTZ;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS credential_verified_at TIMESTAMPTZ;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS credential_document_id UUID REFERENCES documents(id);
```

**Tables**: `enrollments`

---

### Migration: Add Program Type RLS Policies

**File**: `supabase/migrations/YYYYMMDD_program_type_rls.sql`

**Action**: CREATE

```sql
-- Drop existing policies that don't check program_type
DROP POLICY IF EXISTS "hours_instructor_insert" ON attendance_hours;
DROP POLICY IF EXISTS "assignments_admin_all" ON apprentice_assignments;

-- Recreate with program_type check (see rls-plan.md for full SQL)
```

**Tables**: `attendance_hours`, `apprentice_assignments`

---

## Priority 2: API Route Updates

### `/app/api/attendance-hours/route.ts`

**Action**: UPDATE

**Current**: May not check program_type

**Change**: Add program_type validation before INSERT

```typescript
// Add this check before inserting hours
const { data: enrollment } = await supabase
  .from('enrollments')
  .select('program_id, programs(program_type)')
  .eq('id', body.enrollment_id)
  .single();

if (enrollment?.programs?.program_type !== 'internal_apprenticeship') {
  return NextResponse.json(
    { error: 'Hours tracking is not available for this program type' },
    { status: 400 }
  );
}
```

**Tables**: `attendance_hours`, `enrollments`, `programs`

**Roles**: Instructor (internal_apprenticeship only), Admin

---

### `/app/api/apprentice-assignments/route.ts`

**Action**: UPDATE

**Current**: May not check program_type

**Change**: Add program_type validation before INSERT

```typescript
// Add this check before creating assignment
const { data: enrollment } = await supabase
  .from('enrollments')
  .select('program_id, programs(program_type)')
  .eq('id', body.enrollment_id)
  .single();

if (enrollment?.programs?.program_type !== 'internal_apprenticeship') {
  return NextResponse.json(
    { error: 'Site placements are not available for this program type' },
    { status: 400 }
  );
}
```

**Tables**: `apprentice_assignments`, `enrollments`, `programs`

**Roles**: Admin, Instructor (internal_apprenticeship only)

---

### `/app/api/career-courses/purchase/route.ts`

**Action**: VERIFY/CREATE

**Current**: May exist for CareerSafe purchases

**Change**: Ensure it supports funding-based purchases (no Stripe charge)

```typescript
export async function POST(req: Request) {
  const body = await req.json();
  const { enrollment_id, course_id, funding_source } = body;
  
  // Verify enrollment is external_lms_wrapped
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('program_id, programs(program_type, price_cents)')
    .eq('id', enrollment_id)
    .single();
    
  if (enrollment?.programs?.program_type !== 'external_lms_wrapped') {
    return NextResponse.json(
      { error: 'Career course purchases only available for external LMS programs' },
      { status: 400 }
    );
  }
  
  // Create purchase record (funding-based, no Stripe)
  const { data, error } = await supabase
    .from('career_course_purchases')
    .insert({
      user_id: user.id,
      enrollment_id,
      course_id,
      payment_method: 'funding',
      funding_source,
      amount_cents: enrollment.programs.price_cents,
      student_paid_cents: 0,
      access_granted_at: new Date().toISOString()
    });
    
  // Grant LMS access
  await supabase
    .from('enrollments')
    .update({ lms_access_granted_at: new Date().toISOString() })
    .eq('id', enrollment_id);
    
  return NextResponse.json({ ok: true, data });
}
```

**Tables**: `career_course_purchases`, `enrollments`

**Roles**: Admin, User (own enrollment)

---

### `/app/api/enrollments/[id]/verify-credential/route.ts`

**Action**: CREATE

**Purpose**: Admin verifies uploaded credential for HVAC completion

```typescript
export async function POST(req: Request, { params }: { params: { id: string } }) {
  // Verify admin role
  // ...
  
  const { document_id } = await req.json();
  
  // Verify enrollment is external_lms_wrapped
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('program_id, programs(program_type)')
    .eq('id', params.id)
    .single();
    
  if (enrollment?.programs?.program_type !== 'external_lms_wrapped') {
    return NextResponse.json(
      { error: 'Credential verification only for external LMS programs' },
      { status: 400 }
    );
  }
  
  // Update enrollment with credential verification
  await supabase
    .from('enrollments')
    .update({
      credential_verified_at: new Date().toISOString(),
      credential_document_id: document_id
    })
    .eq('id', params.id);
    
  // Check if enrollment can be completed
  // (credential verified + required docs verified)
  
  return NextResponse.json({ ok: true });
}
```

**Tables**: `enrollments`, `documents`

**Roles**: Admin only

---

## Priority 3: Admin UI Updates

### `/app/admin/enrollments/[id]/page.tsx`

**Action**: UPDATE

**Current**: May show hours/placement UI for all enrollments

**Change**: Conditionally render based on program_type

```tsx
export default async function EnrollmentDetailPage({ params }) {
  const enrollment = await getEnrollment(params.id);
  const programType = enrollment?.program?.program_type;
  
  return (
    <div>
      <EnrollmentHeader enrollment={enrollment} />
      
      {/* Common sections */}
      <StudentInfo enrollment={enrollment} />
      <DocumentsSection enrollment={enrollment} />
      
      {/* internal_apprenticeship only */}
      {programType === 'internal_apprenticeship' && (
        <>
          <CohortAssignment enrollment={enrollment} />
          <SitePlacement enrollment={enrollment} />
          <HoursLog enrollment={enrollment} />
        </>
      )}
      
      {/* external_lms_wrapped only */}
      {programType === 'external_lms_wrapped' && (
        <>
          <LMSAccessStatus enrollment={enrollment} />
          <CredentialVerification enrollment={enrollment} />
        </>
      )}
      
      <AuditLog enrollment={enrollment} />
    </div>
  );
}
```

**Tables**: `enrollments`, `programs`

**Roles**: Admin

---

### `/app/admin/programs/[slug]/page.tsx`

**Action**: UPDATE

**Current**: May not show program_type

**Change**: Display and allow editing of program_type

```tsx
// Add program_type selector
<Select
  label="Program Type"
  value={program.program_type}
  options={[
    { value: 'internal_apprenticeship', label: 'Internal Apprenticeship (Hours + Placements)' },
    { value: 'external_lms_wrapped', label: 'External LMS (CareerSafe)' },
    { value: 'external_referral', label: 'External Referral (Handoff Only)' }
  ]}
/>

{/* Show credential partner for external_lms_wrapped */}
{program.program_type === 'external_lms_wrapped' && (
  <Input
    label="Credential Partner"
    value={program.credential_partner}
    placeholder="e.g., CareerSafe"
  />
)}
```

**Tables**: `programs`

**Roles**: Admin

---

## Priority 4: Student Dashboard Updates

### `/app/dashboard/page.tsx`

**Action**: UPDATE

**Current**: May show hours/placement for all students

**Change**: Conditionally render based on program_type

```tsx
export default async function StudentDashboard() {
  const enrollment = await getActiveEnrollment();
  const programType = enrollment?.program?.program_type;
  
  return (
    <Dashboard>
      <WelcomeSection />
      <EnrollmentStatus enrollment={enrollment} />
      
      {/* internal_apprenticeship: Show hours and placement */}
      {programType === 'internal_apprenticeship' && (
        <>
          <HoursProgress 
            completed={enrollment.hours_completed}
            required={enrollment.program.total_hours}
          />
          <PlacementInfo assignment={enrollment.assignment} />
          <CohortInfo cohort={enrollment.cohort} />
        </>
      )}
      
      {/* external_lms_wrapped: Show LMS access and credential upload */}
      {programType === 'external_lms_wrapped' && (
        <>
          <LMSAccessCard 
            provider={enrollment.program.credential_partner}
            accessGranted={enrollment.lms_access_granted_at}
          />
          <CredentialUploadCard 
            verified={enrollment.credential_verified_at}
          />
        </>
      )}
      
      {/* Common: Documents */}
      <DocumentsSection enrollment={enrollment} />
    </Dashboard>
  );
}
```

**Tables**: `enrollments`, `programs`

**Roles**: Student (own data)

---

### `/app/dashboard/progress/page.tsx`

**Action**: UPDATE

**Current**: Shows hours progress for all

**Change**: Different progress views by program_type

```tsx
export default async function ProgressPage() {
  const enrollment = await getActiveEnrollment();
  const programType = enrollment?.program?.program_type;
  
  if (programType === 'internal_apprenticeship') {
    return <ApprenticeshipProgress enrollment={enrollment} />;
  }
  
  if (programType === 'external_lms_wrapped') {
    return <LMSProgress enrollment={enrollment} />;
  }
  
  return <GenericProgress enrollment={enrollment} />;
}
```

---

## Priority 5: HVAC-Specific Routes

### `/app/programs/hvac-technician/page.tsx`

**Action**: VERIFY

**Current**: Should exist

**Change**: Ensure it shows:
- Price ($5,500 - ETPL-approved)
- Funding badge (WIOA covers 100%)
- CareerSafe curriculum info
- NO hours tracking mention
- NO placement mention

---

### `/app/apply/hvac-technician/page.tsx`

**Action**: VERIFY

**Current**: Should use standard application flow

**Change**: Ensure application creates record with:
- `program_id` linked to HVAC
- Funding eligibility questions
- NO questions about host shop or placement

---

### `/app/dashboard/lms-access/page.tsx`

**Action**: CREATE

**Purpose**: HVAC students access CareerSafe LMS

```tsx
export default async function LMSAccessPage() {
  const enrollment = await getActiveEnrollment();
  
  if (enrollment?.program?.program_type !== 'external_lms_wrapped') {
    redirect('/dashboard');
  }
  
  const hasAccess = !!enrollment.lms_access_granted_at;
  
  return (
    <div>
      <h1>Course Access</h1>
      
      {hasAccess ? (
        <>
          <p>Your access to {enrollment.program.credential_partner} is active.</p>
          <a 
            href="https://www.careersafeonline.com" 
            target="_blank"
            className="btn-primary"
          >
            Launch CareerSafe
          </a>
        </>
      ) : (
        <p>Your LMS access is being set up. Please check back soon.</p>
      )}
      
      <CredentialUploadSection enrollment={enrollment} />
    </div>
  );
}
```

**Tables**: `enrollments`, `career_course_purchases`

**Roles**: Student (own enrollment, external_lms_wrapped only)

---

## Priority 6: Instructor Portal Updates

### `/app/instructor/attendance/page.tsx`

**Action**: UPDATE

**Current**: May show all cohorts

**Change**: Only show cohorts for internal_apprenticeship programs

```tsx
export default async function InstructorAttendance() {
  const cohorts = await getInstructorCohorts();
  
  // Filter to only internal_apprenticeship
  const apprenticeshipCohorts = cohorts.filter(
    c => c.program?.program_type === 'internal_apprenticeship'
  );
  
  if (apprenticeshipCohorts.length === 0) {
    return <p>No apprenticeship cohorts assigned for hour logging.</p>;
  }
  
  return <AttendanceLogger cohorts={apprenticeshipCohorts} />;
}
```

**Tables**: `cohorts`, `programs`, `attendance_hours`

**Roles**: Instructor (internal_apprenticeship only)

---

## Priority 7: Partner Portal Updates

### `/app/partners/admin/placements/page.tsx`

**Action**: UPDATE

**Current**: May show all enrollments

**Change**: Only show internal_apprenticeship enrollments

```tsx
export default async function PartnerPlacements() {
  const assignments = await getPartnerAssignments();
  
  // All assignments should already be internal_apprenticeship
  // (RLS prevents external_lms_wrapped from having assignments)
  
  return <PlacementsList assignments={assignments} />;
}
```

**Tables**: `apprentice_assignments`, `enrollments`

**Roles**: Partner (own sites, internal_apprenticeship only)

---

## Files to DELETE

| File | Reason |
|------|--------|
| Any route assuming HVAC has hours | Incorrect model |
| Any route assuming HVAC has placements | Incorrect model |
| `/app/admin/program-holders/*` | Replaced by `/admin/partners` |

---

## Verification Checklist

After refactoring, verify:

### Barber (internal_apprenticeship)
- [ ] Application creates record with program_id
- [ ] Enrollment links to cohort
- [ ] Site assignment works
- [ ] Hours can be logged by instructor
- [ ] Student sees hours progress (read-only)
- [ ] Completion requires hours + documents

### HVAC (external_lms_wrapped)
- [ ] Application creates record with program_id
- [ ] Enrollment created with funding source
- [ ] LMS access granted (career_course_purchases)
- [ ] Student sees LMS access button (NOT hours)
- [ ] Student can upload credential
- [ ] Admin can verify credential
- [ ] Completion requires credential + documents
- [ ] Hours logging is BLOCKED (RLS + API)
- [ ] Site assignment is BLOCKED (RLS + API)

### Both
- [ ] Audit logs capture all actions
- [ ] RLS prevents cross-tenant access
- [ ] Admin can manage all
