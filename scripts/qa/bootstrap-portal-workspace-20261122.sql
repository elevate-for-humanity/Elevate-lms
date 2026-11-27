-- Stage production schema contracts needed by the isolated portal browser suite.
-- This migration creates empty relations. Existing rows and production remain untouched.

BEGIN;
SET LOCAL search_path = public, pg_catalog;

DO $qa$
DECLARE
  relation_name text;
BEGIN
  IF to_regclass('private.qa_environment_identity') IS NULL THEN
    RAISE EXCEPTION 'Portal schema stage requires the isolated QA identity';
  END IF;
  IF (SELECT array_agg(project_ref) FROM private.qa_environment_identity)
       IS DISTINCT FROM ARRAY['isdgjcdabhxxozarmxta']::text[] THEN
    RAISE EXCEPTION 'Portal schema stage refused outside isolated QA';
  END IF;
  FOREACH relation_name IN ARRAY ARRAY[
      'apprentice_competency_records',
      'apprentice_sites',
      'apprentices',
      'barber_subscriptions',
      'communication_extensions',
      'communication_workspaces',
      'credential_providers',
      'credential_registry',
      'hour_entries',
      'instructor_assignments',
      'notification_preferences',
      'phone_destinations',
      'phone_numbers',
      'phone_systems',
      'program_courses',
      'program_holder_courses',
      'program_holder_payouts',
      'program_holder_reports',
      'progress_entries',
      'referrals',
      'student_credential_uploads',
      'system_settings',
      'team_members',
      'training_courses'
  ] LOOP
    IF to_regclass(format('public.%I', relation_name)) IS NOT NULL THEN
      RAISE EXCEPTION 'Portal schema preflight found an existing relation: %', relation_name;
    END IF;
  END LOOP;
END;
$qa$;

CREATE TABLE public.apprentice_competency_records (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "enrollment_id" uuid NOT NULL,
  "competency_id" text NOT NULL,
  "completed" boolean DEFAULT false,
  "date_completed" date,
  "verified_by" uuid,
  "verified_by_name" text,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "requires_practical_evidence" boolean DEFAULT false NOT NULL,
  "performance_subject" text,
  "evidence_type" text,
  "evidence_url" text,
  "practical_performed_at" date,
  "evidence_review_status" text DEFAULT 'not_required'::text NOT NULL,
  "verified_by_license_number" text,
  "state_authority" text,
  "state_standard_version" text,
  "state_requirement_citation" text,
  "evidence_verified_at" timestamp with time zone,
  CONSTRAINT "apprentice_competency_records_enrollment_id_competency_id_key" UNIQUE (enrollment_id, competency_id),
  CONSTRAINT "apprentice_competency_records_evidence_review_status_check" CHECK (evidence_review_status = ANY (ARRAY['not_required'::text, 'submitted'::text, 'approved'::text, 'rejected'::text])),
  CONSTRAINT "apprentice_competency_records_evidence_type_check" CHECK (evidence_type = ANY (ARRAY['photo'::text, 'video'::text, 'checklist'::text, 'observation'::text, 'document'::text])),
  CONSTRAINT "apprentice_competency_records_performance_subject_check" CHECK (performance_subject = ANY (ARRAY['student'::text, 'patron'::text, 'mannequin'::text])),
  CONSTRAINT "apprentice_competency_records_pkey" PRIMARY KEY (id)
);

CREATE TABLE public.apprentice_sites (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "latitude" numeric NOT NULL,
  "longitude" numeric NOT NULL,
  "radius_meters" integer DEFAULT 100 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "shop_id" uuid,
  "partner_id" uuid,
  "center_lat" numeric(10,7),
  "center_lng" numeric(10,7),
  "radius_m" integer,
  CONSTRAINT "apprentice_sites_pkey" PRIMARY KEY (id)
);

CREATE TABLE public.apprentices (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "referral_id" uuid,
  "employer_id" uuid,
  "rapids_id" text,
  "start_date" date,
  "status" text DEFAULT 'pending'::text,
  "created_at" timestamp with time zone DEFAULT now(),
  "user_id" uuid,
  "barber_subscription_id" uuid,
  "mou_signed_at" timestamp with time zone,
  "dashboard_invite_sent_at" timestamp with time zone,
  "program_id" uuid,
  "shop_id" uuid,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "application_id" uuid,
  "competencies_completed" boolean,
  "competencies_required" boolean,
  "enrollment_date" date,
  "enrollment_id" uuid,
  "host_shop_id" uuid,
  "hours_completed" numeric,
  "ojl_hours" numeric,
  "ojl_hours_required" boolean,
  "program_name" text,
  "rti_hours" numeric,
  "rti_hours_required" boolean,
  "total_hours_required" text,
  "transfer_hours_credited" text,
  CONSTRAINT "apprentices_pkey" PRIMARY KEY (id),
  CONSTRAINT "apprentices_user_id_key" UNIQUE (user_id)
);

