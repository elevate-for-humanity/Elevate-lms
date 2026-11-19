-- QA-ONLY STRUCTURAL STAGE — NOT production migration or E2E certification.
-- Source: read-only PostgreSQL catalog export, 2026-11-19.
-- Source project: cuxzzpsyufcewtmicszk. Target: isdgjcdabhxxozarmxta.
-- 17-table FK dependency closure; no application rows, auth identities,
-- secrets, policies, functions, triggers, cron jobs or outbound hooks copied.
-- Authenticated access remains denied pending independently reviewed policies.
SET LOCAL search_path = public, extensions;
DO $qa_empty_guard$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public') THEN
    RAISE EXCEPTION 'QA bootstrap requires an empty public application schema';
  END IF;
END;
$qa_empty_guard$;

CREATE TYPE public."course_status" AS ENUM ('draft', 'published', 'archived');

CREATE TABLE public."cohorts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "program_id" uuid,
  "start_date" date,
  "end_date" date,
  "max_capacity" integer DEFAULT 30,
  "status" text DEFAULT 'planned'::text,
  "tenant_id" uuid,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "code" text,
  "current_enrollment" integer DEFAULT 0,
  "location" text,
  "instructor_id" uuid,
  "notes" text,
  "program_slug" text,
  "partner_name" text,
  "partner_id" uuid,
  "cohort_start_date" date,
  "cohort_end_date" date,
  "planned_end_date" date,
  "duration_weeks_min" integer,
  "duration_weeks_max" integer,
  "delivery_window_text" text DEFAULT 'Mon-Thu 5:30-8:30 PM'::text,
  "session_length_minutes_default" integer DEFAULT 180,
  "sessions_per_week_min" integer DEFAULT 2,
  "sessions_per_week_max" integer DEFAULT 4,
  "funding_streams" jsonb DEFAULT '[]'::jsonb,
  "reporting_notes" text,
  "seat_time_minimum_hours" numeric,
  "seat_time_enforced" boolean DEFAULT false,
  "seat_time_enforced_reason" text,
  "max_enrollment" integer,
  "created_by" uuid,
  "updated_by" uuid,
  "archived_at" timestamp with time zone,
  "archived_by" uuid,
  "archived_reason" text,
  "organization_id" uuid,
  "delivery_mode" text,
  "cohort_name" text
);
ALTER TABLE public."cohorts" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."cohorts" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."cohorts" TO service_role;

CREATE TABLE public."compliance_profiles" (
  "key" text NOT NULL,
  "label" text NOT NULL,
  "credential_target" text NOT NULL,
  "minimum_program_hours" numeric DEFAULT 0 NOT NULL,
  "requires_final_exam" boolean DEFAULT false NOT NULL,
  "require_passing_scores" boolean DEFAULT false NOT NULL,
  "require_instructor_signoff" boolean DEFAULT false NOT NULL,
  "require_evidence_for_practicals" boolean DEFAULT false NOT NULL,
  "require_domain_mapping" boolean DEFAULT false NOT NULL,
  "require_competency_mapping" boolean DEFAULT false NOT NULL,
  "require_hour_category" boolean DEFAULT false NOT NULL,
  "require_delivery_method" boolean DEFAULT false NOT NULL,
  "require_fieldwork_tracking" boolean DEFAULT false NOT NULL,
  "require_instructor_requirements" boolean DEFAULT false NOT NULL,
  "require_certificate_verification" boolean DEFAULT false NOT NULL,
  "domain_requirements" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public."compliance_profiles" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."compliance_profiles" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."compliance_profiles" TO service_role;

CREATE TABLE public."course_enrollments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "assignments" text,
  "completed_at" timestamp with time zone,
  "courses" jsonb DEFAULT '[]'::jsonb,
  "final_grade" text,
  "grade" text,
  "graded_at" timestamp with time zone,
  "max_score" text,
  "programs" text,
  "progress" text,
  "score" numeric DEFAULT 0,
  "status" text DEFAULT 'active'::text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "course_id" uuid,
  "student_id" uuid,
  "revoke_reason" text,
  "revoked_at" timestamp with time zone
);
ALTER TABLE public."course_enrollments" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."course_enrollments" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."course_enrollments" TO service_role;

CREATE TABLE public."course_versions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "course_id" uuid NOT NULL,
  "version_number" integer NOT NULL,
  "label" text,
  "is_published" boolean DEFAULT false NOT NULL,
  "published_at" timestamp with time zone,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "org_id" uuid,
  "snapshot" jsonb,
  "version" integer
);
ALTER TABLE public."course_versions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."course_versions" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."course_versions" TO service_role;

CREATE TABLE public."courses" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "program_id" uuid,
  "legacy_course_id" uuid,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "short_description" text,
  "description" text,
  "status" course_status DEFAULT 'draft'::course_status NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "published_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "course_name" text GENERATED ALWAYS AS (title) STORED,
  "generation_status" text DEFAULT 'draft'::text NOT NULL,
  "generation_progress" integer DEFAULT 0 NOT NULL,
  "generation_paused" boolean DEFAULT false NOT NULL,
  "generator_prompt" text,
  "last_generated_at" timestamp with time zone,
  "thumbnail_url" text,
  "total_lessons" integer DEFAULT 0,
  "duration_hours" numeric(6,1) DEFAULT 0,
  "review_status" text DEFAULT 'draft'::text NOT NULL,
  "submitted_for_review_at" timestamp with time zone,
  "submitted_by" uuid,
  "reviewed_at" timestamp with time zone,
  "reviewed_by" uuid,
  "review_notes" text,
  "org_id" uuid,
  "version" integer DEFAULT 1 NOT NULL,
  "published_by" uuid,
  "compliance_profile_key" text,
  "governing_body" text,
  "governing_region" text,
  "governing_standard_version" text,
  "retention_policy_days" integer,
  "audit_notes" text,
  "course_code" text,
  "category" text DEFAULT 'Trades'::text,
  "passing_score" integer DEFAULT 70,
  "module_id" uuid,
  "course_slug" text,
  "created_by" uuid,
  "metadata" jsonb,
  "duration_weeks" integer,
  "tuition_cost" numeric,
  "max_students" integer,
  "prerequisites" jsonb,
  "learning_outcomes" jsonb
);
ALTER TABLE public."courses" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."courses" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."courses" TO service_role;

CREATE TABLE public."employers" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "business_name" text NOT NULL,
  "contact_name" text,
  "email" text,
  "phone" text,
  "license_number" text,
  "trade" text,
  "approved" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "owner_user_id" uuid,
  "company_name" text,
  "company_size" text,
  "ein" text,
  "industry" text,
  "website_url" text,
  "logo_url" text,
  "description" text,
  "city" text,
  "state" text DEFAULT 'IN'::text,
  "zip" text,
  "is_hiring" boolean DEFAULT false NOT NULL,
  "accepts_ojt" boolean DEFAULT false NOT NULL,
  "accepts_apprentices" boolean DEFAULT false NOT NULL,
  "wotc_participant" boolean DEFAULT false NOT NULL,
  "listed_in_directory" boolean DEFAULT false NOT NULL,
  "verified_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now(),
  "contact_email" text,
  "contact_phone" text,
  "name" text,
  "notes" text,
  "status" text,
  "website" text
);
ALTER TABLE public."employers" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."employers" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."employers" TO service_role;

CREATE TABLE public."funding_programs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text,
  "description" text,
  "status" text DEFAULT 'active'::text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "code" text
);
ALTER TABLE public."funding_programs" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."funding_programs" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."funding_programs" TO service_role;

