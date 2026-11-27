-- Stage the isolated apprenticeship and admissions runtime schema for browser QA.
-- Only the published barber standard and document requirements are seeded.

BEGIN;
SET LOCAL search_path = public, pg_catalog;

DO $qa$
DECLARE
  relation_name text;
BEGIN
  IF to_regclass('private.qa_environment_identity') IS NULL THEN
    RAISE EXCEPTION 'Apprentice schema stage requires the isolated QA identity';
  END IF;
  IF (SELECT array_agg(project_ref) FROM private.qa_environment_identity)
       IS DISTINCT FROM ARRAY['isdgjcdabhxxozarmxta']::text[] THEN
    RAISE EXCEPTION 'Apprentice schema stage refused outside isolated QA';
  END IF;
  FOREACH relation_name IN ARRAY ARRAY[
      'agreement_acceptances',
      'apprentice_document_types',
      'apprentice_placements',
      'apprenticeship_practical_service_requirements',
      'apprenticeship_rti_entries',
      'apprenticeship_rti_requirements',
      'apprenticeship_standard_versions',
      'apprenticeship_theory_schedules',
      'billing_migration_authorizations',
      'billing_schedules',
      'digital_binders',
      'handbook_acknowledgments',
      'host_shop_match_requests',
      'host_shop_practical_service_entries',
      'license_agreement_acceptances',
      'program_completion_certificates',
      'rapids_employer_wage_schedules',
      'rapids_rti_providers',
      'host_shop_practical_service_progress',
      'admin_audit_events'
  ] LOOP
    IF to_regclass(format('public.%I', relation_name)) IS NOT NULL THEN
      RAISE EXCEPTION 'Apprentice schema preflight found an existing relation: %', relation_name;
    END IF;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents' AND NOT public) THEN
    RAISE EXCEPTION 'Apprentice schema stage requires the existing private document bucket';
  END IF;
END;
$qa$;

CREATE TYPE public.agreement_type AS ENUM (
  'enrollment',
  'handbook',
  'program_holder_mou',
  'employer_agreement',
  'staff_agreement',
  'license',
  'data_sharing',
  'ferpa',
  'participation',
  'media_release',
  'eula',
  'tos',
  'aup',
  'disclosures',
  'nda',
  'mou',
  'apprenticeship_agreement'
);

CREATE TABLE public.agreement_acceptances (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "subject_type" text NOT NULL,
  "subject_id" uuid NOT NULL,
  "agreement_key" text NOT NULL,
  "agreement_version" text NOT NULL,
  "accepted_name" text NOT NULL,
  "accepted_email" text NOT NULL,
  "accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
  "accepted_ip" text,
  "user_agent" text,
  CONSTRAINT "agreement_acceptances_pkey" PRIMARY KEY (id),
  CONSTRAINT "agreement_acceptances_subject_type_check" CHECK (subject_type = ANY (ARRAY['apprentice'::text, 'host_shop'::text]))
);

CREATE TABLE public.apprentice_document_types (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" text,
  "description" text,
  "file_url" text,
  "user_id" uuid,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "program_slug" text,
  "document_type" text,
  "name" text,
  "is_required" boolean DEFAULT true NOT NULL,
  "accepted_formats" text[] DEFAULT ARRAY['pdf'::text, 'jpg'::text, 'jpeg'::text, 'png'::text] NOT NULL,
  "max_file_size_mb" integer DEFAULT 10 NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "apprentice_document_types_pkey" PRIMARY KEY (id),
  CONSTRAINT "uq_program_slug_document_type_17" UNIQUE (program_slug, document_type)
);

CREATE TABLE public.apprentice_placements (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL,
  "program_slug" text DEFAULT 'barber-apprenticeship'::text NOT NULL,
  "shop_id" uuid NOT NULL,
  "supervisor_user_id" uuid,
  "start_date" date DEFAULT CURRENT_DATE NOT NULL,
  "end_date" date,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "tenant_id" uuid,
  "match_request_id" uuid,
  CONSTRAINT "apprentice_placements_pkey" PRIMARY KEY (id),
  CONSTRAINT "apprentice_placements_student_id_shop_id_program_slug_key" UNIQUE (student_id, shop_id, program_slug),
  CONSTRAINT "placements_tenant_id_not_null" CHECK (tenant_id IS NOT NULL)
);