CREATE TABLE public.barber_subscriptions (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "enrollment_id" uuid,
  "apprentice_id" uuid,
  "stripe_subscription_id" text,
  "stripe_customer_id" text,
  "stripe_checkout_session_id" text,
  "customer_email" text,
  "customer_name" text,
  "status" text DEFAULT 'active'::text,
  "setup_fee_paid" boolean DEFAULT false,
  "setup_fee_amount" integer,
  "weekly_payment_cents" integer,
  "weeks_remaining" integer,
  "hours_per_week" integer DEFAULT 40,
  "transferred_hours_verified" integer DEFAULT 0,
  "billing_cycle_anchor" timestamp with time zone,
  "current_period_start" timestamp with time zone,
  "current_period_end" timestamp with time zone,
  "welcome_email_sent_at" timestamp with time zone,
  "milady_email_sent_at" timestamp with time zone,
  "dashboard_invite_sent_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "customer_phone" text,
  "full_tuition_amount" numeric,
  "amount_paid_at_checkout" numeric,
  "remaining_balance" numeric,
  "payment_method" text,
  "bnpl_provider" text,
  "fully_paid" boolean DEFAULT false NOT NULL,
  "payment_model" text,
  "canceled_at" timestamp with time zone,
  "last_payment_date" timestamp with time zone,
  "hours_remaining" integer,
  "affirm_charge_id" text,
  "deactivated_at" timestamp with time zone,
  "deactivation_reason" text,
  "payment_status" text DEFAULT 'active'::text NOT NULL,
  "failed_payment_at" timestamp with time zone,
  "suspension_deadline" timestamp with time zone,
  "suspended_at" timestamp with time zone,
  "suspension_reason" text,
  "provider_subscription_id" text,
  "provider_customer_id" text,
  "provider_checkout_session_id" text,
  "billing_exception_until" timestamp with time zone,
  "billing_exception_reason" text,
  CONSTRAINT "barber_subscriptions_payment_status_check" CHECK (payment_status = ANY (ARRAY['active'::text, 'past_due'::text, 'suspended'::text, 'cancelled'::text, 'paid_in_full'::text])),
  CONSTRAINT "barber_subscriptions_pkey" PRIMARY KEY (id),
  CONSTRAINT "barber_subscriptions_stripe_subscription_id_key" UNIQUE (stripe_subscription_id)
);

CREATE TABLE public.communication_extensions (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL,
  "profile_id" uuid,
  "destination_id" uuid,
  "extension" text NOT NULL,
  "display_name" text NOT NULL,
  "department" text,
  "presence_status" text DEFAULT 'offline'::text NOT NULL,
  "can_host_meetings" boolean DEFAULT true NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "ring_mode" text DEFAULT 'ring'::text NOT NULL,
  "availability_source" text DEFAULT 'manual'::text NOT NULL,
  "availability_schedule" jsonb DEFAULT '{"fri": ["09:00", "17:00"], "mon": ["09:00", "17:00"], "thu": ["09:00", "17:00"], "tue": ["09:00", "17:00"], "wed": ["09:00", "17:00"]}'::jsonb NOT NULL,
  "ring_seconds" integer DEFAULT 20 NOT NULL,
  "voicemail_greeting" text,
  "paris_overflow_enabled" boolean DEFAULT true NOT NULL,
  "last_presence_at" timestamp with time zone,
  "admin_external_fallback" boolean DEFAULT false NOT NULL,
  "external_fallback_number" text,
  "webrtc_provider" text DEFAULT 'asterisk'::text NOT NULL,
  CONSTRAINT "communication_extensions_availability_source_check" CHECK (availability_source = ANY (ARRAY['manual'::text, 'schedule'::text])),
  CONSTRAINT "communication_extensions_pkey" PRIMARY KEY (id),
  CONSTRAINT "communication_extensions_presence_status_check" CHECK (presence_status = ANY (ARRAY['offline'::text, 'available'::text, 'busy'::text, 'do_not_disturb'::text])),
  CONSTRAINT "communication_extensions_ring_mode_check" CHECK (ring_mode = ANY (ARRAY['ring'::text, 'vibrate'::text, 'silent'::text, 'do_not_disturb'::text, 'offline'::text])),
  CONSTRAINT "communication_extensions_ring_seconds_check" CHECK (ring_seconds >= 5 AND ring_seconds <= 60),
  CONSTRAINT "communication_extensions_webrtc_provider_check" CHECK (webrtc_provider = ANY (ARRAY['telnyx'::text, 'asterisk'::text])),
  CONSTRAINT "communication_extensions_workspace_id_extension_key" UNIQUE (workspace_id, extension),
  CONSTRAINT "communication_extensions_workspace_id_profile_id_key" UNIQUE (workspace_id, profile_id)
);

CREATE TABLE public.communication_workspaces (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid,
  "phone_system_id" uuid,
  "name" text DEFAULT 'Communications'::text NOT NULL,
  "meeting_provider" text DEFAULT 'livekit'::text NOT NULL,
  "meeting_region" text,
  "recording_enabled" boolean DEFAULT false NOT NULL,
  "waiting_room_enabled" boolean DEFAULT true NOT NULL,
  "guests_allowed" boolean DEFAULT true NOT NULL,
  "status" text DEFAULT 'setup'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "communication_workspaces_meeting_provider_check" CHECK (meeting_provider = ANY (ARRAY['livekit'::text, 'external'::text])),
  CONSTRAINT "communication_workspaces_pkey" PRIMARY KEY (id),
  CONSTRAINT "communication_workspaces_status_check" CHECK (status = ANY (ARRAY['setup'::text, 'active'::text, 'paused'::text]))
);

CREATE TABLE public.credential_providers (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "provider_type" text NOT NULL,
  "exam_scheduling_url" text,
  "verification_api" text,
  "verification_adapter" text,
  "logo_url" text,
  "contact_email" text,
  "notes" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "credential_providers_pkey" PRIMARY KEY (id),
  CONSTRAINT "credential_providers_provider_type_check" CHECK (provider_type = ANY (ARRAY['federal_agency'::text, 'state_agency'::text, 'industry_body'::text, 'elevate'::text]))
);

