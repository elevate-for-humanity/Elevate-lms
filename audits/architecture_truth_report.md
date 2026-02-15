# Elevate LMS — Architecture Truth Report

Generated: 2026-02-14 | Source: Live Supabase queries + codebase analysis

## Database Reality

### Tables with Live Data

| Table | Rows | Purpose |
|-------|------|---------|
| profiles | 514 | User accounts with org/tenant binding |
| programs | 55 | Program catalog (42 active, 13 archived) |
| courses | 60 | LMS courses |
| lessons | 540 | Course content units |
| enrollments | 91 | Course-level enrollment tracking |
| program_enrollments | 1 | Program-level enrollment with Stripe payments |
| applications | 76 | Intake applications |
| lesson_progress | 5 | Per-lesson completion + time tracking |
| certificates | 2 | Issued certificates with PDF URLs |
| shops | 2 | Partner employer locations |
| shop_staff | 2 | Partner portal users |
| apprentice_placements | 1 | Student-to-shop assignments |
| assignments | 5 | Course assignments |
| modules | 43 | Program-level modules |
| licenses | 5 | SaaS license keys (4 active trials, 1 expired) |
| employers | 1 | DOL employer records |
| apprentices | 2 | DOL apprentice records |
| organizations | 1 | "Elevate for Humanity" (training_provider) |
| products | Has data | E-commerce store products |
| audit_logs | Has data | Security audit trail |
| roles | 6 | System roles (super_admin through program_holder) |
| permissions | 16 | RBAC permissions (courses, users, enrollments, reports) |
| partner_lms_providers | Has data | External LMS provider configs |

### Tables That Exist but Are Empty

progress_entries, attendance_records, scorm_tracking, quiz_attempts, quizzes,
payments, messages, learning_analytics, funding_applications, user_progress,
notifications, announcements, grades, reviews, invoices, subscriptions,
orders, order_items, cart_items, tax_returns, refund_tracking, employer_sponsors,
documents, media, site_settings, user_roles, tenant_settings, organization_settings,
program_courses, program_modules, scorm_packages, tenants, tenant_licenses

### Tables That Do NOT Exist

cohorts, cohort_members, scorm_attempts, learning_sessions, lesson_sessions,
time_tracking, seat_hours, enrollment_events, discussions, feedback, categories,
tags, sections, submissions, course_categories, course_tags, course_reviews,
store_products, store_orders, store_items, carts, tax_clients, partnerships,
partner_organizations, partner_programs, files, uploads, system_logs,
feature_flags, organization_members, organization_invites

## Tenancy Architecture

The system implements **two parallel tenancy models**:

### 1. Organization Model
- `organizations` table → single org "Elevate for Humanity"
- `organization_users` → maps users to orgs with roles
- `organization_settings` → per-org config
- `profiles.organization_id` → FK to organizations
- `programs.organization_id` → FK to organizations
- Code: `lib/org/getOrgContext.ts` resolves user → org membership

### 2. Tenant Model (SaaS Licensing)
- `tenants` table → created on license purchase
- `tenant_licenses` → Stripe subscription binding
- `licenses` table → license keys with tier/status/max_users
- `profiles.tenant_id` → FK to tenants
- `programs.tenant_id` → FK to tenants
- Code: `lib/tenant/getTenantContext.ts` resolves from JWT/user_metadata
- Code: `lib/store/provision-tenant.ts` creates tenant + admin user on purchase
- Code: `lib/tenant/requireTenant.ts` blocks client-side tenant_id spoofing
- Code: `lib/licenseGuard.ts` enforces plan limits (starter/pro/enterprise)

### 3. RBAC System
- `roles` table: super_admin, admin, instructor, student, case_manager, program_holder
- `permissions` table: 16 permissions across courses, users, enrollments, reports
- `profiles.role` field: simple role assignment
- `user_roles` table: exists but empty (join table for future use)

## Enrollment Pipeline

Two separate enrollment flows:

