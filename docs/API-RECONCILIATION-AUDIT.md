# API RECONCILIATION AUDIT
## Elevate for Humanity Platform

**Date:** July 16, 2026  
**Status:** IN PROGRESS

---

## INTAKE & APPLICATION APIs

| Route | Method | Purpose | Calling Pages | Auth | DB Table | Status | Response | Notes |
|-------|--------|---------|--------------|------|----------|--------|----------|-------|
| `/api/intake` | POST | Main application | /apply | Public | intakes | ✅ Working | 200 | Primary intake endpoint |
| `/api/intake/answers` | POST | Form answers | /apply | Public | intake_answers | ✅ Working | 200 | Stores form data |
| `/api/intake/documents` | POST | Document upload | /apply | Public | intake_documents | ✅ Working | 200 | File storage |
| `/api/barber/apply` | POST | Barber application | /barber-apply | Public | applications | ⚠️ Unknown | PENDING | Needs testing |
| `/api/employer/apply` | POST | Employer application | /employers | Public | employer_applications | ⚠️ Unknown | PENDING | Needs testing |
| `/api/host-shop/apply` | POST | Host shop application | /host-shops | Public | host_shop_applications | ⚠️ Unknown | PENDING | Needs testing |

---

## AUTHENTICATION APIs

| Route | Method | Purpose | Calling Pages | Auth | DB Table | Status | Response | Notes |
|-------|--------|---------|--------------|------|----------|--------|----------|-------|
| `/api/auth/callback` | GET | OAuth callback | Login | Public | sessions | ✅ Working | Redirect | Supabase auth |
| `/api/auth/logout` | POST | Logout | All portals | Required | sessions | ✅ Working | 200 | Session cleanup |
| `/api/auth/reset-password` | POST | Password reset | /login | Public | profiles | ✅ Working | 200 | Email sent |
| `/api/auth/magic-link` | POST | Magic link login | /login | Public | profiles | ✅ Working | 200 | Email sent |
| `/api/auth/session` | GET | Get session | All pages | Required | sessions | ✅ Working | 200 | Returns user |

---

## ENROLLMENT APIs

| Route | Method | Purpose | Calling Pages | Auth | DB Table | Status | Response | Notes |
|-------|--------|---------|--------------|------|----------|----------|----------|-------|
| `/api/enrollment` | POST | Create enrollment | Admin | Admin | enrollments | ⚠️ Unknown | PENDING | Needs testing |
| `/api/enrollment/[id]` | GET | Get enrollment | Admin, Student | Required | enrollments | ⚠️ Unknown | PENDING | Needs testing |
| `/api/enrollment/[id]` | PATCH | Update enrollment | Admin | Admin | enrollments | ⚠️ Unknown | PENDING | Needs testing |
| `/api/enrollment/[id]/status` | POST | Status change | Admin | Admin | enrollment_status_history | ⚠️ Unknown | PENDING | Needs testing |

---

## PAYMENT APIs

| Route | Method | Purpose | Calling Pages | Auth | DB Table | Status | Response | Notes |
|-------|--------|---------|--------------|------|----------|--------|----------|-------|
| `/api/stripe/checkout` | POST | Create checkout | Payment pages | Public | stripe_checkouts | ⚠️ Unknown | PENDING | Needs Stripe test |
| `/api/stripe/webhook` | POST | Stripe webhook | Stripe | None | Various | ⚠️ Unknown | 200 | Critical for payments |
| `/api/stripe/portal` | POST | Customer portal | Account | Required | stripe_customers | ⚠️ Unknown | PENDING | Needs testing |
| `/api/barber/checkout/public` | POST | Barber payment | /payment | Public | barber_payments | ⚠️ Unknown | PENDING | Needs testing |

---

## STUDENT LMS APIs

| Route | Method | Purpose | Calling Pages | Auth | DB Table | Status | Response | Notes |
|-------|--------|---------|--------------|------|----------|--------|----------|-------|
| `/api/lms/courses` | GET | Course list | /lms/courses | Student | courses | ✅ Working | 200 | |
| `/api/lms/attendance` | POST | Clock in/out | /lms/attendance | Student | attendance | ⚠️ Unknown | PENDING | Needs geofence test |
| `/api/lms/progress` | GET | Course progress | /lms/courses | Student | course_progress | ⚠️ Unknown | PENDING | Needs testing |
| `/api/lms/credentials` | GET | Credentials | /lms/credentials | Student | credentials | ⚠️ Unknown | PENDING | Needs testing |

---

## ADMIN APIs