CREATE TABLE public.credential_registry (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "abbreviation" text,
  "description" text,
  "issuer_type" text NOT NULL,
  "issuing_authority" text NOT NULL,
  "proctor_authority" text DEFAULT 'elevate'::text NOT NULL,
  "delivery" text DEFAULT 'internal'::text NOT NULL,
  "requires_exam" boolean DEFAULT false NOT NULL,
  "exam_type" text,
  "exam_location" text,
  "passing_score" integer,
  "verification_source" text DEFAULT 'elevate'::text NOT NULL,
  "verification_url" text,
  "renewal_period_months" integer,
  "national_registry_id" text,
  "cip_code" text,
  "soc_code" text,
  "wioa_eligible" boolean DEFAULT false,
  "dol_registered" boolean DEFAULT false,
  "credential_stack" text,
  "stack_level" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_by" uuid,
  "competency_area" text,
  "provider_id" uuid,
  CONSTRAINT "credential_registry_delivery_check" CHECK (delivery = ANY (ARRAY['internal'::text, 'external'::text, 'hybrid'::text])),
  CONSTRAINT "credential_registry_exam_location_check" CHECK (exam_location = ANY (ARRAY['on_site'::text, 'online'::text, 'testing_center'::text, 'partner_site'::text, NULL::text])),
  CONSTRAINT "credential_registry_exam_type_check" CHECK (exam_type = ANY (ARRAY['proctored'::text, 'vendor'::text, 'assessment'::text, 'portfolio'::text, 'none'::text, NULL::text])),
  CONSTRAINT "credential_registry_issuer_type_check" CHECK (issuer_type = ANY (ARRAY['elevate_issued'::text, 'elevate_proctored'::text, 'partner_delivered'::text])),
  CONSTRAINT "credential_registry_pkey" PRIMARY KEY (id),
  CONSTRAINT "credential_registry_proctor_authority_check" CHECK (proctor_authority = ANY (ARRAY['elevate'::text, 'partner'::text, 'external_vendor'::text, 'none'::text])),
  CONSTRAINT "credential_registry_stack_level_check" CHECK (stack_level = ANY (ARRAY['foundational'::text, 'intermediate'::text, 'advanced'::text, NULL::text])),
  CONSTRAINT "credential_registry_verification_source_check" CHECK (verification_source = ANY (ARRAY['elevate'::text, 'issuer_api'::text, 'external_link'::text, 'open_badges'::text, 'credly'::text]))
);

