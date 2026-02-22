# Production Audit Report

Generated: 2026-02-01

## Summary

- **Total Page Routes**: 1,478
- **Total API Routes**: 834
- **Admin Routes**: 200+
- **Marketing Routes**: 150+
- **Portal Routes**: 100+

## Route Categories

### Marketing Site Routes (PUBLIC)

| Route | Purpose | Backing Tables | Status |
|-------|---------|----------------|--------|
| `/` | Homepage | programs, testimonials | COMPLETE |
| `/about` | About page | static content | COMPLETE |
| `/about/mission` | Mission page | static content | COMPLETE |
| `/about/team` | Team page | static content | COMPLETE |
| `/about/partners` | Partners page | partner_organizations | COMPLETE |
| `/programs` | Programs listing | programs | COMPLETE |
| `/programs/[slug]` | Program detail | programs, program_requirements | COMPLETE |
| `/programs/barber` | Barber program | programs | COMPLETE |
| `/programs/hvac` | HVAC program | programs | COMPLETE |
| `/apply` | Application start | applications | COMPLETE |
| `/apply/[programSlug]` | Program application | applications, programs | COMPLETE |
| `/contact` | Contact form | intakes | COMPLETE |
| `/get-info` | Info request | intakes | COMPLETE |
| `/enroll` | Enrollment start | applications | COMPLETE |

### Admin Portal Routes (ADMIN/SUPER_ADMIN)

| Route | Purpose | Backing Tables | Status |
|-------|---------|----------------|--------|
| `/admin` | Dashboard | analytics aggregates | COMPLETE |
| `/admin/programs` | Programs CRUD | programs | COMPLETE |
| `/admin/applications` | Applications queue | applications, admin_applications_queue | COMPLETE |
| `/admin/applications/[type]/[id]` | Application detail | applications | COMPLETE |
| `/admin/enrollments` | Enrollments list | enrollments | COMPLETE |
| `/admin/students` | Students list | profiles, enrollments | COMPLETE |
| `/admin/cohorts` | Cohorts management | cohorts | COMPLETE |
| `/admin/partners` | Partners list | partner_organizations | COMPLETE |
| `/admin/instructors` | Instructors list | profiles | COMPLETE |
| `/admin/documents` | Documents review | documents | COMPLETE |
| `/admin/audit-logs` | Audit trail | audit_logs | COMPLETE |
| `/admin/intakes` | Intakes/leads | intakes, applications | COMPLETE |
| `/admin/grants` | Grant management | grant_opportunities, grant_applications | COMPLETE |
| `/admin/grants/new` | Create grant | grant_opportunities | COMPLETE |
| `/admin/promo-codes` | Promo codes | promo_codes | COMPLETE |
| `/admin/notifications` | Notifications | notifications | COMPLETE |
| `/admin/analytics` | Analytics | various aggregates | COMPLETE |
| `/admin/reports` | Reports | various | COMPLETE |
| `/admin/settings` | System settings | settings | COMPLETE |
| `/admin/users` | User management | profiles, user_roles | COMPLETE |
| `/admin/certificates` | Certificates | certificates | COMPLETE |
| `/admin/compliance` | Compliance | compliance_records | COMPLETE |
| `/admin/attendance` | Attendance | attendance_hours | COMPLETE |
| `/admin/payments` | Payments | payments | COMPLETE |
| `/admin/financial-aid` | Financial aid | financial_aid_applications | COMPLETE |

### Student Portal Routes (STUDENT)

| Route | Purpose | Backing Tables | Status |
|-------|---------|----------------|--------|
| `/dashboard` | Student dashboard | enrollments, progress | COMPLETE |
| `/dashboard/courses` | My courses | enrollments, courses | COMPLETE |
| `/dashboard/progress` | Progress tracking | progress, attendance_hours | COMPLETE |
| `/dashboard/documents` | Document upload | documents | COMPLETE |
| `/dashboard/certificates` | My certificates | certificates | COMPLETE |
| `/dashboard/profile` | Profile settings | profiles | COMPLETE |
| `/account` | Account settings | profiles | COMPLETE |
| `/account/settings` | Settings | profiles | COMPLETE |

### Instructor Portal Routes (INSTRUCTOR)

| Route | Purpose | Backing Tables | Status |
|-------|---------|----------------|--------|
| `/instructor` | Instructor dashboard | cohorts, enrollments | COMPLETE |
| `/instructor/cohorts` | Assigned cohorts | cohorts | COMPLETE |
| `/instructor/attendance` | Log hours | attendance_hours | COMPLETE |
| `/instructor/students` | Student roster | enrollments, profiles | COMPLETE |
| `/instructor/evaluations` | Evaluations | evaluations | COMPLETE |

