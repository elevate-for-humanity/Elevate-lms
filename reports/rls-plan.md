# RLS Policy Plan

Generated: 2026-02-01 (Updated)

## Overview

All RLS policies use `auth.uid()` for user identification. This update adds **program_type enforcement** to prevent HVAC (external_lms_wrapped) programs from using apprenticeship-specific tables.

---

## Program Type Enforcement (Critical)

### Tables FORBIDDEN for external_lms_wrapped (HVAC)

| Table | Reason |
|-------|--------|
| `attendance_hours` | HVAC does not track hours internally |
| `apprentice_assignments` | HVAC has no placements |
| `cohorts` (write) | HVAC does not use cohorts |

### Enforcement Strategy

1. **RLS Policy Check**: Verify program_type before INSERT
2. **API Layer Check**: Validate program_type in route handlers
3. **UI Layer**: Hide hour/placement UI for HVAC students

---

## Role Definitions

| Role | Description | Access Level |
|------|-------------|--------------|
| `student` | Enrolled learner | Own data only |
| `instructor` | Teaches cohorts | Assigned cohorts + students |
| `partner` | Partner org rep | Own org's sites + apprentices |
| `admin` | System admin | Full access |
| `super_admin` | Super admin | Full access |

---

## Program Type Enforcement Policies

### attendance_hours - FORBID external_lms_wrapped

```sql
-- Drop existing insert policy if it doesn't check program_type
DROP POLICY IF EXISTS "hours_instructor_insert" ON attendance_hours;

-- New policy: Only allow hours for internal_apprenticeship programs
CREATE POLICY "hours_instructor_insert" ON attendance_hours
FOR INSERT TO authenticated
WITH CHECK (
  -- Must be instructor/admin
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
  AND
  -- Program must be internal_apprenticeship
  EXISTS (
    SELECT 1 FROM enrollments e
    JOIN programs p ON e.program_id = p.id
    WHERE e.id = attendance_hours.enrollment_id
    AND p.program_type = 'internal_apprenticeship'
  )
);
```

### apprentice_assignments - FORBID external_lms_wrapped

```sql
-- Drop existing insert policy
DROP POLICY IF EXISTS "assignments_admin_all" ON apprentice_assignments;

-- New policy: Only allow assignments for internal_apprenticeship programs
CREATE POLICY "assignments_create" ON apprentice_assignments
FOR INSERT TO authenticated
WITH CHECK (
  -- Must be admin/instructor
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
  AND
  -- Program must be internal_apprenticeship
  EXISTS (
    SELECT 1 FROM enrollments e
    JOIN programs p ON e.program_id = p.id
    WHERE e.id = apprentice_assignments.enrollment_id
    AND p.program_type = 'internal_apprenticeship'
  )
);

-- Admin can still read/update/delete all
CREATE POLICY "assignments_admin_manage" ON apprentice_assignments
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
```

### career_course_purchases - ALLOW external_lms_wrapped ONLY

```sql
-- Only allow purchases for external_lms_wrapped programs
CREATE POLICY "career_purchases_create" ON career_course_purchases
FOR INSERT TO authenticated
WITH CHECK (
  -- User is purchasing for themselves OR admin
  (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ))
  AND
  -- If linked to enrollment, program must be external_lms_wrapped
  (enrollment_id IS NULL OR EXISTS (
    SELECT 1 FROM enrollments e
    JOIN programs p ON e.program_id = p.id
    WHERE e.id = career_course_purchases.enrollment_id
    AND p.program_type = 'external_lms_wrapped'
  ))
);

-- Users can read their own purchases
CREATE POLICY "career_purchases_read_own" ON career_course_purchases
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Admin can manage all
CREATE POLICY "career_purchases_admin_all" ON career_course_purchases
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
```

---

## Standard Policies (Unchanged)

### profiles