CREATE TABLE public.hour_entries (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "apprentice_application_id" uuid,
  "host_shop_application_id" uuid,
  "source_type" text NOT NULL,
  "source_entity_name" text,
  "source_state" text,
  "source_document_url" text,
  "work_date" date,
  "hours_claimed" numeric(5,2) NOT NULL,
  "accepted_hours" numeric(5,2) DEFAULT 0,
  "category" text,
  "notes" text,
  "evaluation_required" boolean DEFAULT false,
  "evaluation_decision" text,
  "rule_set_id" text,
  "rule_hash" text,
  "evaluated_at" timestamp with time zone,
  "evaluated_by" text,
  "evaluation_notes" text,
  "entered_by_email" text NOT NULL,
  "entered_at" timestamp with time zone DEFAULT now() NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "approved_by" text,
  "approved_at" timestamp with time zone,
  "rejection_reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "hours" integer DEFAULT 0,
  "user_id" uuid,
  "program_slug" text,
  "legacy_source" text,
  "legacy_id" uuid,
  "approved_by_role" text,
  "submitted_by_partner" boolean DEFAULT false NOT NULL,
  "program_holder_id" uuid,
  "approval_status" text DEFAULT 'pending'::text NOT NULL,
  "approval_notes" text,
  "funding_phase" text,
  "progress_entry_id" uuid,
  "host_shop_id" uuid,
  "approved_by_user_id" uuid,
  CONSTRAINT "hour_entries_approval_status_check" CHECK (approval_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  CONSTRAINT "hour_entries_evaluation_decision_check" CHECK (evaluation_decision = ANY (ARRAY['accepted'::text, 'partially_accepted'::text, 'rejected'::text, 'requires_manual_review'::text])),
  CONSTRAINT "hour_entries_hours_claimed_check" CHECK (hours_claimed > 0::numeric),
  CONSTRAINT "hour_entries_pkey" PRIMARY KEY (id),
  CONSTRAINT "hour_entries_source_type_check" CHECK (source_type = ANY (ARRAY['host_shop'::text, 'in_state_barber_school'::text, 'out_of_state_school'::text, 'out_of_state_license'::text, 'continuing_education'::text, 'rti'::text, 'ojl'::text, 'timeclock'::text, 'manual'::text])),
  CONSTRAINT "hour_entries_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'locked'::text])),
  CONSTRAINT "hour_entries_user_or_apprentice" CHECK (user_id IS NOT NULL OR apprentice_application_id IS NOT NULL),
  CONSTRAINT "uq_hour_entries_progress_entry_id" UNIQUE (progress_entry_id)
);

CREATE TABLE public.instructor_assignments (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "instructor_id" uuid,
  "course_id" uuid,
  "program_id" uuid,
  "cohort_id" uuid,
  "role" text DEFAULT 'instructor'::text,
  "assigned_at" timestamp with time zone DEFAULT now(),
  "assigned_by" uuid,
  "active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "instructor_assignments_pkey" PRIMARY KEY (id)
);

CREATE TABLE public.notification_preferences (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "email_course_updates" boolean DEFAULT true,
  "email_grades" boolean DEFAULT true,
  "email_deadlines" boolean DEFAULT true,
  "email_messages" boolean DEFAULT true,
  "email_newsletter" boolean DEFAULT true,
  "push_messages" boolean DEFAULT true,
  "push_reminders" boolean DEFAULT true,
  "push_announcements" boolean DEFAULT true,
  "sms_urgent" boolean DEFAULT false,
  "sms_reminders" boolean DEFAULT false,
  "sms_phone" text,
  "in_app_all" boolean DEFAULT true,
  "in_app_sound" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "push_enabled" boolean DEFAULT true,
  "opted_in_at" timestamp with time zone,
  "email_delivery_updates" boolean DEFAULT true NOT NULL,
  "sms_delivery_updates" boolean DEFAULT false NOT NULL,
  "paris_orientation_completed_at" timestamp with time zone,
  "email_missed_calls" boolean DEFAULT true NOT NULL,
  "sms_missed_calls" boolean DEFAULT false NOT NULL,
  CONSTRAINT "notification_preferences_pkey" PRIMARY KEY (id),
  CONSTRAINT "notification_preferences_user_id_key" UNIQUE (user_id)
);

CREATE TABLE public.phone_destinations (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "phone_system_id" uuid NOT NULL,
  "name" text NOT NULL,
  "destination_type" text DEFAULT 'phone'::text NOT NULL,
  "destination" text,
  "ring_seconds" integer DEFAULT 25 NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "department" text,
  "priority" smallint DEFAULT 0 NOT NULL,
  "simultaneous_group" text,
  "fallback_to_voicemail" boolean DEFAULT true NOT NULL,
  "extension_id" uuid,
  CONSTRAINT "phone_destinations_check" CHECK ((destination_type = ANY (ARRAY['voicemail'::text, 'paris'::text])) OR destination_type = 'webrtc'::text AND extension_id IS NOT NULL OR destination_type = 'phone'::text AND destination IS NOT NULL),
  CONSTRAINT "phone_destinations_destination_type_check" CHECK (destination_type = ANY (ARRAY['phone'::text, 'voicemail'::text, 'webrtc'::text, 'paris'::text])),
  CONSTRAINT "phone_destinations_pkey" PRIMARY KEY (id),
  CONSTRAINT "phone_destinations_ring_seconds_check" CHECK (ring_seconds >= 5 AND ring_seconds <= 120)
);

CREATE TABLE public.phone_numbers (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "phone_system_id" uuid NOT NULL,
  "e164" text NOT NULL,
  "label" text NOT NULL,
  "source" text DEFAULT 'provider'::text NOT NULL,
  "provider" text,
  "provider_number_id" text,
  "capabilities" jsonb DEFAULT '{"sms": false, "voice": true}'::jsonb NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "is_primary" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "assigned_profile_id" uuid,
  "extension" text,
  CONSTRAINT "phone_numbers_extension_format_check" CHECK (extension IS NULL OR extension ~ '^(0|[0-9]{2,6})$'::text),
  CONSTRAINT "phone_numbers_phone_system_id_e164_key" UNIQUE (phone_system_id, e164),
  CONSTRAINT "phone_numbers_pkey" PRIMARY KEY (id),
  CONSTRAINT "phone_numbers_source_check" CHECK (source = ANY (ARRAY['provider'::text, 'external_forwarding'::text])),
  CONSTRAINT "phone_numbers_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'released'::text, 'failed'::text]))
);

CREATE TABLE public.phone_systems (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid,
  "name" text DEFAULT 'Elevate Phone'::text NOT NULL,
  "timezone" text DEFAULT 'America/Indiana/Indianapolis'::text NOT NULL,
  "status" text DEFAULT 'setup'::text NOT NULL,
  "business_hours" jsonb DEFAULT '{"fri": ["09:00", "17:00"], "mon": ["09:00", "17:00"], "thu": ["09:00", "17:00"], "tue": ["09:00", "17:00"], "wed": ["09:00", "17:00"]}'::jsonb NOT NULL,
  "greeting" text DEFAULT 'Thank you for calling Elevate for Humanity.'::text NOT NULL,
  "after_hours_message" text DEFAULT 'Our office is currently closed. Please leave a message and we will return your call.'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "tenant_id" uuid,
  "routing_mode" text DEFAULT 'menu'::text NOT NULL,
  "default_destination_id" uuid,
  "voicemail_enabled" boolean DEFAULT true NOT NULL,
  "voicemail_transcription_enabled" boolean DEFAULT true NOT NULL,
  "call_recording_enabled" boolean DEFAULT false NOT NULL,
  "recording_disclosure" text,
  "max_queue_seconds" integer DEFAULT 90 NOT NULL,
  "ai_enabled" boolean DEFAULT false NOT NULL,
  "ai_name" text DEFAULT 'Elevate Assistant'::text NOT NULL,
  "ai_voice" text DEFAULT 'natural'::text NOT NULL,
  "ai_instructions" text DEFAULT 'Answer questions about Elevate for Humanity, collect caller information, and transfer to a person when requested or uncertain.'::text NOT NULL,
  "ai_language" text DEFAULT 'en-US'::text NOT NULL,
  "ai_allow_interruptions" boolean DEFAULT true NOT NULL,
  "ai_human_handoff_enabled" boolean DEFAULT true NOT NULL,
  "webrtc_connection_id" text,
  "webrtc_connection_status" text DEFAULT 'not_configured'::text NOT NULL,
  "admin_extension" text DEFAULT '100'::text NOT NULL,
  "admin_menu_digit" smallint DEFAULT 0 NOT NULL,
  "paris_intake_enabled" boolean DEFAULT true NOT NULL,
  CONSTRAINT "phone_systems_admin_menu_digit_check" CHECK (admin_menu_digit >= 0 AND admin_menu_digit <= 9),
  CONSTRAINT "phone_systems_max_queue_seconds_check" CHECK (max_queue_seconds >= 15 AND max_queue_seconds <= 600),
  CONSTRAINT "phone_systems_pkey" PRIMARY KEY (id),
  CONSTRAINT "phone_systems_routing_mode_check" CHECK (routing_mode = ANY (ARRAY['menu'::text, 'ai_receptionist'::text, 'direct_forward'::text])),
  CONSTRAINT "phone_systems_status_check" CHECK (status = ANY (ARRAY['setup'::text, 'active'::text, 'paused'::text])),
  CONSTRAINT "phone_systems_webrtc_connection_status_check" CHECK (webrtc_connection_status = ANY (ARRAY['not_configured'::text, 'configured'::text, 'failed'::text]))
);

CREATE TABLE public.program_courses (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "program_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "is_required" boolean DEFAULT true,
  "order_index" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "program_courses_pkey" PRIMARY KEY (id),
  CONSTRAINT "program_courses_program_id_course_id_key" UNIQUE (program_id, course_id)
);

CREATE TABLE public.program_holder_courses (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "program_holder_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "program_id" uuid,
  "custom_syllabus_path" text,
  "custom_syllabus_filename" text,
  "custom_syllabus_uploaded_at" timestamp with time zone,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "review_notes" text,
  "reviewed_by" uuid,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "term_name" text,
  "start_date" date,
  "end_date" date,
  "uses_custom_structure" boolean DEFAULT false NOT NULL,
  "delivery_structure_notes" text,
  "credential_alignment_status" text DEFAULT 'pending'::text NOT NULL,
  "credential_alignment_reviewed_at" timestamp with time zone,
  "credential_alignment_notes" text,
  "custom_syllabus_bucket" text,
  "credential_id" uuid NOT NULL,
  "term_start_date" date,
  "term_end_date" date,
  "cohort_label" text,
  "custom_syllabus_url" text,
  CONSTRAINT "chk_phc_dates" CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
  CONSTRAINT "chk_phc_status" CHECK (status = ANY (ARRAY['pending'::text, 'under_review'::text, 'approved'::text, 'rejected'::text])),
  CONSTRAINT "program_holder_courses_credential_alignment_status_check" CHECK (credential_alignment_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  CONSTRAINT "program_holder_courses_pkey" PRIMARY KEY (id),
  CONSTRAINT "program_holder_courses_program_holder_id_course_id_key" UNIQUE (program_holder_id, course_id)
);

CREATE TABLE public.program_holder_payouts (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "stripe_account_id" text,
  "stripe_account_type" text DEFAULT 'express'::text NOT NULL,
  "external_account_last4" text,
  "bank_name" text,
  "account_type" text,
  "payouts_enabled" boolean DEFAULT false NOT NULL,
  "charges_enabled" boolean DEFAULT false NOT NULL,
  "verification_status" text DEFAULT 'pending'::text NOT NULL,
  "verified_at" timestamp with time zone,
  "verified_by" uuid,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "transfers_enabled" boolean DEFAULT false NOT NULL,
  "payout_destination_type" text,
  "quickbooks_sync_status" text DEFAULT 'not_ready'::text NOT NULL,
  "last_stripe_sync_at" timestamp with time zone,
  "payout_provider" text,
  "provider_recipient_id" text,
  "paypal_recipient_email" text,
  "instant_payouts_enabled" boolean DEFAULT false NOT NULL,
  "last_provider_sync_at" timestamp with time zone,
  "provider_account_id" text,
  "provider_account_type" text,
  CONSTRAINT "program_holder_payouts_payout_provider_check" CHECK (payout_provider IS NULL OR (payout_provider = ANY (ARRAY['paypal'::text, 'branch'::text, 'quickbooks'::text]))),
  CONSTRAINT "program_holder_payouts_pkey" PRIMARY KEY (id),
  CONSTRAINT "unique_program_holder_stripe_account" UNIQUE (stripe_account_id)
);

CREATE TABLE public.program_holder_reports (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "program_holder_id" uuid NOT NULL,
  "user_id" uuid,
  "title" text NOT NULL,
  "report_type" text DEFAULT 'general'::text NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "content" text,
  "hours_worked" numeric(6,2),
  "period_start" date,
  "period_end" date,
  "submitted_at" timestamp with time zone,
  "reviewed_at" timestamp with time zone,
  "reviewed_by" uuid,
  "reviewer_notes" text,
  "attachments" jsonb DEFAULT '[]'::jsonb,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "program_holder_reports_pkey" PRIMARY KEY (id),
  CONSTRAINT "program_holder_reports_report_type_check" CHECK (report_type = ANY (ARRAY['general'::text, 'weekly'::text, 'monthly'::text, 'compliance'::text, 'financial'::text, 'incident'::text, 'student_progress'::text])),
  CONSTRAINT "program_holder_reports_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'submitted'::text, 'under_review'::text, 'approved'::text, 'rejected'::text]))
);

CREATE TABLE public.progress_entries (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "apprentice_id" uuid NOT NULL,
  "partner_id" uuid NOT NULL,
  "program_id" character varying(100) NOT NULL,
  "week_ending" date NOT NULL,
  "hours_worked" numeric(5,2) NOT NULL,
  "notes" text,
  "submitted_by" uuid NOT NULL,
  "status" character varying(20) DEFAULT 'submitted'::character varying,
  "created_at" timestamp with time zone DEFAULT now(),
  "tasks_completed" text,
  "submitted_at" timestamp with time zone,
  "verified_by" uuid,
  "verified_at" timestamp with time zone,
  "updated_at" timestamp with time zone,
  "max_hours_per_week" numeric DEFAULT 40,
  "work_date" date NOT NULL,
  "site_id" uuid,
  "clock_in_at" timestamp with time zone,
  "clock_out_at" timestamp with time zone,
  "lunch_start_at" timestamp with time zone,
  "lunch_end_at" timestamp with time zone,
  "break_minutes" integer,
  "clock_in_lat" numeric(9,6),
  "clock_in_lng" numeric(9,6),
  "clock_in_accuracy_m" integer,
  "clock_out_lat" numeric(9,6),
  "clock_out_lng" numeric(9,6),
  "clock_out_accuracy_m" integer,
  "last_seen_at" timestamp with time zone,
  "last_seen_lat" numeric(9,6),
  "last_seen_lng" numeric(9,6),
  "last_seen_accuracy_m" integer,
  "last_seen_within_geofence" boolean,
  "auto_clocked_out" boolean DEFAULT false NOT NULL,
  "auto_clock_out_reason" text,
  "outside_geofence_since" timestamp with time zone,
  "last_geofence_check_at" timestamp with time zone,
  "last_known_lat" numeric(10,7),
  "last_known_lng" numeric(10,7),
  "last_location_at" timestamp with time zone,
  "hour_entry_id" uuid,
  CONSTRAINT "progress_entries_hours_valid" CHECK (hours_worked >= 0::numeric AND hours_worked <= 40::numeric),
  CONSTRAINT "progress_entries_pkey" PRIMARY KEY (id),
  CONSTRAINT "progress_entries_status_check" CHECK (status::text = ANY (ARRAY['draft'::character varying::text, 'submitted'::character varying::text, 'verified'::character varying::text, 'disputed'::character varying::text]))
);

CREATE TABLE public.referrals (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "referrer_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "referred_user_id" uuid,
  "referral_code" character varying(50),
  "status" character varying(50) DEFAULT 'pending'::character varying,
  "reward_amount" numeric(10,2),
  "rewarded_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now(),
  "source" text,
  "program" text,
  "completed_at" timestamp with time zone,
  "referred_id" uuid,
  "reward_paid" boolean,
  CONSTRAINT "referrals_pkey" PRIMARY KEY (id)
);

CREATE TABLE public.student_credential_uploads (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "program_id" uuid NOT NULL,
  "credential_id" uuid,
  "upload_type" text NOT NULL,
  "storage_bucket" text DEFAULT 'credential-uploads'::text NOT NULL,
  "storage_path" text NOT NULL,
  "original_filename" text,
  "verification_status" text DEFAULT 'pending'::text NOT NULL,
  "verified_by" uuid,
  "verified_at" timestamp with time zone,
  "rejection_reason" text,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "credential_earned_date" date,
  CONSTRAINT "student_credential_uploads_pkey" PRIMARY KEY (id),
  CONSTRAINT "student_credential_uploads_upload_type_check" CHECK (upload_type = ANY (ARRAY['prerequisite'::text, 'exam_result'::text])),
  CONSTRAINT "student_credential_uploads_verification_status_check" CHECK (verification_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))
);

CREATE TABLE public.system_settings (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "key" text NOT NULL,
  "value" jsonb DEFAULT 'null'::jsonb NOT NULL,
  "updated_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "system_settings_key_key" UNIQUE (key),
  CONSTRAINT "system_settings_pkey" PRIMARY KEY (id)
);

CREATE TABLE public.team_members (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "title" text NOT NULL,
  "department" text,
  "bio" text,
  "image_url" text,
  "email" text,
  "phone" text,
  "linkedin_url" text,
  "display_order" integer DEFAULT 0,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "org_role" text,
  "headshot_url" text,
  CONSTRAINT "team_members_name_key" UNIQUE (name),
  CONSTRAINT "team_members_pkey" PRIMARY KEY (id)
);

CREATE TABLE public.training_courses (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "course_name" text NOT NULL,
  "course_code" text,
  "description" text,
  "duration_hours" integer,
  "price" numeric(10,2),
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "instructor_id" uuid,
  "program_id" uuid,
  "tenant_id" uuid,
  "category" text,
  "cert_valid_days" integer DEFAULT 0,
  "certification_body" text,
  "certification_name" text,
  "code" text,
  "cover_url" text,
  "delivery_mode" text,
  "difficulty" text,
  "enrolled_count" integer DEFAULT 0,
  "enrollment_count" integer DEFAULT 0,
  "external_version" text,
  "image_url" text,
  "is_published" boolean DEFAULT false,
  "last_synced_at" timestamp with time zone,
  "metadata" jsonb,
  "partner_id" uuid,
  "partner_url" text,
  "program_name" text,
  "rating" numeric(5,2),
  "slug" text,
  "status" text,
  "summary" text,
  "title" text,
  "subtitle" text,
  "skill_level" text DEFAULT 'beginner'::text,
  "thumbnail_url" text,
  "hero_image_url" text,
  "promo_video_url" text,
  "certificate_enabled" boolean DEFAULT false,
  "certificate_title" text,
  "certificate_template_id" uuid,
  "passing_score" integer DEFAULT 70,
  "published_at" timestamp with time zone,
  "archived_at" timestamp with time zone,
  "created_by" uuid,
  "updated_by" uuid,
  "credential_id" uuid,
  "default_syllabus_path" text,
  "default_syllabus_filename" text,
  "default_syllabus_bucket" text,
  "review_submitted_at" timestamp with time zone,
  "reviewed_by" uuid,
  "reviewed_at" timestamp with time zone,
  "review_notes" text,
  "review_status" text DEFAULT 'draft'::text NOT NULL,
  "review_rejected_reason" text,
  "review_rejected_at" timestamp with time zone,
  "review_approved_at" timestamp with time zone,
  "canonical_course_id" uuid,
  "default_syllabus_url" text,
  CONSTRAINT "chk_tc_rejection_complete" CHECK (status <> 'rejected'::text OR reviewed_at IS NOT NULL AND review_notes IS NOT NULL AND review_notes <> ''::text),
  CONSTRAINT "chk_tc_status_flag_consistency" CHECK (status IS NULL OR (status <> ALL (ARRAY['published'::text, 'pending_review'::text, 'draft'::text, 'rejected'::text])) OR status = 'published'::text AND is_published = true OR status = 'pending_review'::text AND (is_published = false OR is_published IS NULL) OR status = 'draft'::text AND (is_published = false OR is_published IS NULL) OR status = 'rejected'::text AND (is_published = false OR is_published IS NULL)),
  CONSTRAINT "chk_training_courses_status" CHECK (status IS NULL OR (status = ANY (ARRAY['draft'::text, 'pending_review'::text, 'published'::text, 'rejected'::text, 'active'::text, 'inactive'::text, 'archived'::text]))),
  CONSTRAINT "training_courses_course_code_key" UNIQUE (course_code),
  CONSTRAINT "training_courses_passing_score_check" CHECK (passing_score >= 0 AND passing_score <= 100),
  CONSTRAINT "training_courses_pkey" PRIMARY KEY (id),
  CONSTRAINT "training_courses_skill_level_check" CHECK (skill_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text]))
);