CREATE TABLE public.apprenticeship_practical_service_requirements (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "program_slug" text NOT NULL,
  "course_id" uuid NOT NULL,
  "lesson_id" uuid NOT NULL,
  "service_name" text NOT NULL,
  "exercise_title" text NOT NULL,
  "instructions" text NOT NULL,
  "required_count" integer NOT NULL,
  "allowed_subject_types" text[] DEFAULT ARRAY['patron'::text, 'mannequin'::text, 'student'::text] NOT NULL,
  "counts_for_completion" boolean DEFAULT true NOT NULL,
  "authority" text DEFAULT 'elevate-program-practice'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "apprenticeship_practical_serv_program_slug_lesson_id_servic_key" UNIQUE (program_slug, lesson_id, service_name),
  CONSTRAINT "apprenticeship_practical_service_r_allowed_subject_types_check1" CHECK (allowed_subject_types <@ ARRAY['patron'::text, 'mannequin'::text, 'student'::text]),
  CONSTRAINT "apprenticeship_practical_service_re_allowed_subject_types_check" CHECK (cardinality(allowed_subject_types) > 0),
  CONSTRAINT "apprenticeship_practical_service_requireme_required_count_check" CHECK (required_count > 0),
  CONSTRAINT "apprenticeship_practical_service_requirements_pkey" PRIMARY KEY (id)
);

CREATE TABLE public.apprenticeship_rti_entries (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "enrollment_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "standard_key" text NOT NULL,
  "requirement_id" uuid NOT NULL,
  "course_id" uuid,
  "lesson_id" uuid,
  "instruction_date" date NOT NULL,
  "delivery_method" text NOT NULL,
  "minutes_claimed" integer NOT NULL,
  "minutes_verified" integer,
  "evidence_url" text,
  "evidence_notes" text,
  "instructor_user_id" uuid,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "verified_by" uuid,
  "verified_at" timestamp with time zone,
  "rejection_reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "apprenticeship_rti_entries_check" CHECK (minutes_verified IS NULL OR minutes_verified > 0 AND minutes_verified <= minutes_claimed),
  CONSTRAINT "apprenticeship_rti_entries_delivery_method_check" CHECK (delivery_method = ANY (ARRAY['lms'::text, 'classroom'::text, 'live_virtual'::text, 'lab'::text, 'external_approved'::text])),
  CONSTRAINT "apprenticeship_rti_entries_enrollment_id_instruction_date_r_key" UNIQUE (enrollment_id, instruction_date, requirement_id, lesson_id, delivery_method),
  CONSTRAINT "apprenticeship_rti_entries_minutes_claimed_check" CHECK (minutes_claimed > 0 AND minutes_claimed <= 720),
  CONSTRAINT "apprenticeship_rti_entries_pkey" PRIMARY KEY (id),
  CONSTRAINT "apprenticeship_rti_entries_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text]))
);

CREATE TABLE public.apprenticeship_rti_requirements (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "standard_key" text NOT NULL,
  "title" text NOT NULL,
  "required_hours" integer NOT NULL,
  "display_order" integer NOT NULL,
  CONSTRAINT "apprenticeship_rti_requirements_pkey" PRIMARY KEY (id),
  CONSTRAINT "apprenticeship_rti_requirements_required_hours_check" CHECK (required_hours > 0),
  CONSTRAINT "apprenticeship_rti_requirements_standard_key_display_order_key" UNIQUE (standard_key, display_order)
);

CREATE TABLE public.apprenticeship_standard_versions (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "standard_key" text NOT NULL,
  "program_slug" text NOT NULL,
  "occupation_title" text NOT NULL,
  "onet_soc_code" text NOT NULL,
  "rapids_code" text NOT NULL,
  "sponsor_name" text NOT NULL,
  "registration_number" text NOT NULL,
  "registration_date" date,
  "revision_date" date NOT NULL,
  "approach" text NOT NULL,
  "competency_count" integer NOT NULL,
  "related_instruction_hours" integer NOT NULL,
  "apprentice_to_mentor_ratio" text NOT NULL,
  "probationary_hours" integer,
  "source_authority" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "apprenticeship_standard_version_related_instruction_hours_check" CHECK (related_instruction_hours > 0),
  CONSTRAINT "apprenticeship_standard_versions_approach_check" CHECK (approach = ANY (ARRAY['competency_based'::text, 'time_based'::text, 'hybrid'::text])),
  CONSTRAINT "apprenticeship_standard_versions_competency_count_check" CHECK (competency_count > 0),
  CONSTRAINT "apprenticeship_standard_versions_pkey" PRIMARY KEY (id),
  CONSTRAINT "apprenticeship_standard_versions_standard_key_key" UNIQUE (standard_key)
);