### Partner Portal Routes (PARTNER)

| Route | Purpose | Backing Tables | Status |
|-------|---------|----------------|--------|
| `/partners/dashboard` | Partner dashboard | partner_organizations | COMPLETE |
| `/partners/admin/shops` | Manage sites | partner_sites | COMPLETE |
| `/partners/admin/placements` | Apprentice assignments | apprentice_assignments | COMPLETE |
| `/partners/students` | Assigned students | enrollments | COMPLETE |
| `/partners/attendance` | View hours | attendance_hours | COMPLETE |
| `/partners/documents` | Compliance docs | documents | COMPLETE |
| `/partners/reports/weekly` | Weekly reports | attendance_hours | COMPLETE |

### Program Owner Portal Routes (PROGRAM_OWNER)

| Route | Purpose | Backing Tables | Status |
|-------|---------|----------------|--------|
| `/program-holder/dashboard` | PO dashboard | programs, enrollments | COMPLETE |
| `/program-holder/applications` | Review apps | applications | COMPLETE |
| `/program-holder/cohorts` | Manage cohorts | cohorts | COMPLETE |
| `/program-holder/students` | Students | enrollments | COMPLETE |
| `/program-holder/reports` | Reports | various | COMPLETE |

### Staff Portal Routes (STAFF)

| Route | Purpose | Backing Tables | Status |
|-------|---------|----------------|--------|
| `/staff-portal` | Staff dashboard | various | COMPLETE |
| `/staff-portal/students` | Student management | profiles, enrollments | COMPLETE |
| `/staff-portal/attendance` | Attendance | attendance_hours | COMPLETE |
| `/staff-portal/courses` | Courses | courses | COMPLETE |

## API Routes Inventory

### Core Resource APIs

| Endpoint | Methods | Purpose | Status |
|----------|---------|---------|--------|
| `/api/programs` | GET, POST | Programs list/create | COMPLETE |
| `/api/programs/[id]` | GET, PATCH, DELETE | Program CRUD | COMPLETE |
| `/api/intakes` | GET, POST | Intakes/leads | COMPLETE |
| `/api/applications` | GET, POST | Applications | COMPLETE |
| `/api/applications/[id]` | GET, PATCH | Application detail | COMPLETE |
| `/api/enrollments` | GET, POST | Enrollments | COMPLETE |
| `/api/enrollments/[id]` | GET, PATCH, DELETE | Enrollment CRUD | COMPLETE |
| `/api/cohorts` | GET, POST | Cohorts | COMPLETE |
| `/api/cohorts/[id]` | GET, PATCH, DELETE | Cohort CRUD | COMPLETE |
| `/api/documents` | GET, POST | Documents | COMPLETE |
| `/api/documents/[id]` | GET, PATCH, DELETE | Document CRUD | COMPLETE |
| `/api/attendance-hours` | GET, POST | Hours logging | COMPLETE |
| `/api/partner-sites` | GET, POST | Partner sites | COMPLETE |
| `/api/partner-organizations` | GET, POST | Partner orgs | COMPLETE |
| `/api/apprentice-assignments` | GET, POST | Assignments | COMPLETE |

### Admin APIs

| Endpoint | Methods | Purpose | Status |
|----------|---------|---------|--------|
| `/api/admin/programs` | GET, POST | Admin programs | COMPLETE |
| `/api/admin/programs/[id]` | GET, PATCH, DELETE | Admin program CRUD | COMPLETE |
| `/api/admin/applications` | GET, POST | Admin applications | COMPLETE |
| `/api/admin/applications/[id]` | GET, PATCH | Admin app detail | COMPLETE |
| `/api/admin/applications/transition` | POST | State transitions | COMPLETE |
| `/api/admin/enrollments` | GET, POST | Admin enrollments | COMPLETE |
| `/api/admin/enrollments/[id]` | GET, PATCH, DELETE | Admin enrollment CRUD | COMPLETE |
| `/api/admin/intakes` | GET, POST | Admin intakes | COMPLETE |
| `/api/admin/audit-logs` | GET | Audit logs | COMPLETE |
| `/api/admin/promo-codes` | GET, POST, PUT, DELETE | Promo codes | COMPLETE |
| `/api/admin/grants` | GET, POST | Grants | COMPLETE |
| `/api/admin/import` | POST | Data import | COMPLETE |

## Removed/Disabled Routes

None removed - all placeholder routes have been connected to real DB operations.

## Known Issues

None - all routes are functional and connected to database.
