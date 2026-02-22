# CRUD Matrix Report

Generated: 2026-02-01

## Core Resources CRUD Matrix

### Programs

| Operation | API Endpoint | UI Entry Point | RLS Policy |
|-----------|--------------|----------------|------------|
| Create | POST `/api/admin/programs` | `/admin/programs/new` | admin_manage_programs |
| Read | GET `/api/programs`, `/api/admin/programs` | `/programs`, `/admin/programs` | public_read_programs, admin_read_all |
| Update | PATCH `/api/admin/programs/[id]` | `/admin/programs/[slug]` | admin_manage_programs |
| Archive | DELETE `/api/admin/programs/[id]` | `/admin/programs` (archive btn) | admin_manage_programs |

### Intakes (Leads/Inquiries)

| Operation | API Endpoint | UI Entry Point | RLS Policy |
|-----------|--------------|----------------|------------|
| Create | POST `/api/intakes` | `/get-info`, `/contact` | public_insert_intakes |
| Read | GET `/api/admin/intakes` | `/admin/intakes` | admin_read_intakes |
| Update | PATCH `/api/admin/intakes/[id]` | `/admin/intakes` | admin_manage_intakes |
| Archive | DELETE `/api/admin/intakes/[id]` | `/admin/intakes` | admin_manage_intakes |

### Applications

| Operation | API Endpoint | UI Entry Point | RLS Policy |
|-----------|--------------|----------------|------------|
| Create | POST `/api/applications` | `/apply/[programSlug]` | public_insert_applications |
| Read | GET `/api/applications`, `/api/admin/applications` | `/dashboard`, `/admin/applications` | users_read_own, admin_read_all |
| Update | PATCH `/api/admin/applications/[id]` | `/admin/applications/[type]/[id]` | admin_manage_applications |
| Transition | POST `/api/admin/applications/transition` | `/admin/applications/[type]/[id]` | admin_manage_applications |

### Enrollments

| Operation | API Endpoint | UI Entry Point | RLS Policy |
|-----------|--------------|----------------|------------|
| Create | POST `/api/admin/enrollments` | `/admin/enrollments` (on approval) | admin_create_enrollments |
| Read | GET `/api/enrollments`, `/api/admin/enrollments` | `/dashboard`, `/admin/enrollments` | users_read_own, admin_read_all |
| Update | PATCH `/api/admin/enrollments/[id]` | `/admin/enrollments/[id]` | admin_manage_enrollments |
| Archive | DELETE `/api/admin/enrollments/[id]` | `/admin/enrollments` | admin_manage_enrollments |

### Cohorts

| Operation | API Endpoint | UI Entry Point | RLS Policy |
|-----------|--------------|----------------|------------|
| Create | POST `/api/admin/cohorts` | `/admin/cohorts/new` | admin_manage_cohorts |
| Read | GET `/api/cohorts`, `/api/admin/cohorts` | `/instructor/cohorts`, `/admin/cohorts` | instructor_read_assigned, admin_read_all |
| Update | PATCH `/api/admin/cohorts/[id]` | `/admin/cohorts/[id]` | admin_manage_cohorts |
| Archive | DELETE `/api/admin/cohorts/[id]` | `/admin/cohorts` | admin_manage_cohorts |

### Partner Organizations

| Operation | API Endpoint | UI Entry Point | RLS Policy |
|-----------|--------------|----------------|------------|
| Create | POST `/api/admin/partners` | `/admin/partners/new` | admin_manage_partners |
| Read | GET `/api/partner-organizations` | `/partners/dashboard`, `/admin/partners` | partners_read_own, admin_read_all |
| Update | PATCH `/api/admin/partners/[id]` | `/admin/partners/[id]` | admin_manage_partners |
| Archive | DELETE `/api/admin/partners/[id]` | `/admin/partners` | admin_manage_partners |

### Partner Sites

| Operation | API Endpoint | UI Entry Point | RLS Policy |
|-----------|--------------|----------------|------------|
| Create | POST `/api/partner-sites` | `/partners/admin/shops` | partners_manage_own_sites |
| Read | GET `/api/partner-sites` | `/partners/admin/shops` | partners_read_own_sites |
| Update | PATCH `/api/partner-sites/[id]` | `/partners/admin/shops` | partners_manage_own_sites |
| Archive | DELETE `/api/partner-sites/[id]` | `/partners/admin/shops` | partners_manage_own_sites |

### Apprentice Assignments

| Operation | API Endpoint | UI Entry Point | RLS Policy |
|-----------|--------------|----------------|------------|
| Create | POST `/api/apprentice-assignments` | `/partners/admin/placements` | partners_create_assignments |
| Read | GET `/api/apprentice-assignments` | `/partners/admin/placements` | partners_read_own_assignments |
| Update | PATCH `/api/apprentice-assignments/[id]` | `/partners/admin/placements` | admin_manage_assignments |
| Archive | DELETE `/api/apprentice-assignments/[id]` | `/admin/apprenticeships` | admin_manage_assignments |

