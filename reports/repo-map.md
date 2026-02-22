# Repository Map

Generated: 2026-02-01

## Project Structure Overview

```
Elevate-lms/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   ├── (dashboard)/              # Dashboard route group
│   ├── (marketing)/              # Marketing pages
│   ├── (partner)/                # Partner portal
│   ├── (public)/                 # Public pages
│   ├── admin/                    # Admin dashboard
│   ├── api/                      # API routes
│   ├── apply/                    # Application forms
│   ├── barber-apprenticeship/    # Barber program pages
│   ├── dashboard/                # Student dashboard
│   ├── enrollment/               # Enrollment flows
│   ├── instructor/               # Instructor portal
│   ├── intake/                   # Lead capture
│   ├── partner/                  # Partner pages
│   ├── programs/                 # Program catalog
│   └── [200+ other routes]       # Various feature routes
│
├── lib/                          # Core libraries
│   ├── supabase/                 # Supabase clients
│   │   ├── server.ts             # Server-side client (SSR)
│   │   ├── client.ts             # Browser client
│   │   └── admin.ts              # Service role client
│   ├── auth.ts                   # Auth utilities (requireAuth, requireRole)
│   ├── programs-data.ts          # Program definitions (TypeScript)
│   ├── enrollment/               # Enrollment logic
│   ├── apprenticeship/           # Apprenticeship logic
│   └── [100+ other modules]
│
├── supabase/
│   ├── migrations/               # Database migrations
│   │   ├── 001_barber_hvac_reference.sql    # Canonical schema
│   │   ├── 20260201_complete_canonical_tables.sql
│   │   └── [40+ other migrations]
│   ├── functions/                # Edge functions
│   │   ├── enrollment-orchestrator/
│   │   ├── timeclock-enforcer/
│   │   └── [20+ other functions]
│   ├── seed/                     # Seed data
│   └── seeds/                    # Additional seeds
│
├── config/                       # Configuration files
│   ├── programs.json             # Program catalog (JSON)
│   ├── branding.json             # Branding config
│   ├── license.json              # License config
│   └── integrations.json         # Third-party integrations
│
├── lms-data/                     # LMS content data
│   ├── programs.ts               # Program TypeScript data
│   ├── courses.ts                # Course definitions
│   └── enrollment.ts             # Enrollment mappings
│
├── lms-content/
│   └── curricula/
│       └── program-curriculum-map.json  # Curriculum definitions
│
├── types/
│   └── database.ts               # TypeScript types for DB
│
├── reports/                      # Audit reports
│   ├── crud-matrix.md
│   ├── acceptance-tests.md
│   └── rls-audit.md
│
└── docs/                         # Documentation
    ├── ARCHITECTURE.md
    ├── ENROLLMENT_TABLES.md
    └── [30+ other docs]
```

## Key App Routes

### Public Routes
- `/programs` - Program catalog
- `/programs/[slug]` - Individual program pages
- `/apply/[programSlug]` - Application forms
- `/contact` - Contact/inquiry form

### Student Routes
- `/dashboard` - Student dashboard
- `/dashboard/progress` - Progress tracking
- `/dashboard/documents` - Document uploads
- `/dashboard/certificates` - Certificates

### Instructor Routes
- `/instructor/cohorts` - Cohort management
- `/instructor/attendance` - Hour logging
- `/instructor/evaluations` - Student evaluations

### Partner Routes
- `/partners/admin/shops` - Site management
- `/partners/admin/placements` - Apprentice assignments
- `/partners/dashboard` - Partner dashboard

### Admin Routes
- `/admin/applications` - Application review
- `/admin/enrollments` - Enrollment management
- `/admin/cohorts` - Cohort management
- `/admin/partners` - Partner management
- `/admin/intakes` - Lead management
- `/admin/audit-logs` - Audit trail

## Supabase Functions

| Function | Purpose |
|----------|---------|
| enrollment-orchestrator | Handles enrollment state transitions |
| timeclock-enforcer | GPS-based attendance validation |
| email-dispatch | Email notifications |
| stripe-webhook | Payment processing |
| indiana-compliance-check | State compliance validation |

## Key Migrations

| Migration | Purpose |
|-----------|---------|
| 001_barber_hvac_reference.sql | Canonical schema for Barber/HVAC |
| 20260201_complete_canonical_tables.sql | Roles, funding sources, evaluations |
| 20260129_application_state_machine.sql | Application workflow states |
| 20260128_barber_apprenticeship_system.sql | Barber-specific tables |
| 20260130_timeclock_gps_enforcement.sql | GPS attendance tracking |