### Course Enrollment (`enrollments`)
- 91 records, tracks `progress` (0-100), `status` (active/in_progress/completed)
- No payment fields — course enrollment is post-payment

### Program Enrollment (`program_enrollments`)
- Full state machine: `enrollment_state` (orientation → documents → active → completed)
- Stripe integration: `stripe_checkout_session_id`, `stripe_payment_intent_id`, `amount_paid_cents`
- Funding tracking: `funding_source` field
- Onboarding gates: `orientation_completed_at`, `documents_completed_at`, `next_required_action`

### Application Intake (`applications`)
- 76 records, pre-enrollment funnel
- Fields: program_interest, case_manager info, support_notes, contact_preference
- Status: submitted → pending → approved/denied

## Partner Portal

### Data Model
- `shops` (2) → employer locations with EIN, address, active status
- `shop_staff` (2) → user-to-shop binding with role, active flag
- `apprentice_placements` (1) → student-to-shop assignment with dates, status
- `partner_lms_providers` → external LMS API configs
- `partner_lms_enrollments` → cross-platform enrollment tracking
- `partner_courses` → external course catalog with pricing

### API Capabilities (11 endpoints)
- Applications: list, approve, deny
- Apprentices: list
- Attendance: read, record
- Courses: list, create (partner LMS)
- Documents: list, upload
- Enrollment: create (partner LMS)
- Enrollments: list
- Onboarding status: check
- Exports: CSV completions with audit logging

### Security Chain
`getMyPartnerContext()` → 5 checks: auth → role gate → shop_staff → staff.active → shop.active

## Time & Compliance Tracking

### Lesson-Level (Active)
- `lesson_progress.time_spent_seconds` — per-lesson time accumulation
- `lesson_progress.last_position_seconds` — video resume position

### Timeclock System (Schema Ready, No Data)
- `progress_entries` table — clock in/out, lunch tracking, hours_worked, weekly caps
- `attendance_records` table — attendance logging
- `lib/timeclock/queries.ts` — compliance monitoring: active shifts, auto clock-out detection, lunch violations, weekly cap warnings
- `lib/timeclock/useTimeclock.ts` — client-side clock in/out hook

## Admin System

- 277 admin pages total
- 245 have database wiring (89%)
- 32 are static/placeholder (11%)
- Key subsystems: CRM, WIOA compliance, RAPIDS integration, tax filing, course builder, program management, certificate issuance, store management

## E-Commerce / Store

- `products` table with Stripe price IDs, inventory tracking, audience targeting
- `orders`, `order_items`, `cart_items` tables exist (empty)
- `licenses` table with SaaS tiers (starter $99, pro $499, enterprise $2,499)
- `lib/store/provision-tenant.ts` — automated tenant provisioning on purchase

## Key Schema Details

### programs (62 columns)
id, slug, title, category, description, estimated_weeks, estimated_hours, funding_tags,
is_active, full_description, what_you_learn, day_in_life, salary_min, salary_max,
credential_type, credential_name, employers, funding_pathways, delivery_method,
training_hours, prerequisites, career_outcomes, industry_demand, image_url,
hero_image_url, icon_url, featured, wioa_approved, dol_registered, placement_rate,
completion_rate, total_cost, toolkit_cost, credentialing_cost, name, duration_weeks,
cip_code, soc_code, funding_eligibility, state_code, organization_id, category_norm,
cover_image_url, cover_image_alt, excerpt, tenant_id, partner_name, partner_id,
published, lms_model, requires_license, license_type, lms_config, is_store_template,
store_config, store_id, funding_eligible, is_free, status, canonical_program_id

### profiles (15 columns)
id, email, full_name, role, enrollment_status, phone, address, city, state, zip,
avatar_url, created_at, updated_at, organization_id, tenant_id

### certificates (11 columns)
id, user_id, course_id, enrollment_id, certificate_number, issued_at, expires_at,
pdf_url, verification_url, metadata, created_at