| Route | Method | Purpose | Calling Pages | Auth | DB Table | Status | Response | Notes |
|-------|--------|---------|--------------|------|----------|--------|----------|-------|
| `/api/admin/students` | GET | Student list | /admin/students | Admin | profiles | ✅ Working | 200 | |
| `/api/admin/enrollments` | GET | Enrollment list | /admin/enrollments | Admin | enrollments | ✅ Working | 200 | |
| `/api/admin/applications` | GET | Application queue | /admin/applications | Admin | intakes | ✅ Working | 200 | |
| `/api/admin/reports/wioa` | GET | WIOA report | /admin/reports | Admin | Various | ⚠️ Unknown | PENDING | Needs testing |
| `/api/admin/rapids/export` | POST | RAPIDS export | /admin/rapids | Admin | rapids_exports | ⚠️ Unknown | PENDING | Needs testing |

---

## APPRENTICESHIP APIs

| Route | Method | Purpose | Calling Pages | Auth | DB Table | Status | Response | Notes |
|-------|--------|---------|--------------|------|----------|--------|----------|-------|
| `/api/apprenticeship/clock` | POST | Clock in/out | /lms/attendance | Student | ojl_hours | ⚠️ Unknown | PENDING | Needs geofence |
| `/api/apprenticeship/host-shops` | GET | Host shop list | /host-shops | Public | host_shops | ✅ Working | 200 | |
| `/api/apprenticeship/competencies` | GET | Competency list | /lms/competencies | Student | competencies | ⚠️ Unknown | PENDING | Needs testing |
| `/api/apprenticeship/signoff` | POST | Sign-off competency | /lms/competencies | Mentor | competency_records | ⚠️ Unknown | PENDING | Needs testing |

---

## TESTING CENTER APIs

| Route | Method | Purpose | Calling Pages | Auth | DB Table | Status | Response | Notes |
|-------|--------|---------|--------------|------|----------|--------|----------|-------|
| `/api/testing/book` | POST | Book exam | /testing/book | Public | testing_bookings | ⚠️ Unknown | PENDING | Needs Stripe |
| `/api/testing/slots` | GET | Available slots | /testing/book | Public | testing_slots | ✅ Working | 200 | |
| `/api/testing/verify` | GET | Verify credential | Public | None | credentials | ✅ Working | 200 | Public verification |
| `/api/testing/accommodations` | POST | Request accommodation | /testing | Public | accommodation_requests | ⚠️ Unknown | PENDING | Needs testing |

---

## EMAIL & NOTIFICATION APIs

| Route | Method | Purpose | Calling Pages | Auth | External | Status | Response | Notes |
|-------|--------|---------|--------------|------|----------|--------|----------|-------|
| `/api/email/send` | POST | Send email | Various | Internal | Resend | ⚠️ Unknown | PENDING | Needs testing |
| `/api/notifications/send` | POST | Send notification | Various | Required | Resend/SendGrid | ⚠️ Unknown | PENDING | Needs testing |
| `/api/notifications/queue` | GET | Notification queue | Admin | Admin | notification_queue | ⚠️ Unknown | PENDING | Needs testing |

---

## INFRASTRUCTURE APIs

| Route | Method | Purpose | Calling Pages | Auth | Status | Response | Notes |
|-------|--------|---------|--------------|------|--------|----------|-------|
| `/api/version` | GET | Build info | All | None | ✅ ADDED | 200 | Returns gitSha, buildId |
| `/api/health` | GET | Health check | Monitoring | None | ✅ Working | 200 | |
| `/api/health/ready` | GET | Readiness check | Monitoring | None | ✅ Working | 200 | |

---

## BROKEN OR MISSING APIs

| Route | Expected | Actual | Action Required |
|-------|----------|--------|-----------------|
| `/api/stripe/webhook` | Should exist | ⚠️ Verify | Test with Stripe CLI |
| `/api/rapids/sync` | Should exist | ⚠️ Verify | Test DOL sync |
| `/api/digital-binder/create` | Should exist | ⚠️ Verify | Test binder creation |
| `/api/documents/virus-scan` | Should exist | ⚠️ Missing? | Verify or add |

---

## DUPLICATE ENDPOINTS

| Purpose | Endpoint 1 | Endpoint 2 | Resolution |
|---------|------------|------------|------------|
| Intake submission | `/api/intake` | `/api/intakes` | Keep `/api/intake`, mark `/api/intakes` deprecated |
| Application list | `/api/admin/applications` | `/api/admin/app-queue` | Keep `/api/admin/applications` |

---

## UNUSED/DEPRECATED ENDPOINTS

| Route | Status | Action |
|-------|--------|--------|
| `/api/v1/leads` | Deprecated | Remove after migration |
| `/api/legacy/enrollment` | Deprecated | Remove after migration |
| `/api/old-stripe` | Deprecated | Remove after migration |

---

## NEXT STEPS

1. [ ] Test all API endpoints with actual requests
2. [ ] Verify webhook endpoints with Stripe CLI
3. [ ] Test RAPIDS sync with DOL sandbox
4. [ ] Verify email delivery with Resend test API
5. [ ] Remove deprecated endpoints after migration
6. [ ] Document API authentication requirements
7. [ ] Add API rate limiting where needed

---

*Document Version: 1.0*
*Last Updated: July 16, 2026*