CREATE TABLE public."host_shops" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "owner_id" uuid,
  "tenant_id" uuid,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "address" text,
  "city" text,
  "state" text,
  "zip_code" text,
  "phone" text,
  "email" text,
  "website" text,
  "services" text[],
  "specializations" text[],
  "years_experience" integer,
  "mentor_count" integer DEFAULT 1,
  "is_accepting_apprentices" boolean DEFAULT true,
  "max_apprentices" integer DEFAULT 2,
  "current_apprentice_count" integer DEFAULT 0,
  "availability_notes" text,
  "image_url" text,
  "active_days" text[],
  "open_time" time without time zone,
  "close_time" time without time zone,
  "owner_name" text,
  "owner_phone" text,
  "owner_email" text,
  "shop_status" text DEFAULT 'active'::text,
  "description" text,
  "approval_status" text DEFAULT 'pending'::text,
  "is_approved" boolean DEFAULT false,
  "verified" boolean DEFAULT false,
  "rating" numeric(3,2),
  "review_count" integer DEFAULT 0
);
ALTER TABLE public."host_shops" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."host_shops" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."host_shops" TO service_role;

CREATE TABLE public."lessons" (
  "id" uuid,
  "course_id" uuid,
  "lesson_number" integer,
  "title" text,
  "content" text,
  "video_url" text,
  "duration_minutes" integer,
  "topics" text[],
  "quiz_questions" jsonb,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone,
  "course_id_uuid" uuid,
  "order_index" integer,
  "is_required" boolean,
  "is_published" boolean,
  "content_type" text,
  "quiz_id" uuid,
  "passing_score" integer,
  "description" text,
  "tenant_id" uuid
);
ALTER TABLE public."lessons" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."lessons" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."lessons" TO service_role;

CREATE TABLE public."organizations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "type" text DEFAULT 'training_provider'::text NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "contact_email" text,
  "onboarding_started_at" timestamp with time zone,
  "org_type" text,
  "website" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "tenant_id" uuid,
  "logo_url" text,
  "tagline" text,
  "support_email" text,
  "service_area_counties" text[],
  "suspension_reason" text,
  "suspended_at" timestamp with time zone,
  "offboarded_at" timestamp with time zone,
  "contact_name" text,
  "domain" text,
  "trial_ends_at" timestamp with time zone,
  "is_trial" boolean DEFAULT false,
  "phone" text,
  "address" text,
  "city" text,
  "state" text,
  "zip" text
);
ALTER TABLE public."organizations" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."organizations" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."organizations" TO service_role;

CREATE TABLE public."partners" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" character varying(255) NOT NULL,
  "dba" character varying(255),
  "ein" character varying(20),
  "owner_name" character varying(255) NOT NULL,
  "contact_email" character varying(255) NOT NULL,
  "phone" character varying(20),
  "address_line1" character varying(255),
  "address_line2" character varying(255),
  "city" character varying(100),
  "state" character varying(50),
  "zip" character varying(20),
  "website" character varying(255),
  "apprentice_capacity" integer DEFAULT 1,
  "license_number" character varying(100),
  "license_state" character varying(50),
  "license_expiry" date,
  "status" character varying(20) DEFAULT 'active'::character varying,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "account_status" character varying(20) DEFAULT 'draft'::character varying,
  "partner_type" text,
  "description" text,
  "logo_url" text,
  "website_url" text,
  "contact_name" text,
  "featured" boolean DEFAULT false,
  "is_active" boolean DEFAULT true,
  "display_order" integer DEFAULT 0,
  "approval_status" text DEFAULT 'pending'::text,
  "approved_at" timestamp with time zone,
  "approved_by" uuid,
  "rejection_reason" text,
  "mou_signed" boolean DEFAULT false,
  "mou_signed_at" timestamp with time zone,
  "documents_verified" boolean DEFAULT false,
  "address" text,
  "onboarding_completed" boolean DEFAULT false,
  "onboarding_step" text,
  "programs" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "shop_name" text,
  "type" text,
  "legal_name" text,
  "contact_phone" text,
  "program_type" text,
  "supervisor_name" text,
  "supervisor_license_number" text,
  "supervisor_years_licensed" integer,
  "compensation_model" text,
  "number_of_employees" integer,
  "workers_comp_status" text,
  "has_general_liability" boolean,
  "can_supervise_and_verify" boolean,
  "mou_acknowledged" boolean DEFAULT false,
  "notes" text,
  "applied_at" timestamp with time zone,
  "mou_version" text,
  "mou_pdf_url" text,
  "mou_sent_at" timestamp with time zone,
  "partner_type_detail" text,
  "public_slug" text,
  "flyer_url" text,
  "public_profile_published_at" timestamp with time zone,
  "verification_status" text DEFAULT 'pending'::text NOT NULL,
  "verification_details" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "rapids_employer_number" text,
  "rapids_registration_status" text,
  "rapids_registered_at" timestamp with time zone,
  "rapids_sponsor_registration_number" text,
  "media_gallery" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "video_url" text,
  "source_url" text,
  "google_maps_url" text,
  "media_verified_at" timestamp with time zone,
  "auto_approved" boolean,
  "enrollment_id" uuid,
  "geocoded_at" timestamp with time zone,
  "lat" numeric,
  "lng" numeric,
  "partner_application_id" uuid,
  "notification_preferences" jsonb DEFAULT '{}'::jsonb NOT NULL
);
ALTER TABLE public."partners" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."partners" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."partners" TO service_role;

CREATE TABLE public."profiles" (
  "id" uuid NOT NULL,
  "email" text,
  "full_name" text,
  "role" text DEFAULT 'student'::text,
  "enrollment_status" text DEFAULT 'pending'::text NOT NULL,
  "phone" text,
  "address" text,
  "city" text,
  "state" text,
  "zip" text,
  "avatar_url" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "organization_id" uuid,
  "tenant_id" uuid,
  "is_active" boolean DEFAULT true,
  "zip_code" text,
  "onboarding_completed" boolean DEFAULT false NOT NULL,
  "onboarding_completed_at" timestamp with time zone,
  "first_name" text,
  "last_name" text,
  "funding_confirmed" boolean DEFAULT false,
  "orientation_completed" boolean DEFAULT false,
  "schedule_selected" boolean DEFAULT false,
  "account_balance" numeric(12,2),
  "agreement_signed_at" timestamp with time zone,
  "bio" text,
  "company" text,
  "current_period_end" timestamp with time zone,
  "funding_source" text,
  "graduation_year" text,
  "headline" text,
  "interests" jsonb,
  "job_title" text,
  "last_sign_in_at" timestamp with time zone,
  "learning_style" text,
  "location" text,
  "notification_preferences" jsonb,
  "points" integer DEFAULT 0,
  "program" text,
  "program_holder_id" uuid,
  "roles" jsonb,
  "skill_level" text,
  "status" text,
  "stripe_customer_id" uuid,
  "subscription_plan" text,
  "subscription_status" text,
  "trial_ends_at" timestamp with time zone,
  "verified" boolean DEFAULT false,
  "onboarding_started" boolean DEFAULT false,
  "onboarding_started_at" timestamp with time zone,
  "selected_cohort" text,
  "orientation_completed_at" timestamp with time zone,
  "external_id" text,
  "date_of_birth" date,
  "last_login_at" timestamp with time zone,
  "last_login_provider" text,
  "last_login_provider_account_id" text,
  "student_number" text,
  "emergency_contact_name" text,
  "emergency_contact_phone" text,
  "emergency_contact_relationship" text,
  "website" text,
  "linkedin_url" text,
  "lti_subject" text,
  "agreements_signed_at" timestamp with time zone,
  "documents_submitted_at" timestamp with time zone,
  "handbook_acknowledged_at" timestamp with time zone,
  "cohort_start_date" date,
  "schedule_preference" text,
  "portal_type" text,
  "company_name" text,
  "company_logo" text,
  "community_visible" boolean DEFAULT false NOT NULL,
  "community_allow_messages" boolean DEFAULT true NOT NULL,
  "community_allow_follow" boolean DEFAULT true NOT NULL,
  "community_show_role" boolean DEFAULT true NOT NULL,
  "suspended" boolean,
  "provider_customer_id" uuid,
  "billing_customer_id" text
);
ALTER TABLE public."profiles" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."profiles" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."profiles" TO service_role;