ALTER TABLE public.apprentice_competency_records
  ADD CONSTRAINT "apprentice_competency_records_enrollment_id_fkey" FOREIGN KEY (enrollment_id) REFERENCES program_enrollments(id) ON DELETE CASCADE;
ALTER TABLE public.apprentice_competency_records
  ADD CONSTRAINT "apprentice_competency_records_verified_by_fkey" FOREIGN KEY (verified_by) REFERENCES profiles(id);
ALTER TABLE public.apprentice_sites
  ADD CONSTRAINT "apprentice_sites_shop_id_fkey" FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE SET NULL;
ALTER TABLE public.apprentices
  ADD CONSTRAINT "apprentices_barber_subscription_id_fkey" FOREIGN KEY (barber_subscription_id) REFERENCES barber_subscriptions(id) ON DELETE SET NULL;
ALTER TABLE public.apprentices
  ADD CONSTRAINT "apprentices_employer_id_fkey" FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE SET NULL;
ALTER TABLE public.apprentices
  ADD CONSTRAINT "apprentices_enrollment_id_fkey" FOREIGN KEY (enrollment_id) REFERENCES program_enrollments(id) ON DELETE SET NULL;
ALTER TABLE public.apprentices
  ADD CONSTRAINT "apprentices_host_shop_id_fkey" FOREIGN KEY (host_shop_id) REFERENCES host_shops(id) ON DELETE SET NULL;
