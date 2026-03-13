# Enrollment Tables Reference

This document describes the different enrollment tables and when to use each.

## Tables Overview

| Table | Purpose | Primary Key | Used For |
|-------|---------|-------------|----------|
| `enrollments` | Course-level enrollments | `(user_id, course_id)` | Individual course access |
| `student_enrollments` | Program-level enrollments | `id` (UUID) | Multi-course programs, apprenticeships |
| `program_enrollments` | Program holder managed enrollments | `id` (UUID) | Workforce-funded programs |

---

## 1. `enrollments` (Course Enrollments)

**Location:** `supabase/schema.sql`

**Purpose:** Tracks individual user enrollment in a single course.

**Schema:**
```sql
create table public.enrollments(
  user_id uuid references auth.users(id),
  course_id uuid references public.courses(id),
  status text default 'active',  -- active|completed|expired|refunded|suspended
  progress_percent numeric default 0,
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  enrollment_method text,        -- purchase|voucher|admin|free|workforce
  payment_id text,               -- Stripe payment intent ID
  funding_source text,           -- WRG|WIOA|JRI|DOL|EmployIndy|Paid|Partner
  primary key(user_id, course_id)
);
```

**Use When:**
- User enrolls in a single course
- Self-paced online courses
- Partner courses (Coursera, LinkedIn Learning, etc.)

**API Endpoints:**
- `POST /api/enrollments/create` - Create course enrollment
- `GET /api/enrollments` - List user's enrollments
- `GET /api/student/enrollments` - Student dashboard enrollments

---

## 2. `student_enrollments` (Program Enrollments)

**Location:** `supabase/migrations/archive-legacy/20241209_hybrid_learning_tables.sql`

**Purpose:** Tracks enrollment in multi-module programs (e.g., Barber Apprenticeship).

**Schema:**
```sql
create table student_enrollments (
  id uuid primary key,
  student_id uuid not null,
  program_id uuid references programs(id),
  program_slug text,
  status text default 'active',  -- pending|active|completed|dropped
  region_id text,
  funding_source text,
  case_id uuid,                  -- Links to case management
  stripe_checkout_session_id text,
  started_at timestamptz,
  completed_at timestamptz
);
```

**Use When:**
- Apprenticeship programs
- Programs with multiple modules/courses
- Programs requiring case management
- Programs with hour tracking

**Related Tables:**
- `module_progress` - Tracks progress per module
- `hour_logs` - Tracks apprenticeship hours
- `cases` - Case management workflow

**API Endpoints:**
- `POST /api/webhooks/stripe` - Creates on payment completion
- `GET /api/learner/dashboard` - Learner portal data
- `GET /api/apprentice/hours-summary` - Hour tracking

---

## 3. `program_enrollments` (Workforce Enrollments)

**Location:** Used by `lib/enrollment/orchestrate-enrollment.ts`

**Purpose:** Program holder managed enrollments with funding pathway enforcement.

**Schema:**
```sql
create table program_enrollments (
  id uuid primary key,
  student_id uuid not null,
  program_id uuid,
  program_holder_id uuid,
  funding_source text,           -- WIOA|WRG|JRI|SELF_PAY|EMPLOYER
  status text default 'IN_PROGRESS',
  billing_lock boolean,
  payment_mode_detail text       -- sponsored|self_pay|employer|scholarship
);
```

**Use When:**
- Workforce-funded programs (WIOA, WRG)
- Programs managed by program holders
- Enrollments requiring intake workflow
- Enrollments with funding pathway enforcement

**Related Tables:**
- `intake_records` - Pre-enrollment intake
- `enrollment_steps` - Step-by-step workflow
- `bridge_payment_plans` - Payment plans
- `employer_sponsorships` - Employer funding

**API Endpoints:**
- `POST /api/enroll/apply` - Application submission
- `POST /api/enrollments/create-enforced` - Enforced enrollment
- `POST /api/program-holder/enroll-participant` - Program holder enrollment

---

## Funding Pathways

### Lane 1: Workforce Funded
- No payment required
- Requires agency referral
- Tables: `program_enrollments`, `workforce_referrals`

### Lane 2: Employer Sponsored
- Employer pays via reimbursement
- Tables: `program_enrollments`, `employer_sponsorships`

### Lane 3: Structured Tuition (Self-Pay)
- Student pays via payment plan
- 90-day max term
- Tables: `program_enrollments`, `bridge_payment_plans`

---

## Decision Tree: Which Table to Use?

```
Is this a single course?
├── Yes → Use `enrollments`
└── No (multi-module program)
    ├── Is it workforce-funded with program holder?
    │   └── Yes → Use `program_enrollments`
    └── Is it an apprenticeship or has case management?
        └── Yes → Use `student_enrollments`
```

---

## Migration Notes

The system evolved over time, resulting in multiple tables. Future consolidation should:

1. Keep `enrollments` for course-level access
2. Merge `student_enrollments` and `program_enrollments` into unified `program_enrollments`
3. Use views for backward compatibility