```sql
-- Users can read their own profile
CREATE POLICY "profiles_read_own" ON profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Admin can manage all profiles
CREATE POLICY "profiles_admin_all" ON profiles
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'super_admin')
  )
);
```

### programs

```sql
-- Public can read active programs
CREATE POLICY "programs_public_read" ON programs
FOR SELECT
USING (status = 'active');

-- Admin can manage all programs
CREATE POLICY "programs_admin_all" ON programs
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
```

### intakes

```sql
-- Public can create intakes (lead capture)
CREATE POLICY "intakes_public_insert" ON intakes
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Admin can manage all intakes
CREATE POLICY "intakes_admin_all" ON intakes
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
```

### applications

```sql
-- Public can submit applications
CREATE POLICY "applications_public_insert" ON applications
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Users can read their own applications
CREATE POLICY "applications_read_own" ON applications
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR
  email = (SELECT email FROM profiles WHERE id = auth.uid())
);

-- Admin can manage all applications
CREATE POLICY "applications_admin_all" ON applications
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
```

### enrollments

```sql
-- Students can read their own enrollments
CREATE POLICY "enrollments_read_own" ON enrollments
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Instructors can read enrollments in their cohorts (internal_apprenticeship only)
CREATE POLICY "enrollments_instructor_read" ON enrollments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cohorts
    WHERE cohorts.id = enrollments.cohort_id
    AND cohorts.instructor_id = auth.uid()
  )
);

-- Admin can manage all enrollments
CREATE POLICY "enrollments_admin_all" ON enrollments
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
```

### attendance_hours (Updated with program_type check)

```sql
-- Students can view their own hours (READ ONLY)
CREATE POLICY "hours_student_read" ON attendance_hours
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM enrollments
    WHERE enrollments.id = attendance_hours.enrollment_id
    AND enrollments.user_id = auth.uid()
  )
);

-- Instructors can log hours (ONLY for internal_apprenticeship)
CREATE POLICY "hours_instructor_insert" ON attendance_hours
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
  AND
  EXISTS (
    SELECT 1 FROM enrollments e
    JOIN programs p ON e.program_id = p.id
    WHERE e.id = attendance_hours.enrollment_id
    AND p.program_type = 'internal_apprenticeship'
  )
);

-- Instructors can update hours
CREATE POLICY "hours_instructor_update" ON attendance_hours
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);

-- Only admin can delete hours
CREATE POLICY "hours_admin_delete" ON attendance_hours
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
```

### documents

```sql
-- Users can read their own documents
CREATE POLICY "documents_read_own" ON documents
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Users can upload their own documents
CREATE POLICY "documents_upload_own" ON documents
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admin can manage all documents
CREATE POLICY "documents_admin_all" ON documents
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
```

### audit_logs

```sql
-- Admin can read all audit logs
CREATE POLICY "audit_logs_admin_read" ON audit_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- System can insert audit logs
CREATE POLICY "audit_logs_insert" ON audit_logs
FOR INSERT TO authenticated
WITH CHECK (true);
```

---

## Security Matrix by Program Type

### internal_apprenticeship (Barber)

| Table | Student | Instructor | Partner | Admin |
|-------|---------|------------|---------|-------|
| enrollments | Read own | Read cohort | - | All |
| cohorts | - | Read assigned | - | All |
| attendance_hours | Read own | CRUD cohort | - | All |
| apprentice_assignments | Read own | CRUD | Read own sites | All |
| partner_sites | - | - | CRUD own | All |
| documents | CRUD own | Read cohort | - | All |

### external_lms_wrapped (HVAC)

| Table | Student | Instructor | Partner | Admin |
|-------|---------|------------|---------|-------|
| enrollments | Read own | - | - | All |
| career_course_purchases | Read own | - | - | All |
| documents | CRUD own | - | - | All |
| attendance_hours | 🚫 | 🚫 | 🚫 | 🚫 |
| apprentice_assignments | 🚫 | 🚫 | 🚫 | 🚫 |