CREATE TABLE public.apprenticeship_theory_schedules (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "placement_id" uuid,
  "partner_id" uuid,
  "program_slug" text NOT NULL,
  "course_id" uuid,
  "timezone" text DEFAULT 'America/Indiana/Indianapolis'::text NOT NULL,
  "days_of_week" smallint[] DEFAULT ARRAY[(1)::smallint, (2)::smallint, (3)::smallint, (4)::smallint] NOT NULL,
  "start_time" time without time zone DEFAULT '18:00:00'::time without time zone NOT NULL,
  "end_time" time without time zone DEFAULT '18:45:00'::time without time zone NOT NULL,
  "weekly_target_minutes" integer DEFAULT 180 NOT NULL,
  "weekly_max_minutes" integer DEFAULT 600 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "starts_on" date DEFAULT '2026-09-21'::date,
  "learner_confirmed_at" timestamp with time zone,
  CONSTRAINT "apprenticeship_theory_schedules_pkey" PRIMARY KEY (id),
  CONSTRAINT "theory_schedule_days_valid" CHECK (cardinality(days_of_week) >= 1 AND cardinality(days_of_week) <= 7 AND days_of_week <@ ARRAY[1::smallint, 2::smallint, 3::smallint, 4::smallint, 5::smallint, 6::smallint, 7::smallint]),
  CONSTRAINT "theory_schedule_max_valid" CHECK (weekly_max_minutes >= weekly_target_minutes AND weekly_max_minutes <= 2400),
  CONSTRAINT "theory_schedule_target_valid" CHECK (weekly_target_minutes >= 30 AND weekly_target_minutes <= 2400),
  CONSTRAINT "theory_schedule_time_valid" CHECK (end_time > start_time)
);

CREATE TABLE public.billing_migration_authorizations (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "billing_schedule_id" uuid,
  "legacy_stripe_subscription_id" text,
  "customer_name" text NOT NULL,
  "customer_email" text NOT NULL,
  "product_name" text NOT NULL,
  "amount_cents" bigint NOT NULL,
  "cadence" text NOT NULL,
  "status" text DEFAULT 'requested'::text NOT NULL,
  "document_path" text,
  "document_name" text,
  "submitted_at" timestamp with time zone,
  "reviewed_at" timestamp with time zone,
  "reviewed_by" uuid,
  "rejection_reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "legacy_provider_subscription_id" text,
  "authorization_scope" text DEFAULT 'recurring_tuition'::text NOT NULL,
  "authorization_method" text DEFAULT 'signed_release'::text NOT NULL,
  "provider_agreement_id" text,
  CONSTRAINT "billing_migration_authorizati_user_id_legacy_stripe_subscri_key" UNIQUE (user_id, legacy_stripe_subscription_id),
  CONSTRAINT "billing_migration_authorizations_amount_cents_check" CHECK (amount_cents > 0),
  CONSTRAINT "billing_migration_authorizations_authorization_method_check" CHECK (authorization_method = ANY (ARRAY['signed_release'::text, 'paypal_agreement'::text, 'both'::text])),
  CONSTRAINT "billing_migration_authorizations_authorization_scope_check" CHECK (authorization_scope = 'recurring_tuition'::text),
  CONSTRAINT "billing_migration_authorizations_cadence_check" CHECK (cadence = ANY (ARRAY['weekly'::text, 'monthly'::text, 'quarterly'::text, 'annual'::text])),
  CONSTRAINT "billing_migration_authorizations_pkey" PRIMARY KEY (id),
  CONSTRAINT "billing_migration_authorizations_status_check" CHECK (status = ANY (ARRAY['requested'::text, 'submitted'::text, 'approved'::text, 'rejected'::text, 'superseded'::text]))
);

CREATE TABLE public.billing_schedules (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "customer_external_key" text NOT NULL,
  "customer_name" text NOT NULL,
  "customer_email" text NOT NULL,
  "canonical_product_key" text NOT NULL,
  "product_name" text NOT NULL,
  "product_description" text,
  "provider" text DEFAULT 'quickbooks'::text NOT NULL,
  "amount_cents" bigint NOT NULL,
  "cadence" text NOT NULL,
  "next_invoice_date" date NOT NULL,
  "remaining_invoices" integer,
  "status" text DEFAULT 'active'::text NOT NULL,
  "legacy_stripe_subscription_id" text,
  "fulfillment_type" text,
  "fulfillment_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "legacy_provider_subscription_id" text,
  "collection_mode" text DEFAULT 'automatic'::text NOT NULL,
  "collection_provider" text DEFAULT 'paypal'::text NOT NULL,
  "provider_product_id" text,
  "provider_plan_id" text,
  "provider_subscription_id" text,
  "provider_status" text DEFAULT 'not_configured'::text NOT NULL,
  "provider_approval_url" text,
  "activated_at" timestamp with time zone,
  "last_provider_sync_at" timestamp with time zone,
  CONSTRAINT "billing_schedules_amount_cents_check" CHECK (amount_cents > 0),
  CONSTRAINT "billing_schedules_cadence_check" CHECK (cadence = ANY (ARRAY['weekly'::text, 'monthly'::text, 'quarterly'::text, 'annual'::text])),
  CONSTRAINT "billing_schedules_collection_mode_check" CHECK (collection_mode = ANY (ARRAY['automatic'::text, 'manual_invoice'::text])),
  CONSTRAINT "billing_schedules_collection_provider_check" CHECK (collection_provider = ANY (ARRAY['paypal'::text, 'none'::text])),
  CONSTRAINT "billing_schedules_pkey" PRIMARY KEY (id),
  CONSTRAINT "billing_schedules_provider_check" CHECK (provider = 'quickbooks'::text),
  CONSTRAINT "billing_schedules_provider_customer_external_key_canonical__key" UNIQUE (provider, customer_external_key, canonical_product_key),
  CONSTRAINT "billing_schedules_provider_status_check" CHECK (provider_status = ANY (ARRAY['not_configured'::text, 'approval_pending'::text, 'active'::text, 'suspended'::text, 'canceled'::text, 'expired'::text, 'failed'::text])),
  CONSTRAINT "billing_schedules_remaining_invoices_check" CHECK (remaining_invoices IS NULL OR remaining_invoices >= 0),
  CONSTRAINT "billing_schedules_status_check" CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'canceled'::text]))
);

