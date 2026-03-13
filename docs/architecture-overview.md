# Architecture Overview

## What the Platform Does

Elevate for Humanity operates a vertically integrated Workforce Operating System. It is not a standalone LMS. It is the operational infrastructure for a workforce credential institute — handling training delivery, enrollment, funding workflows, compliance reporting, credentialing, and employer placement under one platform.

## Stakeholder Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        PUBLIC SURFACE                           │
│  Program pages · Funding info · Employer portal · Apply flows   │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      ENROLLMENT LAYER                           │
│  Application intake · Funding eligibility · Cohort assignment   │
│  Stripe payments · Affirm BNPL · Waitlist management            │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      TRAINING DELIVERY                          │
│  Video lessons · Quizzes · Attendance · Progress tracking       │
│  AI tutoring · Adaptive learning · Certificate generation       │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    COMPLIANCE & REPORTING                       │
│  WIOA performance metrics · DOL RAPIDS hour logs                │
│  RTI attendance · OJT tracking · Audit logs · Agency exports    │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     EMPLOYER PIPELINE                           │
│  Job postings · OJT agreements · Placement tracking             │
│  6- and 12-month outcome reporting                              │
└─────────────────────────────────────────────────────────────────┘
```

## Stakeholder Portals

| Portal | Primary Users | Key Functions |
|--------|--------------|---------------|
| **Student** | Enrolled participants | Courses, progress, certificates, attendance, career services |
| **Admin** | Elevate staff | All operations — 289 sections |
| **Program Holder** | Community org partners | Cohort management, participant tracking, revenue share |
| **Employer** | Hiring partners | Job postings, OJT agreements, candidate pipeline |
| **Workforce Board** | Agency staff | Aggregate reporting, outcome data, funding utilization |
| **Delegate** | Sub-office operators | Scoped access to participant records and reporting |

## Data Flows

### Enrollment Flow
```
Applicant → Application form → Funding eligibility check
→ WorkOne/agency referral (if WIOA/JRI) → Approval
→ Cohort assignment → Payment (if self-pay) → Enrollment confirmed
→ LMS access granted → Progress tracking begins
```

### Compliance Reporting Flow
```
Student activity (lessons, attendance, quizzes)
→ Progress records (training_enrollments, training_lessons)
→ RTI hour logs → OJT hour logs
→ Competency rubric evaluations
→ WIOA performance export → DOL RAPIDS submission
→ Monthly agency compliance summaries
```

### Credential Flow
```
Training completion → Exam eligibility confirmed
→ Proctored exam (on-site at Elevate)
→ Credential issued by national certifying body
→ Certificate record created → Verification URL generated
→ Employer notification (if applicable)
```

## Infrastructure

| Component | Technology |
|-----------|-----------|
| Application | Next.js 16 (App Router, Turbopack) on Netlify |
| Database | Supabase (PostgreSQL + Auth + RLS + Realtime) |
| File storage | Supabase Storage |
| Serverless functions | Netlify Functions (7 functions) |
| Payments | Stripe (checkout, webhooks, subscriptions) |
| Email | Resend (transactional) |
| AI | OpenAI (tutoring, course generation, adaptive content) |
| Monitoring | Sentry (error tracking, performance) |
| Forms | JotForm (intake, employer agreements) |

## Database Scale

- 225+ SQL migrations
- Row Level Security on all tables
- Audit logging on all critical mutations
- Multi-tenant isolation enforced at database layer

## Key Directories

```
app/                  # 1,439 pages + 1,020 API routes
├── admin/            # Admin panel (289 sections)
├── api/              # API routes — enrollment, compliance, LMS, payments
├── lms/              # Student LMS application
├── programs/         # Training program pages
├── employer/         # Employer portal
└── program-holder/   # Program holder portal

components/           # 857 React components
lib/                  # 732 modules — auth, enrollment, compliance, payments, AI
supabase/migrations/  # 225 SQL migrations
netlify/functions/    # 7 serverless functions
```
