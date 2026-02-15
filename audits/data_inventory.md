# Elevate LMS — Data Inventory

Generated: 2026-02-14 | Source: Live Supabase production database

## Live Data Summary

| Metric | Count |
|--------|-------|
| User profiles | 514 |
| Programs (active) | 42 |
| Programs (archived) | 13 |
| Courses | 60 |
| Lessons | 540 |
| Course enrollments | 91 |
| Program enrollments | 1 |
| Applications | 76 |
| Certificates issued | 2 |
| Lesson progress records | 5 |
| Assignments | 5 |
| Program modules | 43 |
| Partner shops | 2 |
| Partner staff | 2 |
| Apprentice placements | 1 |
| Employers | 1 |
| Apprentices | 2 |
| SaaS licenses | 5 |
| Organizations | 1 |
| System roles | 6 |
| Permissions | 16 |
| Admin pages | 277 |
| API routes | 916 |
| LMS pages | 100+ |

## Program Catalog (55 programs)

### Active (42)
Building Maintenance Technician, Commercial Truck Driving (CDL), Web Development,
Certified Nursing Assistant (CNA), Life Coach Certification, CPR Certification,
CDL Training, Reentry Specialist, Tax Preparation, CNA Certification,
Recovery Coach, Emergency Medical Technician Apprenticeship, Peer Recovery Specialist,
Medical Assistant, Peer Support Professional, Phlebotomy Technician,
Cosmetology Apprenticeship, Forklift Operator, Cybersecurity Analyst,
Direct Support Professional, Nail Technician Program, Data Analytics,
Customer Service Representative, Professional Esthetician, Administrative Assistant,
Bookkeeping, Barber Apprenticeship Program, NRF Rise Up, IT Support Specialist,
Emergency Health & Safety, Culinary Apprenticeship, Business Start-Up,
Community Healthcare Worker, Real Estate Agent, Solar Panel Installation,
Insurance Agent, Youth Culinary Apprenticeship, Automotive Technician,
Diesel Mechanic, Pharmacy Technician, Dental Assistant,
Entrepreneurship / Small Business, Manufacturing Technician

### Archived (13)
Hair Stylist (Nail Tech) Apprenticeship, Esthetician Apprenticeship,
Barber Apprenticeship Program (dup), Nail Technician Apprenticeship,
Test Enrollment ($1), HVAC Technician (3 versions), Barber Apprenticeship (2 versions),
EMS Apprenticeship, Hair Stylist (Esthetician) Apprenticeship

## Table Schema Reference

### Core LMS
- **profiles**: id, email, full_name, role, enrollment_status, phone, address, city, state, zip, avatar_url, organization_id, tenant_id
- **courses**: id, course_name, course_code, description, duration_hours, price, is_active
- **lessons**: id, course_id, order_number, title, content, video_url, duration_minutes, topics, quiz_questions
- **enrollments**: id, user_id, course_id, status, progress, enrolled_at, completed_at
- **lesson_progress**: id, user_id, lesson_id, course_id, completed, completed_at, time_spent_seconds, last_position_seconds
- **certificates**: id, user_id, course_id, enrollment_id, certificate_number, issued_at, expires_at, pdf_url, verification_url, metadata

### Program Management
- **programs**: 62 columns (see architecture report for full list)
- **modules**: id, program_id, title, summary, order_index, description
- **course_modules**: id, course_id, title, description, order_index, duration_minutes, content, video_url
- **program_enrollments**: id, user_id, student_id, program_id, program_slug, email, full_name, phone, amount_paid_cents, funding_source, stripe_payment_intent_id, stripe_checkout_session_id, status, enrollment_state, enrollment_confirmed_at, orientation_completed_at, documents_completed_at, next_required_action, enrolled_at, started_at, completed_at
- **assignments**: id, course_id, lesson_id, title, description, instructions, max_points, due_date, allow_late_submission, late_penalty_percent, submission_type, max_file_size_mb, allowed_file_types

### Applications & Intake
- **applications**: id, first_name, last_name, phone, email, city, zip, program_interest, has_case_manager, case_manager_agency, support_notes, contact_preference, advisor_email, status, employer_sponsor_id, submit_token, program_id, user_id, pathway_slug, source

### Partner Portal
- **shops**: id, name, ein, address1, address2, city, state, zip, phone, email, active
- **shop_staff**: id, shop_id, user_id, role, active, deactivated_at, deactivated_by
- **apprentice_placements**: id, student_id, program_slug, shop_id, supervisor_user_id, start_date, end_date, status
- **partner_lms_providers**: id, provider_name, provider_type, website_url, support_email, active, api_config, metadata
- **partner_lms_enrollments**: id, provider_id, student_id, course_id, program_id, status, progress_percentage, enrolled_at, completed_at, external_enrollment_id, external_account_id, external_certificate_id, funding_source, certificate_issued_at
- **partner_courses**: id, provider_id, course_name, course_code, external_course_code, description, hours, level, credential_type, price, active, base_cost_cents, retail_price_cents, platform_margin_cents, markup_percent, stripe_price_id, enrollment_link, hsi_course_id
- **partner_export_logs**: id, user_id, user_email, shop_ids, row_count, export_type, exported_at

### DOL / Apprenticeship
- **employers**: id, business_name, contact_name, email, phone, license_number, trade, approved, owner_user_id
- **apprentices**: id, referral_id, employer_id, rapids_id, start_date, status, user_id, barber_subscription_id, mou_signed_at, dashboard_invite_sent_at

### SaaS / Multi-Tenant
- **organizations**: id, slug, name, type, status
- **organization_users**: id, organization_id, user_id, role
- **tenants**: id, name, slug, status
- **licenses**: id, license_key, domain, customer_email, tenant_id, tier, status, max_users, max_deployments, features, expires_at, stripe_customer_id, stripe_subscription_id, current_period_end, suspended_at, canceled_at
- **tenant_licenses**: id, tenant_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, plan_name, status, seats_limit, seats_used, features, current_period_start, current_period_end

### RBAC
- **roles**: id, name, description, is_system
- **permissions**: id, name, description, resource, action

### E-Commerce
- **products**: id, name, slug, description, price, type, category, image_url, stripe_price_id, is_active, audiences, features, tags, is_featured, badge, sort_order, inventory_quantity, track_inventory, requires_shipping

### Compliance & Audit
- **audit_logs**: id, action, actor_id, target_type, target_id, metadata, ip_address, user_agent
- **progress_entries**: timeclock data (clock in/out, lunch, hours_worked, weekly caps) — empty
- **attendance_records**: attendance logging — empty
