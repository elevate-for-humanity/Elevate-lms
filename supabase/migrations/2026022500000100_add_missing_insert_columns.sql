-- Add missing columns that code references in insert/update/upsert operations.
-- Prevents runtime failures from column-not-found errors.
-- Executed on live DB 2025-02-25.

-- audit_logs: 52 columns used in code, many were missing
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_type text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_id text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details jsonb;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS event_type text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS before_state jsonb;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS after_state jsonb;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_email text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS program_id uuid;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS student_id uuid;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_id text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_type text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS changes jsonb;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_user_id uuid;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS meta jsonb;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS who text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS reason text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS creator_email text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS email_sent boolean;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS timestamp timestamptz;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS count integer;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS steps_generated integer;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS agreements_signed boolean;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS total_courses integer;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS successful integer;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS failed integer;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS forced boolean;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS program_title text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS eligible boolean;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS funding_types text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS stage text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS career_interest text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS week_ending text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS hours_worked numeric;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS hours numeric;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS credential_type text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS viewer_role text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS results_count integer;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS share_link_id text;

-- applications
ALTER TABLE applications ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS notes text;

-- certificates
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS completion_date date;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS issued_by text;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS serial text;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS template_id uuid;

-- email_logs
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS campaign_id text;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS error_message text;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS recipient_email text;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS recipient_id uuid;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS sent_at timestamptz;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS workflow_id text;

-- enrollment_events
ALTER TABLE enrollment_events ADD COLUMN IF NOT EXISTS course_id uuid;
ALTER TABLE enrollment_events ADD COLUMN IF NOT EXISTS funding_program_id uuid;
ALTER TABLE enrollment_events ADD COLUMN IF NOT EXISTS kind text;

-- page_views
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS page text;

-- license_events
ALTER TABLE license_events ADD COLUMN IF NOT EXISTS admin_email text;
ALTER TABLE license_events ADD COLUMN IF NOT EXISTS correlation_id text;
ALTER TABLE license_events ADD COLUMN IF NOT EXISTS custom_domain text;
ALTER TABLE license_events ADD COLUMN IF NOT EXISTS days_remaining integer;
ALTER TABLE license_events ADD COLUMN IF NOT EXISTS days_since_creation integer;
ALTER TABLE license_events ADD COLUMN IF NOT EXISTS expired_by text;
ALTER TABLE license_events ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE license_events ADD COLUMN IF NOT EXISTS plan_id text;
ALTER TABLE license_events ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE license_events ADD COLUMN IF NOT EXISTS subdomain text;

-- payment_logs
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS funding_source text;
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS kind text;
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS payment_type text;
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS preferred_method text;
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS program_slug text;
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS program_id uuid;
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS program_name text;
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS session_id text;
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS stripe_payment_id text;
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS student_id uuid;
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS type text;

-- profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS external_id text;

-- program_enrollments
ALTER TABLE program_enrollments ADD COLUMN IF NOT EXISTS enrollment_type text;
ALTER TABLE program_enrollments ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE program_enrollments ADD COLUMN IF NOT EXISTS partner_owed_cents integer;
ALTER TABLE program_enrollments ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE program_enrollments ADD COLUMN IF NOT EXISTS your_revenue_cents integer;

-- exam_readiness
ALTER TABLE exam_readiness ADD COLUMN IF NOT EXISTS student_id uuid;
ALTER TABLE exam_readiness ADD COLUMN IF NOT EXISTS theory_complete boolean DEFAULT false;

-- program_holder_verification
ALTER TABLE program_holder_verification ADD COLUMN IF NOT EXISTS identity_documents_uploaded boolean DEFAULT false;
ALTER TABLE program_holder_verification ADD COLUMN IF NOT EXISTS identity_documents_uploaded_at timestamptz;
ALTER TABLE program_holder_verification ADD COLUMN IF NOT EXISTS identity_verification_status text;
ALTER TABLE program_holder_verification ADD COLUMN IF NOT EXISTS program_holder_id uuid;
ALTER TABLE program_holder_verification ADD COLUMN IF NOT EXISTS ssn_verified boolean DEFAULT false;
ALTER TABLE program_holder_verification ADD COLUMN IF NOT EXISTS ssn_verified_at timestamptz;

-- scorm_cmi_data
ALTER TABLE scorm_cmi_data ADD COLUMN IF NOT EXISTS attempt_id text;
ALTER TABLE scorm_cmi_data ADD COLUMN IF NOT EXISTS cmi_key text;
ALTER TABLE scorm_cmi_data ADD COLUMN IF NOT EXISTS cmi_value text;

-- user_entitlements
ALTER TABLE user_entitlements ADD COLUMN IF NOT EXISTS entitlement_type text;
ALTER TABLE user_entitlements ADD COLUMN IF NOT EXISTS granted_at timestamptz;
ALTER TABLE user_entitlements ADD COLUMN IF NOT EXISTS stripe_payment_id text;