CREATE TABLE public.digital_binders (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "enrollment_id" uuid,
  "title" text DEFAULT 'Student Digital Binder'::text NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "student_id" uuid,
  CONSTRAINT "digital_binders_pkey" PRIMARY KEY (id),
  CONSTRAINT "digital_binders_status_check" CHECK (status = ANY (ARRAY['active'::text, 'archived'::text]))
);

CREATE TABLE public.handbook_acknowledgments (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "tenant_id" uuid,
  "handbook_version" text NOT NULL,
  "handbook_hash" text,
  "acknowledged_at" timestamp with time zone DEFAULT now() NOT NULL,
  "ip_address" inet NOT NULL,
  "user_agent" text NOT NULL,
  "attendance_policy_ack" boolean DEFAULT false,
  "dress_code_ack" boolean DEFAULT false,
  "conduct_policy_ack" boolean DEFAULT false,
  "safety_policy_ack" boolean DEFAULT false,
  "grievance_policy_ack" boolean DEFAULT false,
  "full_acknowledgment" boolean DEFAULT true NOT NULL,
  "acknowledgment_statement" text DEFAULT 'I have read and understand the Student Handbook.'::text NOT NULL,
  "is_immutable" boolean DEFAULT true NOT NULL,
  CONSTRAINT "handbook_acknowledgments_pkey" PRIMARY KEY (id),
  CONSTRAINT "handbook_acknowledgments_user_id_handbook_version_key" UNIQUE (user_id, handbook_version)
);

CREATE TABLE public.host_shop_match_requests (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "apprentice_id" uuid NOT NULL,
  "apprentice_name" text,
  "apprentice_email" text,
  "apprentice_phone" text,
  "host_shop_id" uuid NOT NULL,
  "program_slug" text DEFAULT 'barber-apprenticeship'::text NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "message" text,
  "apprentice_notes" text,
  "shop_notes" text,
  "responded_at" timestamp with time zone,
  "responded_by" uuid,
  "placement_id" uuid,
  "expires_at" timestamp with time zone DEFAULT (now() + '30 days'::interval),
  "admin_override" boolean DEFAULT false,
  "admin_notes" text,
  "notified_shop_at" timestamp with time zone,
  "notified_apprentice_at" timestamp with time zone,
  "deleted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "host_shop_match_requests_pkey" PRIMARY KEY (id),
  CONSTRAINT "host_shop_match_requests_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'declined'::text, 'withdrawn'::text, 'expired'::text, 'placed'::text]))
);

CREATE TABLE public.host_shop_practical_service_entries (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "enrollment_id" uuid NOT NULL,
  "placement_id" uuid NOT NULL,
  "shop_id" uuid NOT NULL,
  "student_id" uuid NOT NULL,
  "competency_id" text,
  "service_name" text NOT NULL,
  "performed_on" date NOT NULL,
  "subject_type" text NOT NULL,
  "mentor_user_id" uuid NOT NULL,
  "mentor_notes" text,
  "verified_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "voided_at" timestamp with time zone,
  "void_reason" text,
  CONSTRAINT "host_shop_practical_service_entries_pkey" PRIMARY KEY (id),
  CONSTRAINT "host_shop_practical_service_entries_subject_type_check" CHECK (subject_type = ANY (ARRAY['patron'::text, 'mannequin'::text, 'student'::text]))
);