---

## API Layer Enforcement

In addition to RLS, API routes must validate program_type:

### `/api/attendance-hours/route.ts`
```typescript
// Before inserting hours, check program_type
const { data: enrollment } = await supabase
  .from('enrollments')
  .select('program_id, programs(program_type)')
  .eq('id', enrollmentId)
  .single();

if (enrollment?.programs?.program_type !== 'internal_apprenticeship') {
  return NextResponse.json(
    { error: 'Hours tracking not available for this program type' },
    { status: 400 }
  );
}
```

### `/api/apprentice-assignments/route.ts`
```typescript
// Before creating assignment, check program_type
const { data: enrollment } = await supabase
  .from('enrollments')
  .select('program_id, programs(program_type)')
  .eq('id', enrollmentId)
  .single();

if (enrollment?.programs?.program_type !== 'internal_apprenticeship') {
  return NextResponse.json(
    { error: 'Placements not available for this program type' },
    { status: 400 }
  );
}
```

---

## UI Layer Enforcement

### Student Dashboard Conditional Rendering

```tsx
// In student dashboard
const { data: enrollment } = await getEnrollment(userId);
const programType = enrollment?.program?.program_type;

return (
  <Dashboard>
    {/* Always show */}
    <EnrollmentStatus enrollment={enrollment} />
    <DocumentUpload enrollment={enrollment} />
    
    {/* Only for internal_apprenticeship */}
    {programType === 'internal_apprenticeship' && (
      <>
        <HoursProgress enrollment={enrollment} />
        <PlacementInfo enrollment={enrollment} />
      </>
    )}
    
    {/* Only for external_lms_wrapped */}
    {programType === 'external_lms_wrapped' && (
      <>
        <LMSAccessButton enrollment={enrollment} />
        <CredentialUpload enrollment={enrollment} />
      </>
    )}
  </Dashboard>
);
```

---

## Test Cases

### Test 1: HVAC Student Cannot Have Hours Logged

```sql
-- Setup: Create HVAC enrollment
INSERT INTO enrollments (user_id, program_id) 
SELECT 'student-uuid', id FROM programs WHERE slug = 'hvac-technician';

-- Attempt: Log hours for HVAC enrollment
INSERT INTO attendance_hours (enrollment_id, date, hours_logged, logged_by)
VALUES ('hvac-enrollment-uuid', '2026-01-15', 8, 'instructor-uuid');

-- Expected: Policy violation error
-- Result: PASS (blocked by RLS)
```

### Test 2: HVAC Student Cannot Be Assigned to Site

```sql
-- Attempt: Create assignment for HVAC enrollment
INSERT INTO apprentice_assignments (enrollment_id, site_id, start_date)
VALUES ('hvac-enrollment-uuid', 'site-uuid', '2026-01-15');

-- Expected: Policy violation error
-- Result: PASS (blocked by RLS)
```

### Test 3: Barber Student CAN Have Hours Logged

```sql
-- Setup: Create Barber enrollment
INSERT INTO enrollments (user_id, program_id) 
SELECT 'student-uuid', id FROM programs WHERE slug = 'barber-apprenticeship';

-- Attempt: Log hours for Barber enrollment
INSERT INTO attendance_hours (enrollment_id, date, hours_logged, logged_by)
VALUES ('barber-enrollment-uuid', '2026-01-15', 8, 'instructor-uuid');

-- Expected: Success
-- Result: PASS (allowed by RLS)
```

### Test 4: HVAC Student CAN Purchase Career Course

```sql
-- Attempt: Create career course purchase for HVAC enrollment
INSERT INTO career_course_purchases (user_id, enrollment_id, course_id, payment_method, amount_cents)
VALUES ('student-uuid', 'hvac-enrollment-uuid', 'hvac-course-uuid', 'funding', 550000);

-- Expected: Success
-- Result: PASS (allowed by RLS)
```
