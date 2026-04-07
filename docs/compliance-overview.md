# Compliance Overview

Elevate for Humanity Career & Training Institute operates under multiple regulatory frameworks. This document summarizes the compliance posture of the platform.

## DOL Registered Apprenticeship

**RAPIDS Program:** 2025-IN-132301
**Sponsor:** 2Exclusive LLC-S (Single Employer)
**Registration:** U.S. Department of Labor, Office of Apprenticeship (OA)

The platform tracks all DOL-required apprenticeship data:

| Requirement | Platform Implementation |
|-------------|------------------------|
| RTI hour logs | Per-session attendance records in `training_enrollments` |
| OJT hour logs | Employer-submitted hour logs with supervisor sign-off |
| Competency rubrics | Structured evaluation forms per occupation |
| Apprentice registration | Individual records linked to RAPIDS program ID |
| Wage schedule compliance | Wage progression tracked per apprentice |
| Equal opportunity | EEO disclosures on all apprenticeship pages; sponsor disclosure required by 29 CFR Part 30 |

Registered occupations: Building Services Technician (432 RTI hrs), Hair Stylist (154), Barber (260), Esthetician (300), Nail Tech (200), Youth Culinary (144).

## WIOA Compliance

The platform supports WIOA Title I performance reporting requirements:

| Metric | Tracking Method |
|--------|----------------|
| Enrollment | Application records with funding source |
| Training completion | Course completion records with credential attainment |
| Credential attainment | Certificate issuance linked to national certifying body |
| Employment entered | Placement records at program exit |
| Employment retained | 2nd and 4th quarter follow-up tracking |
| Median earnings | Employer-reported wage data |

Funding sources tracked: WIOA Adult, WIOA Dislocated Worker, WIOA Youth, Workforce Ready Grant, JRI, Next Level Jobs, EmployIndy, self-pay.

## FERPA Alignment

Student educational records are handled in alignment with FERPA principles:

- Student PII is stored in RLS-protected tables — accessible only to the student and authorized staff
- No student records are shared with third parties without consent or legal requirement
- Audit logs record all access to student records
- Data retention policies are documented in the privacy policy

## Platform Security Posture

| Control | Implementation |
|---------|---------------|
| **Authentication** | Supabase Auth — JWT tokens, server-side validation on every request |
| **Authorization** | Row Level Security (RLS) on all database tables |
| **Role-based access** | student, instructor, admin, super_admin, program_holder, delegate, employer |
| **Audit logging** | All critical mutations logged with actor ID, timestamp, IP, and context |
| **Input validation** | Zod schemas on all API routes |
| **Secrets management** | Environment variables only — never committed to source |
| **Transport security** | HTTPS enforced via Netlify; no HTTP fallback |
| **Payment security** | Stripe — no card data stored; PCI DSS handled by Stripe |
| **Multi-tenancy** | Tenant isolation enforced at database and API layers |

## EPA Section 608

Elevate for Humanity is an authorized EPA Section 608 testing center:

- **Certification level:** Universal (all refrigerant types)
- **Authorized providers:** ESCO Group, Mainstream Engineering
- Proctored exams conducted on-site at 8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240

## Audit Logging

All of the following actions are audit-logged with actor, timestamp, and context:

- Enrollment approvals and status changes
- Payment processing and refunds
- Certificate issuance
- Admin mutations to student records
- Funding workflow state changes
- Hour log submissions and approvals
- User role changes

Audit records are immutable and retained per applicable regulatory requirements.

## Reporting

The platform generates the following compliance reports:

- WIOA performance data exports (enrollment, completion, credential, employment)
- DOL apprenticeship hour summaries (RTI + OJT per apprentice)
- Monthly compliance summaries for referring agencies (WorkOne, Indiana DWD, EmployIndy)
- Certificate verification records
- Attendance records per session per student