CREATE TABLE public.license_agreement_acceptances (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "organization_id" uuid,
  "role_at_signing" text NOT NULL,
  "agreement_type" agreement_type NOT NULL,
  "document_version" text NOT NULL,
  "signer_name" text NOT NULL,
  "signer_email" text NOT NULL,
  "signature_method" text DEFAULT 'checkbox'::text NOT NULL,
  "signature_data" text,
  "accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
  "ip_address" inet,
  "user_agent" text,
  "legal_acknowledgment" boolean DEFAULT true NOT NULL,
  "auth_email" text,
  "signature_typed" text,
  "acceptance_context" text,
  "tenant_id" uuid,
  "program_id" uuid,
  "is_immutable" boolean DEFAULT true NOT NULL,
  "document_url" text,
  "email_at_signing" text,
  CONSTRAINT "license_agreement_acceptances_pkey" PRIMARY KEY (id),
  CONSTRAINT "license_agreement_acceptances_role_at_signing_check" CHECK (role_at_signing = ANY (ARRAY['student'::text, 'program_holder'::text, 'employer'::text, 'staff'::text, 'admin'::text, 'workforce'::text])),
  CONSTRAINT "unique_agreement_per_version" UNIQUE (user_id, agreement_type, document_version)
);

CREATE TABLE public.program_completion_certificates (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "program_id" uuid,
  "course_id" uuid,
  "enrollment_id" uuid,
  "certificate_number" text NOT NULL,
  "completion_date" date NOT NULL,
  "verification_url" text,
  "checkpoints_passed" integer DEFAULT 0 NOT NULL,
  "total_checkpoints" integer DEFAULT 0 NOT NULL,
  "issued_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "funding_status" text DEFAULT 'funded'::text NOT NULL,
  "funding_status_changed_at" timestamp with time zone,
  "funding_status_reason" text,
  "hours_completed" numeric,
  "competencies_achieved" jsonb DEFAULT '[]'::jsonb,
  "instructor_verified" boolean DEFAULT false NOT NULL,
  "verification_summary" jsonb DEFAULT '{}'::jsonb,
  "exam_ready" boolean DEFAULT false NOT NULL,
  "avg_checkpoint_score" numeric(5,2),
  "competency_domains" text[],
  "certificate_title" text DEFAULT 'Certificate of Completion'::text NOT NULL,
  "certificate_subtitle" text,
  "issued_by" text,
  CONSTRAINT "program_completion_certificates_certificate_number_key" UNIQUE (certificate_number),
  CONSTRAINT "program_completion_certificates_pkey" PRIMARY KEY (id),
  CONSTRAINT "program_completion_certificates_user_program_key" UNIQUE (user_id, program_id)
);

CREATE TABLE public.rapids_employer_wage_schedules (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "partner_id" uuid NOT NULL,
  "sponsor_registration_number" text NOT NULL,
  "standard_key" text NOT NULL,
  "occupation_code" text NOT NULL,
  "schedule_name" text NOT NULL,
  "schedule_version" text,
  "journeyworker_hourly_rate" numeric(10,2),
  "starting_hourly_rate" numeric(10,2) NOT NULL,
  "ending_hourly_rate" numeric(10,2) NOT NULL,
  "effective_from" date,
  "effective_to" date,
  "is_active" boolean DEFAULT true NOT NULL,
  "source_system" text DEFAULT 'RAPIDS 2.0'::text NOT NULL,
  "source_verified_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "rapids_employer_wage_schedule_partner_id_occupation_code_sc_key" UNIQUE (partner_id, occupation_code, schedule_name, schedule_version),
  CONSTRAINT "rapids_employer_wage_schedules_pkey" PRIMARY KEY (id)
);

CREATE TABLE public.rapids_rti_providers (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "sponsor_registration_number" text NOT NULL,
  "standard_key" text NOT NULL,
  "occupation_code" text,
  "provider_name" text NOT NULL,
  "partner_id" uuid,
  "provider_user_id" uuid,
  "status" text DEFAULT 'active'::text NOT NULL,
  "added_at" timestamp with time zone,
  "disabled_at" timestamp with time zone,
  "source_system" text DEFAULT 'RAPIDS 2.0'::text NOT NULL,
  "source_verified_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "rapids_rti_providers_pkey" PRIMARY KEY (id)
);

ALTER TABLE public.apprentice_placements
  ADD CONSTRAINT "apprentice_placements_match_request_id_fkey" FOREIGN KEY (match_request_id) REFERENCES host_shop_match_requests(id);
ALTER TABLE public.apprentice_placements
  ADD CONSTRAINT "apprentice_placements_shop_id_fkey" FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE RESTRICT;