CREATE TABLE public."program_enrollments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "student_id" uuid,
  "program_id" uuid NOT NULL,
  "program_slug" text,
  "email" text,
  "full_name" text,
  "phone" text,
  "amount_paid_cents" integer DEFAULT 0,
  "funding_source" text DEFAULT 'SELF_PAY'::text,
  "stripe_payment_intent_id" text,
  "stripe_checkout_session_id" text,
  "status" text DEFAULT 'pending'::text,
  "enrollment_state" text DEFAULT 'applied'::text,
  "enrollment_confirmed_at" timestamp with time zone,
  "orientation_completed_at" timestamp with time zone,
  "documents_completed_at" timestamp with time zone,
  "next_required_action" text DEFAULT 'AWAIT_APPROVAL'::text,
  "enrolled_at" timestamp with time zone DEFAULT now(),
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "documents_submitted_at" timestamp with time zone,
  "agreement_signed" boolean DEFAULT false,
  "completed_lessons" text,
  "completion_date" timestamp with time zone,
  "course_id" uuid,
  "delegate_id" uuid,
  "description" text,
  "docs_verified" boolean DEFAULT false,
  "funding_pathway" text,
  "funding_program_id" uuid,
  "intake_completed" boolean DEFAULT false,
  "organization_id" uuid,
  "payment_status" text,
  "program_holder_id" uuid,
  "progress_percent" numeric(5,2),
  "sector" text,
  "start_date" timestamp with time zone,
  "title" text,
  "zip_code" text,
  "enrollment_type" text,
  "paid_at" timestamp with time zone,
  "partner_owed_cents" integer,
  "source" text,
  "your_revenue_cents" integer,
  "cohort" text,
  "cohort_id" uuid,
  "funding_status" text DEFAULT 'funded'::text,
  "funding_status_changed_at" timestamp with time zone,
  "funding_status_reason" text,
  "stripe_customer_id" text,
  "confirmed_at" timestamp with time zone,
  "barber_sub_id" uuid,
  "stripe_subscription_id" text,
  "course_version_id" uuid,
  "access_granted_at" timestamp with time zone,
  "funding_verification_due_at" timestamp with time zone,
  "funding_verification_notes" text,
  "funding_verified" boolean DEFAULT false NOT NULL,
  "revoked_at" timestamp with time zone,
  "revoked_by" uuid,
  "student_start_date" timestamp with time zone,
  "voucher_issued_date" timestamp with time zone,
  "voucher_paid_date" timestamp with time zone,
  "payout_status" text DEFAULT 'not_triggered'::text NOT NULL,
  "payout_due_date" timestamp with time zone,
  "payout_paid_date" timestamp with time zone,
  "payout_paid_by" uuid,
  "payout_notes" text,
  "payout_sent_date" timestamp with time zone,
  "payout_amount" numeric(10,2),
  "at_risk" boolean DEFAULT false NOT NULL,
  "draft_data" jsonb DEFAULT '{}'::jsonb,
  "wizard_step" integer DEFAULT 1,
  "tenant_id" uuid,
  "assigned_staff_id" uuid,
  "student_number" text,
  "training_start_date" date,
  "training_end_date" date,
  "provider_notified_at" timestamp with time zone,
  "provider_notified_by" uuid,
  "stripe_subscription_status" text,
  "host_shop_id" uuid,
  "owner_id" uuid,
  "transfer_hours" numeric DEFAULT 0 NOT NULL,
  "rapids_status" text DEFAULT 'pending'::text NOT NULL,
  "rapids_id" text,
  "lms_enrolled" boolean DEFAULT false NOT NULL,
  "milady_enrolled_at" timestamp with time zone,
  "supervisor_id" uuid,
  "hours_needed" integer DEFAULT 2000 NOT NULL,
  "total_program_fee" numeric,
  "down_payment" numeric DEFAULT 0 NOT NULL,
  "amount_paid" numeric DEFAULT 0 NOT NULL,
  "balance_remaining" numeric,
  "payment_plan_months" integer DEFAULT 0 NOT NULL,
  "monthly_payment_amount" numeric,
  "next_payment_date" date,
  "vendor_paid" boolean DEFAULT false NOT NULL,
  "vendor_paid_at" timestamp with time zone,
  "vendor_payment_amount" numeric,
  "certificate_issued_at" timestamp with time zone,
  "case_id" uuid,
  "region_id" text,
  "payment_option" text,
  "required_hours" numeric DEFAULT 1500 NOT NULL,
  "has_host_shop" boolean DEFAULT false NOT NULL,
  "host_shop_name" text,
  "progress" text,
  "employer_id" uuid,
  "employer_of_record" text,
  "employer_name" text,
  "employer_contact_email" text,
  "employer_contact_phone" text,
  "employer_pays_wage" boolean DEFAULT false NOT NULL,
  "expected_end_date" date,
  "wage_rate_hour" numeric,
  "stipend_total_amount" numeric,
  "tuition_covered_amount" numeric,
  "external_case_id" text,
  "lms_completed" boolean DEFAULT false NOT NULL,
  "practical_skills_verified" boolean DEFAULT false NOT NULL,
  "transfer_hours_verified" boolean DEFAULT false NOT NULL,
  "transfer_hours_verified_at" timestamp with time zone,
  "transfer_hours_source" text,
  "access_status" text,
  "approved_at" timestamp with time zone,
  "approved_by" uuid,
  "at_risk_flagged_at" timestamp with time zone,
  "at_risk_reason" text,
  "cancelled_at" timestamp with time zone,
  "enrollment_method" text,
  "funding_verified_at" timestamp with time zone,
  "funding_verified_by" uuid,
  "last_accessed" timestamp with time zone,
  "last_progress_update" date,
  "pause_reason" text,
  "paused_at" timestamp with time zone,
  "payment_amount_cents" integer,
  "payment_method" text,
  "payment_provider" text,
  "payment_reference" text,
  "practical_hours_completed" numeric DEFAULT 0,
  "progress_percentage" numeric,
  "rapids_registered" boolean,
  "refunded_at" timestamp with time zone,
  "revocation_reason" text,
  "suspended_at" timestamp with time zone,
  "suspension_reason" text,
  "theory_hours_completed" numeric DEFAULT 0,
  "total_hours_completed" numeric,
  "eligibility_status" text,
  "risk_level" text,
  "interview_score" numeric,
  "interview_session_id" uuid,
  "billing_provider" text,
  "provider_subscription_id" text,
  "provider_payment_intent_id" text,
  "provider_checkout_session_id" text,
  "provider_customer_id" text,
  "provider_subscription_status" text
);
ALTER TABLE public."program_enrollments" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."program_enrollments" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."program_enrollments" TO service_role;

