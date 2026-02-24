# Elevate LMS — Database Audit Report

## Summary

- **Live DB**: 1,080 tables + 31 views = 1,111 total
- **Code references**: 877 unique table names in .from() calls
- **Tables in DB with no code refs**: 246 (33 have data, 213 empty)
- **Tables in code but missing from DB**: 1 (pages)
- **Storage buckets missing**: 5
- **Confirmed duplicate table pairs**: 2 with data, 8 empty
- **Column mismatches**: 163 tables where code queries columns that don't exist

## 1. Confirmed Duplicate Tables (SAME DATA)

These tables have identical rows and IDs — one should be dropped.

### KEEP `training_lessons` → DROP `lessons`
- Identical 480 rows, same IDs. Code uses training_lessons (27 files) vs lessons (4 files)
- Action: Migrate 4 code refs from `lessons` → `training_lessons`, then DROP `lessons`

### KEEP `partner_lms_courses` → DROP `partner_courses`
- Identical 329 rows, same IDs. Both used by 6 files each — partner_lms_courses is the canonical name
- Action: Migrate 6 code refs from `partner_courses` → `partner_lms_courses`, then DROP `partner_courses`

## 2. Confirmed Duplicate Tables (EMPTY)

Both tables in each pair are empty with identical schemas.

- **KEEP** `franchise_fee_schedules` → **DROP** `tax_fee_schedules` — Identical 27-col schema, both empty. Code uses franchise_fee_schedules (2 files)
- **KEEP** `franchise_preparer_payouts` → **DROP** `preparer_payouts` — Identical 18-col schema, both empty. Code uses franchise_preparer_payouts (2 files)
- **KEEP** `apprentice_hours_log` → **DROP** `clinical_hours_logs` — Identical 7-col schema, both empty. apprentice_hours_log used by 6 files
- **KEEP** `apprentice_hours_log` → **DROP** `hour_logs` — Identical 7-col schema, both empty. hour_logs used by 1 file
- **KEEP** `ferpa_access_logs` → **DROP** `ferpa_access_log` — Different schemas, both empty. Only ferpa_access_logs used by code
- **KEEP** `feedback` → **DROP** `feedback_votes` — Identical 7-col schema, both empty. Both used by 1 file each
- **KEEP** `feedback` → **DROP** `user_feedback` — Identical 7-col schema, both empty. Both used by 1 file each
- **KEEP** `push_notification_send_log` → **DROP** `push_notifications_log` — Identical 7-col schema, both empty. Both used by 1 file each

## 3. Droppable Views

- `sfc_tax_return_public_status_v2` — unused by code, superseded by v1 view

## 4. Missing Storage Buckets

Code references these buckets but they don't exist in Supabase Storage:

- `apprentice-uploads` — used by 2 files
- `course-content` — used by 3 files
- `module-certificates` — used by 2 files
- `partner-documents` — used by 2 files
- `sam-documents` — used by 2 files

## 5. Missing Tables

- `pages` — used by 1 files (app/admin/portal-map/page.tsx)

## 6. Column Mismatches (Top 30 by Impact)

Tables where code queries columns that don't exist in the DB schema.
These will silently return null for missing columns (Supabase/PostgREST behavior).

| Table | Missing Cols | Files Affected | Key Missing Columns |
|-------|-------------|----------------|---------------------|
| `profiles` | 26 | 30+ files | stripe_customer_id, bio, headline, location, interests, roles, points, etc. |
| `program_enrollments` | 30 | 64 files | start_date, course_id, completion_date, funding_pathway, progress_percent, etc. |
| `training_courses` | 24 | 45 files | slug, category, status, is_published, enrollment_count, rating, etc. |
| `user_profiles` | 7 | 37 files | email, first_name, last_name, role, full_name, employer_id |
| `programs` | 18 | 14 files | hours, price, duration, schedule, delivery_mode, accreditation_status, etc. |
| `certificates` | 11 | 9 files | student_name, student_email, course_name, certificate_url, signed_by, status, etc. |
| `licenses` | 6 | 9 files | ends_at, max_programs, company_name, admin_email, valid_until, organization_id |
| `job_postings` | 7 | 3 files | job_title, job_description, employment_type, positions_available, etc. |
| `apprentice_hours_log` | 7 | 4 files | logged_date, minutes, hour_type, funding_phase, status, verified_by |
| `bridge_payment_plans` | 5 | 3 files | down_payment_paid, balance_remaining, academic_access_paused, etc. |
| `intake_records` | 5 | 3 files | user_id, funding_pathway, employer_name, screening fields |
| `partners` | 6 | 3 files | address, type, shop_name, onboarding_completed, onboarding_step |
| `forum_threads` | 4 | 5 files | forum_id, reply_count, locked, pinned |
| `forums` | 4 | 3 files | name, description, thread_count, post_count |
| `leads` | 2 | 3 files | eligibility_data, stage |
| `enrollment_cases` | 5 | 2 files | student_id, employer_id, program_holder_id, signatures fields |
| `employer_sponsorships` | 5 | 2 files | enrollment_id, total_tuition, term_months, reimbursement fields |
| `messages` | 3 | 3 files | conversation_id, read_by, deleted_by |
| `ferpa_access_logs` | 3 | 2 files | action, record_type, user_id |
| `blog_posts` | 3 | 3 files | author_name, image, status |

*Full list: 163 tables with mismatches. Most are non-critical (columns return null).*

## 7. Unused DB Tables (No Code References)

246 tables have no `.from()` references in app code.

### With Data (33 tables — DO NOT DROP)

These are infrastructure tables (RLS policies, views, reference data):

| Table | Rows | Purpose |
|-------|------|---------|
| `tenant_members` | 515 | RLS policies for multi-tenancy |
| `timezone_names` | 1194 | Reference/lookup table |
| `application_checklist` | 92 | Seeded checklist items |
| `career_course_features` | 84 | Course feature flags |
| `program_partner_lms` | 62 | Partner LMS mappings |
| `stripe_price_enrollment_map` | 54 | Stripe price → enrollment mapping |
| `document_audit_log` | 44 | Audit trail |
| `user_capabilities` | 29 | View — user permissions |
| `indiana_hour_categories` | 25 | State-specific hour categories |
| `wioa_pirl_mappings` | 23 | WIOA reporting field mappings |
| `partner_courses_catalog` | 21 | Partner course catalog |
| `permissions` | 16 | RBAC permissions (used by RLS) |
| `roles` | 11 | RBAC roles (used by RLS) |

### Empty (213 tables)

These are schema-only tables for future features. Safe to keep or drop.
Not listed individually — see `/tmp/unused_db_tables.txt` for full list.

## 8. Recommended Actions (Priority Order)

### Immediate (data integrity)
1. **Merge `lessons` → `training_lessons`**: Update 4 code refs, DROP `lessons`
2. **Merge `partner_courses` → `partner_lms_courses`**: Update 6 code refs, DROP `partner_courses`
3. **Create 5 missing storage buckets**: apprentice-uploads, course-content, module-certificates, partner-documents, sam-documents

### Short-term (schema alignment)
4. **Add missing columns to top 20 tables**: profiles, program_enrollments, training_courses, etc.
5. **Drop 8 empty duplicate tables**: tax_fee_schedules, preparer_payouts, clinical_hours_logs, hour_logs, ferpa_access_log, feedback_votes, user_feedback, push_notifications_log
6. **Drop unused view**: sfc_tax_return_public_status_v2

### Long-term (cleanup)
7. **Audit 213 empty unused tables** — decide keep/drop per feature roadmap
8. **Fix 163 column mismatches** — add ALTER TABLE ADD COLUMN migrations