ALTER TABLE public.apprentice_placements
  ADD CONSTRAINT "apprentice_placements_student_id_fkey" FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.apprentice_placements
  ADD CONSTRAINT "apprentice_placements_supervisor_user_id_fkey" FOREIGN KEY (supervisor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.apprentice_placements
  ADD CONSTRAINT "apprentice_placements_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE public.apprenticeship_practical_service_requirements
  ADD CONSTRAINT "apprenticeship_practical_service_requirements_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE public.apprenticeship_practical_service_requirements
  ADD CONSTRAINT "apprenticeship_practical_service_requirements_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE;
ALTER TABLE public.apprenticeship_rti_entries
  ADD CONSTRAINT "apprenticeship_rti_entries_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE public.apprenticeship_rti_entries
  ADD CONSTRAINT "apprenticeship_rti_entries_enrollment_id_fkey" FOREIGN KEY (enrollment_id) REFERENCES program_enrollments(id) ON DELETE CASCADE;
ALTER TABLE public.apprenticeship_rti_entries
  ADD CONSTRAINT "apprenticeship_rti_entries_instructor_user_id_fkey" FOREIGN KEY (instructor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.apprenticeship_rti_entries
  ADD CONSTRAINT "apprenticeship_rti_entries_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE SET NULL;
ALTER TABLE public.apprenticeship_rti_entries
  ADD CONSTRAINT "apprenticeship_rti_entries_requirement_id_fkey" FOREIGN KEY (requirement_id) REFERENCES apprenticeship_rti_requirements(id);
ALTER TABLE public.apprenticeship_rti_entries
  ADD CONSTRAINT "apprenticeship_rti_entries_standard_key_fkey" FOREIGN KEY (standard_key) REFERENCES apprenticeship_standard_versions(standard_key);
ALTER TABLE public.apprenticeship_rti_entries
  ADD CONSTRAINT "apprenticeship_rti_entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.apprenticeship_rti_entries
  ADD CONSTRAINT "apprenticeship_rti_entries_verified_by_fkey" FOREIGN KEY (verified_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.apprenticeship_rti_requirements
  ADD CONSTRAINT "apprenticeship_rti_requirements_standard_key_fkey" FOREIGN KEY (standard_key) REFERENCES apprenticeship_standard_versions(standard_key) ON DELETE CASCADE;
ALTER TABLE public.apprenticeship_theory_schedules
  ADD CONSTRAINT "apprenticeship_theory_schedules_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE public.apprenticeship_theory_schedules
  ADD CONSTRAINT "apprenticeship_theory_schedules_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.apprenticeship_theory_schedules
  ADD CONSTRAINT "apprenticeship_theory_schedules_partner_id_fkey" FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE;
ALTER TABLE public.apprenticeship_theory_schedules
  ADD CONSTRAINT "apprenticeship_theory_schedules_placement_id_fkey" FOREIGN KEY (placement_id) REFERENCES apprentice_placements(id) ON DELETE CASCADE;
ALTER TABLE public.apprenticeship_theory_schedules
  ADD CONSTRAINT "apprenticeship_theory_schedules_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.billing_migration_authorizations
  ADD CONSTRAINT "billing_migration_authorizations_billing_schedule_id_fkey" FOREIGN KEY (billing_schedule_id) REFERENCES billing_schedules(id) ON DELETE SET NULL;
ALTER TABLE public.billing_migration_authorizations
  ADD CONSTRAINT "billing_migration_authorizations_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.billing_migration_authorizations
  ADD CONSTRAINT "billing_migration_authorizations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.digital_binders
  ADD CONSTRAINT "digital_binders_enrollment_id_fkey" FOREIGN KEY (enrollment_id) REFERENCES program_enrollments(id) ON DELETE SET NULL;
ALTER TABLE public.digital_binders
  ADD CONSTRAINT "digital_binders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.handbook_acknowledgments
  ADD CONSTRAINT "handbook_acknowledgments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.host_shop_match_requests
  ADD CONSTRAINT "host_shop_match_requests_apprentice_id_fkey" FOREIGN KEY (apprentice_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.host_shop_match_requests
  ADD CONSTRAINT "host_shop_match_requests_host_shop_id_fkey" FOREIGN KEY (host_shop_id) REFERENCES host_shops(id) ON DELETE CASCADE;
ALTER TABLE public.host_shop_match_requests
  ADD CONSTRAINT "host_shop_match_requests_placement_id_fkey" FOREIGN KEY (placement_id) REFERENCES apprentice_placements(id);
ALTER TABLE public.host_shop_match_requests
  ADD CONSTRAINT "host_shop_match_requests_responded_by_fkey" FOREIGN KEY (responded_by) REFERENCES profiles(id);
ALTER TABLE public.host_shop_practical_service_entries
  ADD CONSTRAINT "host_shop_practical_service_entries_enrollment_id_fkey" FOREIGN KEY (enrollment_id) REFERENCES program_enrollments(id);
ALTER TABLE public.host_shop_practical_service_entries
  ADD CONSTRAINT "host_shop_practical_service_entries_placement_id_fkey" FOREIGN KEY (placement_id) REFERENCES apprentice_placements(id);
ALTER TABLE public.license_agreement_acceptances
  ADD CONSTRAINT "license_agreement_acceptances_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.program_completion_certificates
  ADD CONSTRAINT "program_completion_certificates_program_id_fkey" FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;
ALTER TABLE public.program_completion_certificates
  ADD CONSTRAINT "program_completion_certificates_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.rapids_employer_wage_schedules
  ADD CONSTRAINT "rapids_employer_wage_schedules_partner_id_fkey" FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE;
ALTER TABLE public.rapids_rti_providers
  ADD CONSTRAINT "rapids_rti_providers_partner_id_fkey" FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL;
ALTER TABLE public.rapids_rti_providers
  ADD CONSTRAINT "rapids_rti_providers_provider_user_id_fkey" FOREIGN KEY (provider_user_id) REFERENCES profiles(id) ON DELETE SET NULL;

DO $security$
DECLARE
  relation_name text;
BEGIN
  FOREACH relation_name IN ARRAY ARRAY[
      'agreement_acceptances',
      'apprentice_document_types',
      'apprentice_placements',
      'apprenticeship_practical_service_requirements',
      'apprenticeship_rti_entries',
      'apprenticeship_rti_requirements',
      'apprenticeship_standard_versions',
      'apprenticeship_theory_schedules',
      'billing_migration_authorizations',
      'billing_schedules',
      'digital_binders',
      'handbook_acknowledgments',
      'host_shop_match_requests',
      'host_shop_practical_service_entries',
      'license_agreement_acceptances',
      'program_completion_certificates',
      'rapids_employer_wage_schedules',
      'rapids_rti_providers'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', relation_name);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', relation_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO service_role', relation_name);
  END LOOP;
END;
$security$;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS file_size integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS file_size_bytes integer,
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending';

CREATE VIEW public.host_shop_practical_service_progress WITH (security_invoker = true) AS
SELECT enrollment_id, student_id, service_name, count(*)::integer as recorded_count,
       max(verified_at) AS last_verified_at
FROM public.host_shop_practical_service_entries
WHERE voided_at IS NULL AND verified_at IS NOT NULL
GROUP BY enrollment_id, student_id, service_name;

CREATE VIEW public.admin_audit_events WITH (security_invoker = true) AS
 SELECT id,
    action,
    actor_id AS actor_user_id,
    actor_id,
    actor_role,
    target_type,
    target_id,
    metadata,
    ip_address,
    created_at,
    entity_type,
    entity_id,
    old_data,
    new_data
   FROM audit_logs;
REVOKE ALL ON public.host_shop_practical_service_progress, public.admin_audit_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.host_shop_practical_service_progress TO service_role;
GRANT SELECT, INSERT ON public.admin_audit_events TO service_role;

CREATE OR REPLACE FUNCTION public.set_audit_context(actor_user_id text DEFAULT NULL::text, system_actor text DEFAULT NULL::text, request_id text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  IF actor_user_id IS NOT NULL THEN
    PERFORM set_config('app.actor_user_id', actor_user_id, true);
  END IF;
  IF system_actor IS NOT NULL THEN
    PERFORM set_config('app.system_actor', system_actor, true);
  END IF;
  IF request_id IS NOT NULL THEN
    PERFORM set_config('app.request_id', request_id, true);
  END IF;
END;
$function$;
REVOKE ALL ON FUNCTION public.set_audit_context(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_audit_context(text, text, text) TO service_role;

INSERT INTO public.apprenticeship_standard_versions ("approach", "is_active", "rapids_code", "program_slug", "sponsor_name", "standard_key", "onet_soc_code", "revision_date", "competency_count", "occupation_title", "source_authority", "registration_date", "probationary_hours", "registration_number", "related_instruction_hours", "apprentice_to_mentor_ratio")
SELECT "approach", "is_active", "rapids_code", "program_slug", "sponsor_name", "standard_key", "onet_soc_code", "revision_date", "competency_count", "occupation_title", "source_authority", "registration_date", "probationary_hours", "registration_number", "related_instruction_hours", "apprentice_to_mentor_ratio"
FROM jsonb_populate_recordset(NULL::public.apprenticeship_standard_versions, '[{"approach":"competency_based","is_active":true,"rapids_code":"0030CB","program_slug":"barber-apprenticeship","sponsor_name":"2 Exclusive LLC-S","standard_key":"barber-0030cb-2025-07-10","onet_soc_code":"39-5011.00","revision_date":"2025-07-10","competency_count":14,"occupation_title":"Barber","source_authority":"U.S. DOL signed approval 2025-07-10; DOL Gmail message 19857620e2ca201c (2025-07-29); PDF SHA256 66fb85fb01aa92fae959e32840f48319ac1b4f59853962b66b887b3968497c34; source index docs/apprenticeship/REGISTERED_APPENDIX_SOURCE_INDEX.md","registration_date":"2025-01-14","probationary_hours":500,"registration_number":"2025-IN-132301","related_instruction_hours":260,"apprentice_to_mentor_ratio":"1:1"}]'::jsonb);

INSERT INTO public.apprentice_document_types ("name", "title", "user_id", "file_url", "updated_at", "description", "is_required", "program_slug", "display_order", "document_type", "accepted_formats", "max_file_size_mb")
SELECT "name", "title", "user_id", "file_url", "updated_at", "description", "is_required", "program_slug", "display_order", "document_type", "accepted_formats", "max_file_size_mb"
FROM jsonb_populate_recordset(NULL::public.apprentice_document_types, '[{"name":"Government-Issued Photo ID","title":null,"user_id":null,"file_url":null,"updated_at":"2026-05-01T22:21:00.28887+00:00","description":"Valid driver''s license, state ID, or passport. Must show full name, date of birth, and photo. Expired IDs not accepted.","is_required":true,"program_slug":"barber-apprenticeship","display_order":1,"document_type":"government_id","accepted_formats":["pdf","jpg","jpeg","png"],"max_file_size_mb":10},{"name":"Social Security Card or ITIN Letter","title":null,"user_id":null,"file_url":null,"updated_at":"2026-05-01T22:21:00.28887+00:00","description":"Original SSN card or IRS ITIN assignment letter (CP-565). Required for DOL RAPIDS registration. ITIN accepted in place of SSN.","is_required":true,"program_slug":"barber-apprenticeship","display_order":2,"document_type":"social_security_card","accepted_formats":["pdf","jpg","jpeg","png"],"max_file_size_mb":10},{"name":"Proof of Age (18+)","title":null,"user_id":null,"file_url":null,"updated_at":"2026-05-01T22:21:00.28887+00:00","description":"Birth certificate, passport, or government ID showing date of birth. Must be 18 or older to enroll.","is_required":true,"program_slug":"barber-apprenticeship","display_order":3,"document_type":"proof_of_age","accepted_formats":["pdf","jpg","jpeg","png"],"max_file_size_mb":10},{"name":"Signed Apprenticeship Agreement","title":null,"user_id":null,"file_url":null,"updated_at":"2026-05-01T22:21:00.28887+00:00","description":"Fully executed apprenticeship agreement signed by apprentice, employer, and Elevate for Humanity. All three signatures required.","is_required":false,"program_slug":"barber-apprenticeship","display_order":4,"document_type":"apprenticeship_agreement","accepted_formats":["pdf"],"max_file_size_mb":20},{"name":"Employer Verification / Offer Letter","title":null,"user_id":null,"file_url":null,"updated_at":"2026-05-01T22:21:00.28887+00:00","description":"Letter from host barbershop confirming employment, wage rate, and start date. Must be on shop letterhead and signed by owner.","is_required":false,"program_slug":"barber-apprenticeship","display_order":5,"document_type":"employer_verification","accepted_formats":["pdf","jpg","jpeg","png"],"max_file_size_mb":10},{"name":"Proof of Residence","title":null,"user_id":null,"file_url":null,"updated_at":"2026-05-01T22:21:00.28887+00:00","description":"Utility bill, bank statement, or lease agreement dated within 60 days. Must show your name and current address.","is_required":true,"program_slug":"barber-apprenticeship","display_order":6,"document_type":"proof_of_address","accepted_formats":["pdf","jpg","jpeg","png"],"max_file_size_mb":10},{"name":"High School Diploma or GED","title":null,"user_id":null,"file_url":null,"updated_at":"2026-05-01T22:21:00.28887+00:00","description":"Copy of diploma, GED certificate, or official transcript showing graduation. Required for Indiana PLA barber license eligibility.","is_required":true,"program_slug":"barber-apprenticeship","display_order":7,"document_type":"high_school_diploma","accepted_formats":["pdf","jpg","jpeg","png"],"max_file_size_mb":10},{"name":"Transfer Hours Documentation (if applicable)","title":null,"user_id":null,"file_url":null,"updated_at":"2026-05-01T22:21:00.28887+00:00","description":"Official transcript or letter from prior barber school or apprenticeship program documenting hours completed. Only required if claiming transfer hours.","is_required":false,"program_slug":"barber-apprenticeship","display_order":8,"document_type":"transfer_hours_documentation","accepted_formats":["pdf","jpg","jpeg","png"],"max_file_size_mb":20},{"name":"ITIN Documentation (if no SSN)","title":null,"user_id":null,"file_url":null,"updated_at":"2026-05-01T22:21:00.28887+00:00","description":"IRS CP-565 ITIN assignment letter. Required only if you do not have a Social Security Number.","is_required":false,"program_slug":"barber-apprenticeship","display_order":9,"document_type":"itin_documentation","accepted_formats":["pdf","jpg","jpeg","png"],"max_file_size_mb":10}]'::jsonb);

NOTIFY pgrst, 'reload schema';
COMMIT;
