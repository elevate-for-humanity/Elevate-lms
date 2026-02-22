# Canonical Data Model

Generated: 2026-02-01 (Updated)

## Overview

This document defines the canonical tables and their behavior by program type. The system supports three program types:

1. **`internal_apprenticeship`** - Barber (hours + placements)
2. **`external_lms_wrapped`** - HVAC (CareerSafe LMS + credential verification)
3. **`external_referral`** - Future only (intake + handoff)

---

## Program Type Column

**Required Migration**:
```sql
ALTER TABLE programs ADD COLUMN IF NOT EXISTS program_type TEXT 
CHECK (program_type IN ('internal_apprenticeship', 'external_lms_wrapped', 'external_referral'));

-- Set existing programs
UPDATE programs SET program_type = 'internal_apprenticeship' WHERE slug = 'barber-apprenticeship';
UPDATE programs SET program_type = 'external_lms_wrapped' WHERE slug = 'hvac-technician';
```

---

## Table Behavior by Program Type

### Legend
- ✅ = Used
- ❌ = Not Used
- 🚫 = **FORBIDDEN** (RLS enforced)

### Core Tables

| Table | internal_apprenticeship | external_lms_wrapped | external_referral |
|-------|-------------------------|----------------------|-------------------|
| `programs` | ✅ | ✅ | ✅ |
| `applications` | ✅ | ✅ | ✅ |
| `enrollments` | ✅ | ✅ | ❌ |
| `documents` | ✅ | ✅ | ❌ |
| `audit_logs` | ✅ | ✅ | ✅ |

### Apprenticeship-Specific Tables

| Table | internal_apprenticeship | external_lms_wrapped | external_referral |
|-------|-------------------------|----------------------|-------------------|
| `cohorts` | ✅ | ❌ | ❌ |
| `partner_sites` | ✅ | ❌ | ❌ |
| `apprentice_assignments` | ✅ | 🚫 | ❌ |
| `attendance_hours` | ✅ | 🚫 | ❌ |

### External LMS Tables

| Table | internal_apprenticeship | external_lms_wrapped | external_referral |
|-------|-------------------------|----------------------|-------------------|
| `career_courses` | ❌ | ✅ | ❌ |
| `career_course_purchases` | ❌ | ✅ | ❌ |
| `career_course_modules` | ❌ | ✅ | ❌ |

---

## Canonical Tables (KEEP)

### Core Identity

| Table | Purpose | Program Types |
|-------|---------|---------------|
| `profiles` | User profiles (extends auth.users) | All |
| `roles` | Role definitions | All |
| `user_roles` | User-role assignments | All |

### Programs

| Table | Purpose | Program Types |
|-------|---------|---------------|
| `programs` | Program catalog with `program_type` column | All |
| `funding_sources` | Available funding (WIOA, WRG, etc.) | All |
| `program_funding_links` | Program-funding relationships | All |
| `document_requirements` | Required docs per program | All |

### Marketing & Intake

| Table | Purpose | Program Types |
|-------|---------|---------------|
| `intakes` | Lead capture / inquiries | All |

### Applications & Enrollments

| Table | Purpose | Program Types |
|-------|---------|---------------|
| `applications` | Student/partner/employer applications | All |
| `application_state_events` | State transition audit | All |
| `enrollments` | Active enrollments | internal_apprenticeship, external_lms_wrapped |

### Apprenticeship (internal_apprenticeship ONLY)

| Table | Purpose | Program Types |
|-------|---------|---------------|
| `cohorts` | Program cohorts | internal_apprenticeship |
| `partner_organizations` | Employer/training partners | internal_apprenticeship |
| `partner_sites` | Physical locations | internal_apprenticeship |
| `apprentice_assignments` | Student-site assignments | internal_apprenticeship |
| `attendance_hours` | Hour logging | internal_apprenticeship |
| `evaluations` | Student evaluations | internal_apprenticeship |

### External LMS (external_lms_wrapped ONLY)

| Table | Purpose | Program Types |
|-------|---------|---------------|
| `career_courses` | CareerSafe course definitions | external_lms_wrapped |
| `career_course_purchases` | Funding-based purchases | external_lms_wrapped |
| `career_course_modules` | Course module tracking | external_lms_wrapped |

### Documents & Audit

| Table | Purpose | Program Types |
|-------|---------|---------------|
| `documents` | Uploaded files | internal_apprenticeship, external_lms_wrapped |
| `document_verifications` | Verification records | internal_apprenticeship, external_lms_wrapped |
| `audit_logs` | All privileged actions | All |

---

## Tables to DEPRECATE (Migrate Off)

| Table | Reason | Migration Path |
|-------|--------|----------------|
| `student_applications` | Duplicate of `applications` | Merge with `type='student'` |
| `partner_applications` | Duplicate of `applications` | Merge with `type='partner'` |
| `employer_applications` | Duplicate of `applications` | Merge with `type='employer'` |
| `user_profiles` | Duplicate of `profiles` | Migrate to `profiles` |
| `program_holders` | Replaced by `partner_organizations` | Migrate |

---

## Canonical Schema Updates