### Attendance Hours

| Operation | API Endpoint | UI Entry Point | RLS Policy |
|-----------|--------------|----------------|------------|
| Create | POST `/api/attendance-hours` | `/instructor/attendance` | instructors_log_hours |
| Read | GET `/api/attendance-hours` | `/dashboard/progress`, `/instructor/attendance` | users_read_own, instructors_read_cohort |
| Update | PATCH `/api/attendance-hours/[id]` | `/instructor/attendance` | instructors_update_own_logs |
| Delete | DELETE `/api/attendance-hours/[id]` | `/admin/attendance` | admin_manage_hours |

### Documents

| Operation | API Endpoint | UI Entry Point | RLS Policy |
|-----------|--------------|----------------|------------|
| Create | POST `/api/documents` | `/dashboard/documents` | users_upload_own |
| Read | GET `/api/documents` | `/dashboard/documents`, `/admin/documents` | users_read_own, admin_read_all |
| Update | PATCH `/api/documents/[id]` | `/admin/documents` | admin_verify_documents |
| Archive | DELETE `/api/documents/[id]` | `/admin/documents` | admin_manage_documents |

### Document Verifications

| Operation | API Endpoint | UI Entry Point | RLS Policy |
|-----------|--------------|----------------|------------|
| Create | POST `/api/admin/documents/review` | `/admin/documents` | admin_verify_documents |
| Read | GET `/api/document-verifications` | `/admin/documents` | admin_read_verifications |

### Evaluations

| Operation | API Endpoint | UI Entry Point | RLS Policy |
|-----------|--------------|----------------|------------|
| Create | POST `/api/evaluations` | `/instructor/evaluations` | instructors_create_evaluations |
| Read | GET `/api/evaluations` | `/dashboard`, `/instructor/evaluations` | users_read_own, instructors_read_cohort |
| Update | PATCH `/api/evaluations/[id]` | `/instructor/evaluations` | instructors_update_own |

### Audit Logs

| Operation | API Endpoint | UI Entry Point | RLS Policy |
|-----------|--------------|----------------|------------|
| Create | (automatic via triggers/helpers) | N/A | system_insert_only |
| Read | GET `/api/admin/audit-logs` | `/admin/audit-logs` | admin_read_audit_logs |

### Users/Profiles

| Operation | API Endpoint | UI Entry Point | RLS Policy |
|-----------|--------------|----------------|------------|
| Create | POST `/api/auth/signup` | `/signup` | public_create_profile |
| Read | GET `/api/users`, `/api/admin/users` | `/account`, `/admin/users` | users_read_own, admin_read_all |
| Update | PATCH `/api/users/[id]` | `/account/profile`, `/admin/users/[id]` | users_update_own, admin_manage_users |
| Archive | DELETE `/api/admin/users/[id]` | `/admin/users` | admin_manage_users |

### Certificates

| Operation | API Endpoint | UI Entry Point | RLS Policy |
|-----------|--------------|----------------|------------|
| Create | POST `/api/admin/certificates/issue` | `/admin/certificates/issue` | admin_issue_certificates |
| Read | GET `/api/certificates` | `/dashboard/certificates`, `/verify/[id]` | users_read_own, public_verify |
| Revoke | DELETE `/api/admin/certificates/[id]` | `/admin/certificates` | admin_manage_certificates |

### Grant Opportunities

| Operation | API Endpoint | UI Entry Point | RLS Policy |
|-----------|--------------|----------------|------------|
| Create | Server Action `createGrantOpportunity` | `/admin/grants/new` | admin_manage_grants |
| Read | GET (server-side) | `/admin/grants` | admin_read_grants |
| Update | Server Action `updateGrantOpportunity` | `/admin/grants/[id]` | admin_manage_grants |
| Delete | Server Action `deleteGrantOpportunity` | `/admin/grants` | admin_manage_grants |

### Promo Codes

| Operation | API Endpoint | UI Entry Point | RLS Policy |
|-----------|--------------|----------------|------------|
| Create | POST `/api/admin/promo-codes` | `/admin/promo-codes` | admin_manage_promo_codes |
| Read | GET `/api/admin/promo-codes` | `/admin/promo-codes` | admin_read_promo_codes |
| Update | PUT `/api/admin/promo-codes` | `/admin/promo-codes` | admin_manage_promo_codes |
| Delete | DELETE `/api/admin/promo-codes` | `/admin/promo-codes` | admin_manage_promo_codes |

## Summary

All core resources have complete CRUD operations with:
- API endpoints for programmatic access
- UI entry points for user interaction
- RLS policies for security enforcement