ALTER TABLE public.apprentices
  ADD CONSTRAINT "apprentices_program_id_fkey" FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;
ALTER TABLE public.apprentices
  ADD CONSTRAINT "apprentices_referral_id_fkey" FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE SET NULL;
ALTER TABLE public.apprentices
  ADD CONSTRAINT "apprentices_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.communication_extensions
  ADD CONSTRAINT "communication_extensions_destination_id_fkey" FOREIGN KEY (destination_id) REFERENCES phone_destinations(id) ON DELETE SET NULL;
ALTER TABLE public.communication_extensions
  ADD CONSTRAINT "communication_extensions_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.communication_extensions
  ADD CONSTRAINT "communication_extensions_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES communication_workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.communication_workspaces
  ADD CONSTRAINT "communication_workspaces_phone_system_id_fkey" FOREIGN KEY (phone_system_id) REFERENCES phone_systems(id) ON DELETE SET NULL;
ALTER TABLE public.credential_registry
  ADD CONSTRAINT "credential_registry_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.credential_registry
  ADD CONSTRAINT "credential_registry_provider_id_fkey" FOREIGN KEY (provider_id) REFERENCES credential_providers(id) ON DELETE SET NULL;
ALTER TABLE public.hour_entries
  ADD CONSTRAINT "hour_entries_approved_by_user_id_fkey" FOREIGN KEY (approved_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.hour_entries
  ADD CONSTRAINT "hour_entries_program_holder_id_fkey" FOREIGN KEY (program_holder_id) REFERENCES program_holders(id) ON DELETE SET NULL;
ALTER TABLE public.hour_entries
  ADD CONSTRAINT "hour_entries_progress_entry_id_fkey" FOREIGN KEY (progress_entry_id) REFERENCES progress_entries(id) ON DELETE SET NULL;
ALTER TABLE public.instructor_assignments
  ADD CONSTRAINT "instructor_assignments_assigned_by_fkey" FOREIGN KEY (assigned_by) REFERENCES profiles(id);
ALTER TABLE public.instructor_assignments
  ADD CONSTRAINT "instructor_assignments_instructor_id_fkey" FOREIGN KEY (instructor_id) REFERENCES profiles(id);
ALTER TABLE public.notification_preferences
  ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.phone_destinations
  ADD CONSTRAINT "phone_destinations_extension_id_fkey" FOREIGN KEY (extension_id) REFERENCES communication_extensions(id) ON DELETE SET NULL;
ALTER TABLE public.phone_destinations
  ADD CONSTRAINT "phone_destinations_phone_system_id_fkey" FOREIGN KEY (phone_system_id) REFERENCES phone_systems(id) ON DELETE CASCADE;
ALTER TABLE public.phone_numbers
  ADD CONSTRAINT "phone_numbers_assigned_profile_id_fkey" FOREIGN KEY (assigned_profile_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.phone_numbers
  ADD CONSTRAINT "phone_numbers_phone_system_id_fkey" FOREIGN KEY (phone_system_id) REFERENCES phone_systems(id) ON DELETE CASCADE;
ALTER TABLE public.phone_systems
  ADD CONSTRAINT "phone_systems_default_destination_fk" FOREIGN KEY (default_destination_id) REFERENCES phone_destinations(id) ON DELETE SET NULL;
ALTER TABLE public.program_holder_courses
  ADD CONSTRAINT "program_holder_courses_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE public.program_holder_courses
  ADD CONSTRAINT "program_holder_courses_credential_id_fkey" FOREIGN KEY (credential_id) REFERENCES credential_registry(id) ON DELETE SET NULL;
ALTER TABLE public.program_holder_courses
  ADD CONSTRAINT "program_holder_courses_program_holder_id_fkey" FOREIGN KEY (program_holder_id) REFERENCES program_holders(id) ON DELETE CASCADE;
ALTER TABLE public.program_holder_courses
  ADD CONSTRAINT "program_holder_courses_program_id_fkey" FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;
ALTER TABLE public.program_holder_courses
  ADD CONSTRAINT "program_holder_courses_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.program_holder_payouts
  ADD CONSTRAINT "program_holder_payouts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.program_holder_payouts
  ADD CONSTRAINT "program_holder_payouts_verified_by_fkey" FOREIGN KEY (verified_by) REFERENCES auth.users(id);
ALTER TABLE public.program_holder_reports
  ADD CONSTRAINT "program_holder_reports_program_holder_id_fkey" FOREIGN KEY (program_holder_id) REFERENCES program_holders(id) ON DELETE CASCADE;
ALTER TABLE public.program_holder_reports
  ADD CONSTRAINT "program_holder_reports_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.program_holder_reports
  ADD CONSTRAINT "program_holder_reports_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.progress_entries
  ADD CONSTRAINT "progress_entries_hour_entry_id_fkey" FOREIGN KEY (hour_entry_id) REFERENCES hour_entries(id) ON DELETE SET NULL;
ALTER TABLE public.progress_entries
  ADD CONSTRAINT "progress_entries_site_id_fkey" FOREIGN KEY (site_id) REFERENCES apprentice_sites(id) ON DELETE SET NULL;
ALTER TABLE public.progress_entries
  ADD CONSTRAINT "progress_entries_status_allowed" CHECK (status::text = ANY (ARRAY['draft'::character varying::text, 'submitted'::character varying::text, 'verified'::character varying::text, 'disputed'::character varying::text, 'approved'::character varying::text])) NOT VALID;
ALTER TABLE public.student_credential_uploads
  ADD CONSTRAINT "student_credential_uploads_credential_id_fkey" FOREIGN KEY (credential_id) REFERENCES credential_registry(id);
ALTER TABLE public.student_credential_uploads
  ADD CONSTRAINT "student_credential_uploads_program_id_fkey" FOREIGN KEY (program_id) REFERENCES programs(id);
ALTER TABLE public.student_credential_uploads
  ADD CONSTRAINT "student_credential_uploads_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.student_credential_uploads
  ADD CONSTRAINT "student_credential_uploads_verified_by_fkey" FOREIGN KEY (verified_by) REFERENCES auth.users(id);
ALTER TABLE public.system_settings
  ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id);
ALTER TABLE public.training_courses
  ADD CONSTRAINT "training_courses_canonical_course_id_fkey" FOREIGN KEY (canonical_course_id) REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE public.training_courses
  ADD CONSTRAINT "training_courses_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.training_courses
  ADD CONSTRAINT "training_courses_credential_id_fkey" FOREIGN KEY (credential_id) REFERENCES credential_registry(id) ON DELETE SET NULL;
ALTER TABLE public.training_courses
  ADD CONSTRAINT "training_courses_instructor_id_fkey" FOREIGN KEY (instructor_id) REFERENCES auth.users(id);
ALTER TABLE public.training_courses
  ADD CONSTRAINT "training_courses_program_id_fkey" FOREIGN KEY (program_id) REFERENCES programs(id);
ALTER TABLE public.training_courses
  ADD CONSTRAINT "training_courses_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.training_courses
  ADD CONSTRAINT "training_courses_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE public.training_courses
  ADD CONSTRAINT "training_courses_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL;

DO $security$
DECLARE
  relation_name text;
BEGIN
  FOREACH relation_name IN ARRAY ARRAY[
      'apprentice_competency_records',
      'apprentice_sites',
      'apprentices',
      'barber_subscriptions',
      'communication_extensions',
      'communication_workspaces',
      'credential_providers',
      'credential_registry',
      'hour_entries',
      'instructor_assignments',
      'notification_preferences',
      'phone_destinations',
      'phone_numbers',
      'phone_systems',
      'program_courses',
      'program_holder_courses',
      'program_holder_payouts',
      'program_holder_reports',
      'progress_entries',
      'referrals',
      'student_credential_uploads',
      'system_settings',
      'team_members',
      'training_courses'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', relation_name);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', relation_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO service_role', relation_name);
  END LOOP;
END;
$security$;

-- Public readers use the catalog contracts. Portal writes use server-side,
-- role-checked handlers except for the caller-owned notification preferences.
GRANT SELECT ON public.team_members, public.training_courses, public.program_courses TO anon, authenticated;
CREATE POLICY qa_active_team_members ON public.team_members FOR SELECT TO anon, authenticated
  USING (is_active = true);
CREATE POLICY qa_active_training_courses ON public.training_courses FOR SELECT TO anon, authenticated
  USING (is_active = true);
CREATE POLICY qa_public_program_course_links ON public.program_courses FOR SELECT TO anon, authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
CREATE POLICY qa_own_notification_preferences ON public.notification_preferences FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

GRANT SELECT ON public.apprentices, public.apprentice_competency_records, public.hour_entries, public.progress_entries, public.student_credential_uploads TO authenticated;
CREATE POLICY qa_own_apprentice ON public.apprentices FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY qa_own_competency_records ON public.apprentice_competency_records FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.program_enrollments enrollment
    WHERE enrollment.id = apprentice_competency_records.enrollment_id
      AND (enrollment.user_id = (SELECT auth.uid()) OR enrollment.student_id = (SELECT auth.uid()))
  ));
CREATE POLICY qa_own_hour_entries ON public.hour_entries FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY qa_own_progress_entries ON public.progress_entries FOR SELECT TO authenticated
  USING (
    apprentice_id = (SELECT auth.uid()) OR EXISTS (
      SELECT 1 FROM public.apprentices apprentice
      WHERE apprentice.id = progress_entries.apprentice_id AND apprentice.user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY qa_own_credential_uploads ON public.student_credential_uploads FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

NOTIFY pgrst, 'reload schema';
COMMIT;