CREATE TABLE public."program_holders" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_name" character varying(255) NOT NULL,
  "status" character varying(50) DEFAULT 'pending'::character varying,
  "created_at" timestamp with time zone DEFAULT now(),
  "user_id" uuid,
  "contact_name" text,
  "contact_email" text,
  "contact_phone" text,
  "mou_signed" boolean DEFAULT false,
  "mou_signed_at" timestamp with time zone,
  "payout_status" text DEFAULT 'not_started'::text NOT NULL,
  "is_using_internal_lms" boolean DEFAULT false,
  "approved_at" timestamp with time zone,
  "mou_final_pdf_url" text,
  "mou_status" text,
  "name" text,
  "payout_share" numeric(5,2),
  "approved_by" uuid,
  "primary_program_id" uuid,
  "teaches_multiple" boolean DEFAULT false NOT NULL,
  "mou_holder_name" text,
  "mou_holder_signed_at" timestamp with time zone,
  "mou_holder_sig_url" text,
  "mou_type" text DEFAULT 'universal'::text NOT NULL,
  "hvac_license_url" text,
  "hvac_license_uploaded_at" timestamp with time zone,
  "welcome_email_sent" boolean DEFAULT false NOT NULL,
  "features" jsonb DEFAULT '{}'::jsonb,
  "enrollments_restricted" boolean,
  "mou_admin_name" text,
  "mou_admin_sig_url" text,
  "mou_admin_signed_at" timestamp with time zone,
  "mou_terminated" boolean,
  "probation_reason" text,
  "probation_started_at" timestamp with time zone,
  "restricted_at" timestamp with time zone,
  "restriction_reason" text,
  "suspended_at" timestamp with time zone,
  "suspension_reason" text,
  "terminated_at" timestamp with time zone,
  "termination_reason" text,
  "updated_at" timestamp with time zone,
  "verification_status" text,
  "rejection_reason" text,
  "reviewed_at" timestamp with time zone
);
ALTER TABLE public."program_holders" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."program_holders" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."program_holders" TO service_role;

CREATE TABLE public."programs" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "category" text NOT NULL,
  "description" text,
  "estimated_weeks" integer,
  "estimated_hours" integer,
  "funding_tags" text[] DEFAULT '{}'::text[],
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "full_description" text,
  "what_you_learn" text[],
  "day_in_life" text,
  "salary_min" integer,
  "salary_max" integer,
  "credential_type" text,
  "credential_name" text,
  "employers" jsonb,
  "funding_pathways" text[],
  "delivery_method" text,
  "training_hours" integer,
  "prerequisites" text,
  "career_outcomes" jsonb,
  "industry_demand" text,
  "image_url" text,
  "hero_image_url" text,
  "icon_url" text,
  "featured" boolean DEFAULT false,
  "wioa_approved" boolean DEFAULT true,
  "dol_registered" boolean DEFAULT false,
  "placement_rate" integer,
  "completion_rate" integer,
  "total_cost" numeric(10,2),
  "toolkit_cost" numeric(10,2),
  "credentialing_cost" numeric(10,2),
  "name" text,
  "duration_weeks" integer,
  "updated_at" timestamp with time zone DEFAULT now(),
  "cip_code" text,
  "soc_code" text,
  "funding_eligibility" text[],
  "state_code" text DEFAULT 'IN'::text,
  "organization_id" uuid,
  "category_norm" text,
  "cover_image_url" text,
  "cover_image_alt" text,
  "excerpt" text,
  "tenant_id" uuid,
  "partner_name" text,
  "partner_id" uuid,
  "published" boolean DEFAULT true,
  "lms_model" text DEFAULT 'external'::text,
  "requires_license" boolean DEFAULT false,
  "license_type" text,
  "lms_config" jsonb DEFAULT '{}'::jsonb,
  "is_store_template" boolean DEFAULT false,
  "store_config" jsonb DEFAULT '{}'::jsonb,
  "store_id" uuid,
  "funding_eligible" boolean DEFAULT false,
  "is_free" boolean DEFAULT false,
  "status" text DEFAULT 'active'::text,
  "canonical_program_id" uuid,
  "code" text,
  "total_hours" integer,
  "tuition" numeric(10,2),
  "requirements" jsonb,
  "eligibility_rules" jsonb,
  "credential" text,
  "required_hours" integer,
  "hero_image" text,
  "hero_image_alt" text,
  "availability_status" text DEFAULT 'open'::text,
  "next_start_date" date,
  "enrollment_deadline" date,
  "seats_available" integer,
  "total_seats" integer,
  "funding_cycle" text,
  "funding_confirmed" boolean DEFAULT true,
  "is_apprenticeship" boolean DEFAULT false,
  "requires_employer_match" boolean DEFAULT false,
  "accreditation_body" text,
  "accreditation_expires" text,
  "accreditation_status" text,
  "blurb" text,
  "cover_url" text,
  "delivery_mode" text,
  "duration" text,
  "enrolled_count" integer DEFAULT 0,
  "hours" integer DEFAULT 0,
  "occupation_code" text,
  "price" numeric(12,2),
  "rapids_required" text,
  "required_skills" jsonb,
  "schedule" text,
  "start_date" timestamp with time zone,
  "track" text,
  "type" text,
  "issuance_policy" text DEFAULT 'course_certificate'::text NOT NULL,
  "min_rti_hours" integer DEFAULT 0,
  "min_ojl_hours" integer DEFAULT 0,
  "requires_instructor_attestation" boolean DEFAULT false,
  "min_engagement_hours" numeric,
  "completion_criteria" jsonb DEFAULT '{}'::jsonb,
  "non_exam_program" boolean DEFAULT false NOT NULL,
  "short_description" text,
  "display_order" integer,
  "delivery_model" text,
  "enrollment_type" text,
  "external_enrollment_url" text,
  "has_lms_course" boolean DEFAULT false,
  "hero_headline" text,
  "hero_subheadline" text,
  "length_weeks" integer,
  "certificate_title" text,
  "funding" text,
  "outcomes" text,
  "slug_aliases" text[] DEFAULT '{}'::text[],
  "review_status" text DEFAULT 'draft'::text NOT NULL,
  "submitted_for_review_at" timestamp with time zone,
  "submitted_by" uuid,
  "reviewed_at" timestamp with time zone,
  "reviewed_by" uuid,
  "review_notes" text,
  "version" integer DEFAULT 1 NOT NULL,
  "published_at" timestamp with time zone,
  "published_by" uuid,
  "intrainingid" text,
  "credentials_list" text[] DEFAULT '{}'::text[],
  "etpl_listed" boolean DEFAULT false,
  "learning_objectives" jsonb,
  "certification_awarded" text,
  "enrollment_state" text DEFAULT 'open'::text NOT NULL,
  "next_cohort_date" date,
  "waitlist_enabled" boolean DEFAULT false NOT NULL,
  "internal_provider_ref" text,
  "program_type" text,
  "etpl_requires_initial_eligibility" boolean DEFAULT true NOT NULL,
  "intraining_program_id" text,
  "archived_at" timestamp with time zone,
  "duration_hours" numeric,
  "org_id" uuid
);
ALTER TABLE public."programs" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."programs" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."programs" TO service_role;

CREATE TABLE public."store_instances" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "store_name" text NOT NULL,
  "store_url" text NOT NULL,
  "owner_id" uuid NOT NULL,
  "parent_store_id" uuid,
  "license_id" uuid,
  "is_active" boolean DEFAULT true,
  "settings" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public."store_instances" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."store_instances" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."store_instances" TO service_role;