### programs (Updated)
```sql
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  program_type TEXT NOT NULL CHECK (program_type IN (
    'internal_apprenticeship', 
    'external_lms_wrapped', 
    'external_referral'
  )),
  price_cents INTEGER DEFAULT 0,
  funding_eligible BOOLEAN DEFAULT true,
  delivery_method TEXT CHECK (delivery_method IN ('internal', 'external_lms', 'referral')),
  credential_partner TEXT,  -- e.g., 'CareerSafe' for HVAC
  internal_hours_tracked BOOLEAN DEFAULT false,
  placement_required BOOLEAN DEFAULT false,
  completion_method TEXT CHECK (completion_method IN (
    'hours_and_documents',
    'credential_verification',
    'referral_handoff'
  )),
  total_hours INTEGER,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### enrollments (Updated)
```sql
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  application_id UUID REFERENCES applications(id),
  program_id UUID NOT NULL REFERENCES programs(id),
  cohort_id UUID REFERENCES cohorts(id),  -- NULL for external_lms_wrapped
  funding_type TEXT,
  funding_source_id UUID REFERENCES funding_sources(id),
  status TEXT DEFAULT 'active' CHECK (status IN (
    'pending', 'active', 'lms_active', 'completed', 'withdrawn', 'suspended'
  )),
  -- For internal_apprenticeship only
  hours_completed DECIMAL(6,2) DEFAULT 0,
  at_risk BOOLEAN DEFAULT false,
  -- For external_lms_wrapped only
  lms_access_granted_at TIMESTAMPTZ,
  credential_verified_at TIMESTAMPTZ,
  -- Common
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### career_course_purchases (For external_lms_wrapped)
```sql
CREATE TABLE career_course_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  enrollment_id UUID REFERENCES enrollments(id),
  course_id UUID NOT NULL REFERENCES career_courses(id),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'funding', 'voucher')),
  funding_source TEXT,  -- 'WIOA', 'WorkOne', etc.
  amount_cents INTEGER NOT NULL,  -- Program price (for reporting)
  student_paid_cents INTEGER DEFAULT 0,  -- Actual out-of-pocket (usually 0)
  access_granted_at TIMESTAMPTZ,
  access_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Entity Relationships by Program Type

### internal_apprenticeship (Barber)

```
profiles
    │
    ▼
intakes → applications → enrollments → cohorts
                              │
                              ├─→ apprentice_assignments → partner_sites
                              │
                              └─→ attendance_hours
                              │
                              └─→ documents
```

### external_lms_wrapped (HVAC)

```
profiles
    │
    ▼
intakes → applications → enrollments → career_course_purchases
                              │
                              └─→ documents (credential uploads)
```

---

## Completion Logic by Program Type

### internal_apprenticeship
```sql
-- Completion check
SELECT 
  e.id,
  e.hours_completed >= p.total_hours AS hours_met,
  (SELECT COUNT(*) = 0 FROM document_requirements dr 
   WHERE dr.program_id = p.id 
   AND NOT EXISTS (
     SELECT 1 FROM documents d 
     WHERE d.enrollment_id = e.id 
     AND d.requirement_id = dr.id 
     AND d.verification_status = 'verified'
   )) AS docs_verified
FROM enrollments e
JOIN programs p ON e.program_id = p.id
WHERE p.program_type = 'internal_apprenticeship';
```

### external_lms_wrapped
```sql
-- Completion check
SELECT 
  e.id,
  e.credential_verified_at IS NOT NULL AS credential_verified,
  (SELECT COUNT(*) = 0 FROM document_requirements dr 
   WHERE dr.program_id = p.id 
   AND NOT EXISTS (
     SELECT 1 FROM documents d 
     WHERE d.enrollment_id = e.id 
     AND d.requirement_id = dr.id 
     AND d.verification_status = 'verified'
   )) AS docs_verified
FROM enrollments e
JOIN programs p ON e.program_id = p.id
WHERE p.program_type = 'external_lms_wrapped';
```

---

## Migration Plan

### Phase 1: Add program_type Column
```sql
ALTER TABLE programs ADD COLUMN IF NOT EXISTS program_type TEXT;
ALTER TABLE programs ADD CONSTRAINT programs_type_check 
  CHECK (program_type IN ('internal_apprenticeship', 'external_lms_wrapped', 'external_referral'));

UPDATE programs SET program_type = 'internal_apprenticeship' WHERE slug = 'barber-apprenticeship';
UPDATE programs SET program_type = 'external_lms_wrapped' WHERE slug = 'hvac-technician';
UPDATE programs SET program_type = 'internal_apprenticeship' WHERE program_type IS NULL;
```

### Phase 2: Add Enrollment Columns for External LMS
```sql
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS lms_access_granted_at TIMESTAMPTZ;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS credential_verified_at TIMESTAMPTZ;
```

### Phase 3: Add RLS Constraints
```sql
-- Prevent HVAC from using attendance_hours
CREATE POLICY "hours_program_type_check" ON attendance_hours
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM enrollments e
    JOIN programs p ON e.program_id = p.id
    WHERE e.id = attendance_hours.enrollment_id
    AND p.program_type = 'internal_apprenticeship'
  )
);

-- Prevent HVAC from using apprentice_assignments
CREATE POLICY "assignments_program_type_check" ON apprentice_assignments
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM enrollments e
    JOIN programs p ON e.program_id = p.id
    WHERE e.id = apprentice_assignments.enrollment_id
    AND p.program_type = 'internal_apprenticeship'
  )
);
```

### Phase 4: Consolidate Application Tables
(See previous migration plan)

### Phase 5: Drop Deprecated Tables
```sql
DROP TABLE IF EXISTS student_applications;
DROP TABLE IF EXISTS partner_applications;
DROP TABLE IF EXISTS employer_applications;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS program_holders;
```