CREATE TABLE public."tenants" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "status" text DEFAULT 'active'::text,
  "active" boolean DEFAULT false,
  "compliance_ferpa" text,
  "compliance_hipaa" text,
  "compliance_wioa" text,
  "license_expires_at" timestamp with time zone,
  "license_status" text,
  "type" text DEFAULT 'elevate'::text NOT NULL,
  "is_platform_owner" boolean DEFAULT false NOT NULL,
  "parent_tenant_id" uuid,
  "settings" jsonb,
  "stripe_customer_id" text,
  "stripe_subscription_id" text,
  "provider_customer_id" text,
  "provider_subscription_id" text
);
ALTER TABLE public."tenants" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."tenants" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."tenants" TO service_role;
ALTER TABLE public."cohorts" ADD CONSTRAINT "cohorts_delivery_mode_check" CHECK (delivery_mode = ANY (ARRAY['in_person'::text, 'hybrid'::text, 'online'::text, 'self_paced'::text]));
ALTER TABLE public."cohorts" ADD CONSTRAINT "cohorts_pkey" PRIMARY KEY (id);
ALTER TABLE public."compliance_profiles" ADD CONSTRAINT "compliance_profiles_pkey" PRIMARY KEY (key);
ALTER TABLE public."course_enrollments" ADD CONSTRAINT "course_enrollments_pkey" PRIMARY KEY (id);
ALTER TABLE public."course_enrollments" ADD CONSTRAINT "course_enrollments_student_course_key" UNIQUE (student_id, course_id);
ALTER TABLE public."course_versions" ADD CONSTRAINT "course_versions_pkey" PRIMARY KEY (id);
ALTER TABLE public."course_versions" ADD CONSTRAINT "course_versions_course_id_version_number_key" UNIQUE (course_id, version_number);
ALTER TABLE public."courses" ADD CONSTRAINT "courses_generation_progress_check" CHECK (generation_progress >= 0 AND generation_progress <= 100);
ALTER TABLE public."courses" ADD CONSTRAINT "courses_generation_status_check" CHECK (generation_status = ANY (ARRAY['draft'::text, 'generating'::text, 'completed'::text, 'review'::text, 'published'::text]));
ALTER TABLE public."courses" ADD CONSTRAINT "courses_review_status_check" CHECK (review_status = ANY (ARRAY['draft'::text, 'in_review'::text, 'approved'::text, 'rejected'::text, 'published'::text, 'archived'::text]));
ALTER TABLE public."courses" ADD CONSTRAINT "courses_pkey" PRIMARY KEY (id);
ALTER TABLE public."courses" ADD CONSTRAINT "courses_course_code_key" UNIQUE (course_code);
ALTER TABLE public."courses" ADD CONSTRAINT "courses_slug_key" UNIQUE (slug);
ALTER TABLE public."employers" ADD CONSTRAINT "employers_pkey" PRIMARY KEY (id);
ALTER TABLE public."funding_programs" ADD CONSTRAINT "funding_programs_pkey" PRIMARY KEY (id);
ALTER TABLE public."host_shops" ADD CONSTRAINT "host_shops_pkey" PRIMARY KEY (id);
ALTER TABLE public."organizations" ADD CONSTRAINT "organizations_org_type_check" CHECK (org_type = ANY (ARRAY['elevate'::text, 'training_partner'::text, 'credentialing_body'::text, 'employer'::text, 'testing_site'::text]));
ALTER TABLE public."organizations" ADD CONSTRAINT "valid_org_status" CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text, 'inactive'::text]));
ALTER TABLE public."organizations" ADD CONSTRAINT "valid_org_type" CHECK (type = ANY (ARRAY['training_provider'::text, 'employer'::text, 'workforce_board'::text, 'nonprofit'::text, 'government'::text, 'enterprise'::text]));
ALTER TABLE public."organizations" ADD CONSTRAINT "organizations_pkey" PRIMARY KEY (id);
ALTER TABLE public."organizations" ADD CONSTRAINT "organizations_slug_key" UNIQUE (slug);
ALTER TABLE public."partners" ADD CONSTRAINT "partners_account_status_check" CHECK (account_status::text = ANY (ARRAY['draft'::character varying::text, 'submitted'::character varying::text, 'conditional_access'::character varying::text, 'active'::character varying::text, 'restricted'::character varying::text, 'suspended'::character varying::text]));
ALTER TABLE public."partners" ADD CONSTRAINT "partners_pkey" PRIMARY KEY (id);
ALTER TABLE public."partners" ADD CONSTRAINT "partners_contact_email_key" UNIQUE (contact_email);
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_enrollment_status_check" CHECK (enrollment_status = ANY (ARRAY['pending'::text, 'approved'::text, 'active'::text, 'suspended'::text, 'completed'::text, 'rejected'::text]));
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_portal_type_check" CHECK (portal_type = ANY (ARRAY['apprentice'::text, 'healthcare'::text, 'technology'::text, 'business'::text, 'beauty'::text, 'trades'::text, 'social-services'::text, 'barber'::text, 'cosmetology'::text, 'esthetician'::text, 'nail-technician'::text, 'culinary'::text, 'electrical'::text, 'plumbing'::text]));
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_role_check" CHECK (role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'org_admin'::text, 'advisor'::text, 'staff'::text, 'instructor'::text, 'test_admin'::text, 'proctor'::text, 'student'::text, 'learner'::text, 'user'::text, 'delegate'::text, 'grant_client'::text, 'apprentice'::text, 'barber_apprentice'::text, 'cosmetology_apprentice'::text, 'sponsor'::text, 'employer'::text, 'recruiter'::text, 'partner'::text, 'host_shop'::text, 'host_shop_admin'::text, 'workforce_partner'::text, 'parent'::text, 'creator'::text, 'case_manager'::text, 'workforce_board'::text, 'workforce_board_admin'::text, 'program_holder'::text, 'site_coordinator'::text, 'provider'::text, 'provider_admin'::text, 'mentor'::text, 'guest'::text, 'applicant'::text]));
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_tenant_id_not_null" CHECK (tenant_id IS NOT NULL);
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY (id);
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "chk_voucher_date_sequence" CHECK (voucher_paid_date IS NULL OR voucher_issued_date IS NOT NULL AND voucher_issued_date <= voucher_paid_date);
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "enrollment_state_valid" CHECK (enrollment_state IS NULL OR (enrollment_state = ANY (ARRAY['applied'::text, 'onboarding'::text, 'orientation'::text, 'enrolled'::text, 'active'::text, 'pending_funding_verification'::text, 'payment_required'::text, 'suspended'::text, 'revoked'::text, 'withdrawn'::text, 'completed'::text, 'graduated'::text])));
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "program_enrollments_billing_provider_check" CHECK (billing_provider IS NULL OR (billing_provider = ANY (ARRAY['quickbooks'::text, 'stripe'::text]))) NOT VALID;
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "program_enrollments_enrollment_state_check" CHECK (enrollment_state IS NULL OR (enrollment_state = ANY (ARRAY['applied'::text, 'waitlisted'::text, 'onboarding'::text, 'orientation'::text, 'enrolled'::text, 'active'::text, 'pending_funding_verification'::text, 'payment_required'::text, 'suspended'::text, 'revoked'::text, 'withdrawn'::text, 'completed'::text, 'graduated'::text, 'placed'::text, 'follow_up_6mo'::text, 'follow_up_12mo'::text])));
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "program_enrollments_funding_status_check" CHECK (funding_status = ANY (ARRAY['funded'::text, 'refunded'::text, 'disputed'::text, 'unfunded_self_continuing'::text, 'scholarship'::text, 'sponsor_reversed'::text]));
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "program_enrollments_payout_status_check" CHECK (payout_status = ANY (ARRAY['not_triggered'::text, 'pending'::text, 'due'::text, 'overdue'::text, 'paid'::text]));
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "program_enrollments_pkey" PRIMARY KEY (id);
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "program_enrollments_user_program_unique" UNIQUE (user_id, program_slug);
ALTER TABLE public."program_holders" ADD CONSTRAINT "chk_active_requires_mou_signed" CHECK (status::text <> 'active'::text OR mou_signed = true);
ALTER TABLE public."program_holders" ADD CONSTRAINT "program_holders_mou_type_check" CHECK (mou_type = ANY (ARRAY['universal'::text, 'custom_hvac_codelivery'::text, 'custom_cosmetology_codelivery'::text]));
ALTER TABLE public."program_holders" ADD CONSTRAINT "program_holders_pkey" PRIMARY KEY (id);
ALTER TABLE public."programs" ADD CONSTRAINT "programs_availability_status_check" CHECK (availability_status IS NULL OR (availability_status = ANY (ARRAY['open'::text, 'waitlist'::text, 'closed'::text, 'funding_pending'::text, 'coming_soon'::text])));
ALTER TABLE public."programs" ADD CONSTRAINT "programs_enrollment_state_check" CHECK (enrollment_state = ANY (ARRAY['open'::text, 'waitlist'::text, 'closed'::text]));
ALTER TABLE public."programs" ADD CONSTRAINT "programs_enrollment_type_check" CHECK (enrollment_type = ANY (ARRAY['internal'::text, 'external'::text, 'waitlist'::text]));
ALTER TABLE public."programs" ADD CONSTRAINT "programs_issuance_policy_check" CHECK (issuance_policy = ANY (ARRAY['course_certificate'::text, 'apprenticeship_certificate'::text]));
ALTER TABLE public."programs" ADD CONSTRAINT "programs_lms_model_check" CHECK (lms_model = ANY (ARRAY['external'::text, 'internal'::text, 'hybrid'::text, 'scorm_only'::text]));
ALTER TABLE public."programs" ADD CONSTRAINT "programs_program_type_check" CHECK (program_type = ANY (ARRAY['apprenticeship'::text, 'classroom'::text, 'certification'::text, 'bootcamp'::text]));
ALTER TABLE public."programs" ADD CONSTRAINT "programs_review_status_check" CHECK (review_status = ANY (ARRAY['draft'::text, 'in_review'::text, 'approved'::text, 'rejected'::text, 'published'::text, 'archived'::text]));
ALTER TABLE public."programs" ADD CONSTRAINT "programs_slug_format" CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text);
ALTER TABLE public."programs" ADD CONSTRAINT "programs_valid_delivery_model" CHECK (delivery_model = ANY (ARRAY['internal_lms'::text, 'external_admin'::text, 'partner_managed'::text, 'scorm_external'::text]));
ALTER TABLE public."programs" ADD CONSTRAINT "programs_pkey" PRIMARY KEY (id);
ALTER TABLE public."programs" ADD CONSTRAINT "programs_code_key" UNIQUE (code);
ALTER TABLE public."programs" ADD CONSTRAINT "programs_slug_key" UNIQUE (slug);
ALTER TABLE public."store_instances" ADD CONSTRAINT "store_instances_pkey" PRIMARY KEY (id);
ALTER TABLE public."store_instances" ADD CONSTRAINT "store_instances_store_url_key" UNIQUE (store_url);
ALTER TABLE public."tenants" ADD CONSTRAINT "tenants_type_check" CHECK (type IS NULL OR (type = ANY (ARRAY['elevate'::text, 'partner_provider'::text, 'employer'::text, 'workforce_agency'::text, 'customer'::text])));
ALTER TABLE public."tenants" ADD CONSTRAINT "tenants_pkey" PRIMARY KEY (id);
ALTER TABLE public."tenants" ADD CONSTRAINT "tenants_slug_key" UNIQUE (slug);
ALTER TABLE public."cohorts" ADD CONSTRAINT "cohorts_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE public."course_versions" ADD CONSTRAINT "course_versions_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE public."course_versions" ADD CONSTRAINT "course_versions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public."course_versions" ADD CONSTRAINT "course_versions_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE public."courses" ADD CONSTRAINT "courses_compliance_profile_key_fkey" FOREIGN KEY (compliance_profile_key) REFERENCES compliance_profiles(key);
ALTER TABLE public."courses" ADD CONSTRAINT "courses_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public."courses" ADD CONSTRAINT "courses_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE public."courses" ADD CONSTRAINT "courses_program_id_fkey" FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE;
ALTER TABLE public."courses" ADD CONSTRAINT "courses_published_by_fkey" FOREIGN KEY (published_by) REFERENCES auth.users(id);
ALTER TABLE public."courses" ADD CONSTRAINT "courses_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);
ALTER TABLE public."courses" ADD CONSTRAINT "courses_submitted_by_fkey" FOREIGN KEY (submitted_by) REFERENCES auth.users(id);
ALTER TABLE public."employers" ADD CONSTRAINT "employers_owner_user_id_fkey" FOREIGN KEY (owner_user_id) REFERENCES auth.users(id);
ALTER TABLE public."host_shops" ADD CONSTRAINT "host_shops_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public."host_shops" ADD CONSTRAINT "host_shops_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE public."organizations" ADD CONSTRAINT "organizations_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_program_holder_fkey" FOREIGN KEY (program_holder_id) REFERENCES program_holders(id) ON DELETE SET NULL;
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "fk_program_enrollments_course" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "fk_program_enrollments_program" FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "program_enrollments_assigned_staff_id_fkey" FOREIGN KEY (assigned_staff_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "program_enrollments_cohort_id_fkey" FOREIGN KEY (cohort_id) REFERENCES cohorts(id);
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "program_enrollments_course_version_id_fkey" FOREIGN KEY (course_version_id) REFERENCES course_versions(id) ON DELETE SET NULL;
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "program_enrollments_delegate_id_profiles_fkey" FOREIGN KEY (delegate_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "program_enrollments_employer_id_fkey" FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE SET NULL;
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "program_enrollments_funding_program_id_fkey" FOREIGN KEY (funding_program_id) REFERENCES funding_programs(id) ON DELETE SET NULL;
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "program_enrollments_host_shop_id_fkey" FOREIGN KEY (host_shop_id) REFERENCES host_shops(id) ON DELETE SET NULL;
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "program_enrollments_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "program_enrollments_payout_paid_by_fkey" FOREIGN KEY (payout_paid_by) REFERENCES auth.users(id);
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "program_enrollments_program_holder_id_fkey" FOREIGN KEY (program_holder_id) REFERENCES program_holders(id) ON DELETE SET NULL;
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "program_enrollments_provider_notified_by_fkey" FOREIGN KEY (provider_notified_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "program_enrollments_revoked_by_fkey" FOREIGN KEY (revoked_by) REFERENCES profiles(id);
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "program_enrollments_student_id_profiles_fkey" FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE RESTRICT;
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "program_enrollments_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE public."program_enrollments" ADD CONSTRAINT "program_enrollments_user_id_profiles_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE RESTRICT;
ALTER TABLE public."program_holders" ADD CONSTRAINT "program_holders_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public."program_holders" ADD CONSTRAINT "program_holders_primary_program_fkey" FOREIGN KEY (primary_program_id) REFERENCES programs(id) ON DELETE SET NULL;
ALTER TABLE public."program_holders" ADD CONSTRAINT "program_holders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."programs" ADD CONSTRAINT "fk_programs_store" FOREIGN KEY (store_id) REFERENCES store_instances(id) ON DELETE CASCADE;
ALTER TABLE public."programs" ADD CONSTRAINT "programs_canonical_program_id_fkey" FOREIGN KEY (canonical_program_id) REFERENCES programs(id);
ALTER TABLE public."programs" ADD CONSTRAINT "programs_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE public."programs" ADD CONSTRAINT "programs_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE public."programs" ADD CONSTRAINT "programs_partner_id_fkey" FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL;
ALTER TABLE public."programs" ADD CONSTRAINT "programs_published_by_fkey" FOREIGN KEY (published_by) REFERENCES auth.users(id);
ALTER TABLE public."programs" ADD CONSTRAINT "programs_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);
ALTER TABLE public."programs" ADD CONSTRAINT "programs_submitted_by_fkey" FOREIGN KEY (submitted_by) REFERENCES auth.users(id);
ALTER TABLE public."programs" ADD CONSTRAINT "programs_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE public."store_instances" ADD CONSTRAINT "store_instances_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public."store_instances" ADD CONSTRAINT "store_instances_parent_store_id_fkey" FOREIGN KEY (parent_store_id) REFERENCES store_instances(id);
ALTER TABLE public."tenants" ADD CONSTRAINT "tenants_parent_tenant_id_fkey" FOREIGN KEY (parent_tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
CREATE INDEX idx_cohorts_partner_name ON public.cohorts USING btree (partner_name);
CREATE INDEX idx_cohorts_program ON public.cohorts USING btree (program_id);
CREATE INDEX idx_cohorts_start_date ON public.cohorts USING btree (cohort_start_date);
CREATE INDEX idx_cohorts_status ON public.cohorts USING btree (status);
CREATE INDEX idx_fk_cohorts_a39e601cbc0d ON public.cohorts USING btree (organization_id);
CREATE UNIQUE INDEX course_enrollments_student_course_uidx ON public.course_enrollments USING btree (student_id, course_id) WHERE ((student_id IS NOT NULL) AND (course_id IS NOT NULL));
CREATE INDEX idx_course_versions_course ON public.course_versions USING btree (course_id, version_number DESC);
CREATE INDEX idx_cv_course_id ON public.course_versions USING btree (course_id);
CREATE INDEX idx_cv_published ON public.course_versions USING btree (course_id, is_published);
CREATE INDEX idx_fk_course_versions_3128d3157417 ON public.course_versions USING btree (org_id);
CREATE INDEX idx_fk_course_versions_7888bcd592e5 ON public.course_versions USING btree (created_by);
CREATE INDEX idx_courses_legacy_id ON public.courses USING btree (legacy_course_id);
CREATE INDEX idx_courses_org_id ON public.courses USING btree (org_id);
CREATE INDEX idx_courses_program_id ON public.courses USING btree (program_id);
CREATE INDEX idx_courses_status ON public.courses USING btree (status);
CREATE INDEX idx_fk_courses_14ae6ef10b ON public.courses USING btree (created_by);
CREATE INDEX idx_fk_courses_4c7986e3589c ON public.courses USING btree (compliance_profile_key);
CREATE INDEX idx_fk_courses_76359e701b5e ON public.courses USING btree (published_by);
CREATE INDEX idx_fk_courses_e13970f4bfc5 ON public.courses USING btree (reviewed_by);
CREATE INDEX idx_fk_courses_fe530a8f241c ON public.courses USING btree (submitted_by);
CREATE INDEX employers_owner_user_id_idx ON public.employers USING btree (owner_user_id);
CREATE INDEX idx_fk_host_shops_d0ab9e9155 ON public.host_shops USING btree (owner_id);
CREATE INDEX idx_host_shops_tenant ON public.host_shops USING btree (tenant_id);
CREATE INDEX idx_organizations_contact_email ON public.organizations USING btree (contact_email);
CREATE INDEX idx_organizations_slug ON public.organizations USING btree (slug);
CREATE INDEX idx_organizations_status ON public.organizations USING btree (status);
CREATE INDEX idx_organizations_tenant_id ON public.organizations USING btree (tenant_id);
CREATE INDEX idx_organizations_type ON public.organizations USING btree (type);
CREATE INDEX idx_partners_featured ON public.partners USING btree (featured) WHERE (featured = true);
CREATE INDEX idx_partners_programs_gin ON public.partners USING gin (programs);
CREATE INDEX idx_partners_type ON public.partners USING btree (partner_type);
CREATE UNIQUE INDEX partners_public_slug_unique ON public.partners USING btree (public_slug) WHERE (public_slug IS NOT NULL);
CREATE UNIQUE INDEX partners_rapids_employer_number_uidx ON public.partners USING btree (rapids_employer_number) WHERE (rapids_employer_number IS NOT NULL);
CREATE INDEX idx_fk_profiles_209000b37602 ON public.profiles USING btree (program_holder_id);
CREATE INDEX idx_profiles_created_at ON public.profiles USING btree (created_at DESC);
CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);
CREATE INDEX idx_profiles_enrollment_status ON public.profiles USING btree (enrollment_status);
CREATE UNIQUE INDEX idx_profiles_lti_subject ON public.profiles USING btree (lti_subject) WHERE (lti_subject IS NOT NULL);
CREATE INDEX idx_profiles_organization_id ON public.profiles USING btree (organization_id);
CREATE INDEX idx_profiles_portal_type ON public.profiles USING btree (portal_type);
CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);
CREATE INDEX idx_profiles_tenant ON public.profiles USING btree (tenant_id);
CREATE INDEX profiles_community_visible_name_idx ON public.profiles USING btree (community_visible, full_name) WHERE (community_visible = true);
CREATE INDEX idx_fk_program_enrollments_21747ff04ffe ON public.program_enrollments USING btree (course_version_id);
CREATE INDEX idx_fk_program_enrollments_2e3946f654a5 ON public.program_enrollments USING btree (provider_notified_by);
CREATE INDEX idx_fk_program_enrollments_3e9e6c8fb809 ON public.program_enrollments USING btree (revoked_by);
CREATE INDEX idx_fk_program_enrollments_54f6fa53a3 ON public.program_enrollments USING btree (program_holder_id);
CREATE INDEX idx_fk_program_enrollments_a0c0b994df ON public.program_enrollments USING btree (funding_program_id);
CREATE INDEX idx_fk_program_enrollments_aca46a4f30 ON public.program_enrollments USING btree (host_shop_id);
CREATE INDEX idx_fk_program_enrollments_b1405a3e81 ON public.program_enrollments USING btree (organization_id);
CREATE INDEX idx_fk_program_enrollments_ba089f0351 ON public.program_enrollments USING btree (delegate_id);
CREATE INDEX idx_fk_program_enrollments_fb30e5a2a57a ON public.program_enrollments USING btree (payout_paid_by);
CREATE INDEX idx_pe_created_at ON public.program_enrollments USING btree (created_at);
CREATE INDEX idx_pe_payment_status ON public.program_enrollments USING btree (payment_status);
CREATE INDEX idx_pe_payment_status_created ON public.program_enrollments USING btree (payment_status, created_at);
CREATE INDEX idx_pe_state_created ON public.program_enrollments USING btree (enrollment_state, created_at);
CREATE INDEX idx_pe_state_user ON public.program_enrollments USING btree (enrollment_state, user_id) WHERE (enrollment_state = 'active'::text);
CREATE INDEX idx_pe_tenant ON public.program_enrollments USING btree (tenant_id);
CREATE INDEX idx_program_enrollments_access ON public.program_enrollments USING btree (access_granted_at) WHERE (access_granted_at IS NULL);
CREATE INDEX idx_program_enrollments_apprentice_status ON public.program_enrollments USING btree (status, enrollment_type) WHERE (enrollment_type = 'apprentice'::text);
CREATE INDEX idx_program_enrollments_assigned_staff_id ON public.program_enrollments USING btree (assigned_staff_id);
CREATE INDEX idx_program_enrollments_at_risk ON public.program_enrollments USING btree (at_risk) WHERE (at_risk = true);
CREATE INDEX idx_program_enrollments_barber_sub ON public.program_enrollments USING btree (barber_sub_id) WHERE (barber_sub_id IS NOT NULL);
CREATE INDEX idx_program_enrollments_cohort ON public.program_enrollments USING btree (cohort_id);
CREATE INDEX idx_program_enrollments_course_id ON public.program_enrollments USING btree (course_id) WHERE (course_id IS NOT NULL);
CREATE INDEX idx_program_enrollments_email ON public.program_enrollments USING btree (email);
CREATE INDEX idx_program_enrollments_employer_id ON public.program_enrollments USING btree (employer_id);
CREATE INDEX idx_program_enrollments_enrollment_state ON public.program_enrollments USING btree (enrollment_state) WHERE (enrollment_state = 'active'::text);
CREATE INDEX idx_program_enrollments_program ON public.program_enrollments USING btree (program_id);
CREATE INDEX idx_program_enrollments_program_id ON public.program_enrollments USING btree (program_id) WHERE (program_id IS NOT NULL);
CREATE INDEX idx_program_enrollments_revoked_at ON public.program_enrollments USING btree (revoked_at) WHERE (revoked_at IS NOT NULL);
CREATE INDEX idx_program_enrollments_state ON public.program_enrollments USING btree (enrollment_state);
CREATE INDEX idx_program_enrollments_status ON public.program_enrollments USING btree (status);
CREATE INDEX idx_program_enrollments_stripe ON public.program_enrollments USING btree (stripe_payment_intent_id);
CREATE INDEX idx_program_enrollments_stripe_customer ON public.program_enrollments USING btree (stripe_customer_id) WHERE (stripe_customer_id IS NOT NULL);
CREATE INDEX idx_program_enrollments_student ON public.program_enrollments USING btree (student_id);
CREATE INDEX idx_program_enrollments_sub_status ON public.program_enrollments USING btree (stripe_subscription_status) WHERE (stripe_subscription_status IS NOT NULL);
CREATE INDEX idx_program_enrollments_user ON public.program_enrollments USING btree (user_id);
CREATE INDEX idx_program_enrollments_user_active ON public.program_enrollments USING btree (user_id) WHERE (revoked_at IS NULL);
CREATE UNIQUE INDEX program_enrollments_unique_checkout_session ON public.program_enrollments USING btree (stripe_checkout_session_id) WHERE (stripe_checkout_session_id IS NOT NULL);
CREATE UNIQUE INDEX program_enrollments_unique_payment_intent ON public.program_enrollments USING btree (stripe_payment_intent_id) WHERE (stripe_payment_intent_id IS NOT NULL);
CREATE UNIQUE INDEX program_enrollments_unique_student_program ON public.program_enrollments USING btree (student_id, program_slug);
CREATE UNIQUE INDEX uq_program_enrollments_user_program ON public.program_enrollments USING btree (user_id, program_id);
CREATE INDEX idx_fk_program_holders_1ab3f5c512 ON public.program_holders USING btree (approved_by);
CREATE INDEX idx_fk_program_holders_aa072a4d3d63 ON public.program_holders USING btree (primary_program_id);
CREATE INDEX idx_program_holders_status ON public.program_holders USING btree (status);
CREATE INDEX idx_program_holders_user_id ON public.program_holders USING btree (user_id);
CREATE INDEX idx_program_holders_welcome_email_sent ON public.program_holders USING btree (welcome_email_sent) WHERE (welcome_email_sent = false);
CREATE UNIQUE INDEX program_holders_user_id_unique ON public.program_holders USING btree (user_id) WHERE (user_id IS NOT NULL);
CREATE INDEX idx_fk_programs_0f7cf0e6cb41 ON public.programs USING btree (submitted_by);
CREATE INDEX idx_fk_programs_1e88d54a8af6 ON public.programs USING btree (canonical_program_id);
CREATE INDEX idx_fk_programs_3e48b75dedf6 ON public.programs USING btree (reviewed_by);
CREATE INDEX idx_fk_programs_971e2edd25 ON public.programs USING btree (org_id);
CREATE INDEX idx_fk_programs_b0fe678c98e2 ON public.programs USING btree (published_by);
CREATE INDEX idx_programs_active_category ON public.programs USING btree (is_active, category);
CREATE INDEX idx_programs_active_category_norm ON public.programs USING btree (is_active, category_norm);
CREATE INDEX idx_programs_active_created_desc ON public.programs USING btree (is_active, created_at DESC);
CREATE INDEX idx_programs_active_featured_created_desc ON public.programs USING btree (is_active, featured, created_at DESC);
CREATE INDEX idx_programs_availability ON public.programs USING btree (availability_status);
CREATE INDEX idx_programs_category ON public.programs USING btree (category);
CREATE INDEX idx_programs_cip_code ON public.programs USING btree (cip_code);
CREATE INDEX idx_programs_created_at ON public.programs USING btree (created_at DESC);
CREATE INDEX idx_programs_enrollment_state ON public.programs USING btree (enrollment_state);
CREATE INDEX idx_programs_featured ON public.programs USING btree (featured) WHERE (featured = true);
CREATE INDEX idx_programs_is_active ON public.programs USING btree (is_active);
CREATE INDEX idx_programs_is_apprenticeship ON public.programs USING btree (is_apprenticeship);
CREATE INDEX idx_programs_org_active_created_desc ON public.programs USING btree (organization_id, is_active, created_at DESC);
CREATE INDEX idx_programs_organization_id ON public.programs USING btree (organization_id);
CREATE INDEX idx_programs_partner_id ON public.programs USING btree (partner_id);
CREATE INDEX idx_programs_program_type ON public.programs USING btree (program_type);
CREATE INDEX idx_programs_published ON public.programs USING btree (published);
CREATE INDEX idx_programs_published_at ON public.programs USING btree (published_at DESC) WHERE (published = true);
CREATE INDEX idx_programs_slug ON public.programs USING btree (slug);
CREATE INDEX idx_programs_slug_aliases ON public.programs USING gin (slug_aliases);
CREATE INDEX idx_programs_soc_code ON public.programs USING btree (soc_code);
CREATE INDEX idx_programs_state_code ON public.programs USING btree (state_code);
CREATE INDEX idx_programs_store ON public.programs USING btree (store_id);
CREATE INDEX idx_programs_tenant_id ON public.programs USING btree (tenant_id);
CREATE UNIQUE INDEX programs_slug_unique ON public.programs USING btree (slug) WHERE (slug IS NOT NULL);
CREATE UNIQUE INDEX programs_unique_active_slug ON public.programs USING btree (slug) WHERE (is_active = true);
CREATE INDEX idx_store_instances_license ON public.store_instances USING btree (license_id);
CREATE INDEX idx_store_instances_owner ON public.store_instances USING btree (owner_id);
CREATE INDEX idx_store_instances_parent ON public.store_instances USING btree (parent_store_id);
CREATE INDEX idx_tenants_is_platform_owner ON public.tenants USING btree (is_platform_owner) WHERE (is_platform_owner = true);
CREATE INDEX idx_tenants_parent_tenant_id ON public.tenants USING btree (parent_tenant_id) WHERE (parent_tenant_id IS NOT NULL);
CREATE UNIQUE INDEX tenants_single_platform_owner_idx ON public.tenants USING btree ((true)) WHERE (is_platform_owner = true);

