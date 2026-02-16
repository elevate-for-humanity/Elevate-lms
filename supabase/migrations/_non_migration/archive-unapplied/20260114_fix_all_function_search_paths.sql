-- Fix function search_path security warnings
-- This script safely alters only functions that exist
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- Helper to safely alter function search_path
CREATE OR REPLACE FUNCTION pg_temp.safe_set_search_path(func_signature text)
RETURNS void AS $$
BEGIN
  EXECUTE format('ALTER FUNCTION %s SET search_path = ''''', func_signature);
EXCEPTION 
  WHEN undefined_function THEN 
    RAISE NOTICE 'Function % does not exist, skipping', func_signature;
  WHEN OTHERS THEN
    RAISE NOTICE 'Error altering %: %', func_signature, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Now alter all functions that were flagged by the linter
-- Using the helper function to safely skip non-existent ones

SELECT pg_temp.safe_set_search_path('public.touch_updated_at()');
SELECT pg_temp.safe_set_search_path('public.update_digital_purchases_updated_at()');
SELECT pg_temp.safe_set_search_path('public.sync_program_holder_documents_uploaded_at()');
SELECT pg_temp.safe_set_search_path('public.sync_program_holder_verification_fields()');
SELECT pg_temp.safe_set_search_path('public.validate_enrollment_license()');
SELECT pg_temp.safe_set_search_path('public.track_license_usage()');
SELECT pg_temp.safe_set_search_path('public.log_document_action()');
SELECT pg_temp.safe_set_search_path('public.update_document_timestamp()');
SELECT pg_temp.safe_set_search_path('public.validate_partner_course_creation()');
SELECT pg_temp.safe_set_search_path('public.log_ferpa_access()');
SELECT pg_temp.safe_set_search_path('public.notify_document_status_change()');
SELECT pg_temp.safe_set_search_path('public.update_apprentice_placements_updated_at()');
SELECT pg_temp.safe_set_search_path('public.is_admin()');
SELECT pg_temp.safe_set_search_path('public.notify_enrollment_created()');
SELECT pg_temp.safe_set_search_path('public.set_shop_onboarding_updated_at()');
SELECT pg_temp.safe_set_search_path('public.update_shops_updated_at()');
SELECT pg_temp.safe_set_search_path('public.trigger_enrollment_email()');
SELECT pg_temp.safe_set_search_path('public.update_updated_at_column()');
SELECT pg_temp.safe_set_search_path('public.update_student_onboarding_updated_at()');
SELECT pg_temp.safe_set_search_path('public.update_push_tokens_updated_at()');
SELECT pg_temp.safe_set_search_path('public.trigger_hsi_enrollment()');
SELECT pg_temp.safe_set_search_path('public.update_lms_progress_updated_at()');
SELECT pg_temp.safe_set_search_path('public.enqueue_badge_earned_notification()');
SELECT pg_temp.safe_set_search_path('public.update_marketplace_creators_updated_at()');
SELECT pg_temp.safe_set_search_path('public.update_marketplace_products_updated_at()');
SELECT pg_temp.safe_set_search_path('public.handle_new_auth_user()');
SELECT pg_temp.safe_set_search_path('public.generate_certificate_number()');
SELECT pg_temp.safe_set_search_path('public.seed_application_checklist()');
SELECT pg_temp.safe_set_search_path('public.set_updated_at()');
SELECT pg_temp.safe_set_search_path('public.applications_coerce_defaults()');
SELECT pg_temp.safe_set_search_path('public.normalize_application_inputs()');
SELECT pg_temp.safe_set_search_path('public.update_shop_placements_updated_at()');
SELECT pg_temp.safe_set_search_path('public.applications_nullify_blanks()');
SELECT pg_temp.safe_set_search_path('public.update_tax_appointments_updated_at()');
SELECT pg_temp.safe_set_search_path('public.tax_intake_sanitize_insert()');
SELECT pg_temp.safe_set_search_path('public.set_applications_user_id()');
SELECT pg_temp.safe_set_search_path('public.update_status_on_enrollment()');
SELECT pg_temp.safe_set_search_path('public.sync_partner_enrollment_progress()');
SELECT pg_temp.safe_set_search_path('public.auto_calculate_hours()');
SELECT pg_temp.safe_set_search_path('public.handle_new_user()');
SELECT pg_temp.safe_set_search_path('public.update_total_hours()');
SELECT pg_temp.safe_set_search_path('public.check_course_completion()');
SELECT pg_temp.safe_set_search_path('public.update_application_status()');
SELECT pg_temp.safe_set_search_path('public.set_application_user_id()');
SELECT pg_temp.safe_set_search_path('public.set_quiz_attempts_user_uuid()');
SELECT pg_temp.safe_set_search_path('public.update_enrollment_steps_updated_at()');
SELECT pg_temp.safe_set_search_path('public.generate_enrollment_steps()');
SELECT pg_temp.safe_set_search_path('public.check_missed_checkins()');

-- Functions with parameters - try common signatures
SELECT pg_temp.safe_set_search_path('public.check_license_valid(uuid)');
SELECT pg_temp.safe_set_search_path('public.check_license_valid()');
SELECT pg_temp.safe_set_search_path('public.increment_license_usage(uuid)');
SELECT pg_temp.safe_set_search_path('public.increment_license_usage()');
SELECT pg_temp.safe_set_search_path('public.decrement_license_usage(uuid)');
SELECT pg_temp.safe_set_search_path('public.decrement_license_usage()');
SELECT pg_temp.safe_set_search_path('public.is_ferpa_training_current(uuid)');
SELECT pg_temp.safe_set_search_path('public.is_ferpa_training_current()');
SELECT pg_temp.safe_set_search_path('public.external_modules_complete(uuid)');
SELECT pg_temp.safe_set_search_path('public.external_modules_complete()');
SELECT pg_temp.safe_set_search_path('public.is_shop_staff(uuid)');
SELECT pg_temp.safe_set_search_path('public.is_shop_staff()');
SELECT pg_temp.safe_set_search_path('public.get_partner_license_info(uuid)');
SELECT pg_temp.safe_set_search_path('public.get_partner_license_info()');
SELECT pg_temp.safe_set_search_path('public.can_user_enroll(uuid, uuid)');
SELECT pg_temp.safe_set_search_path('public.can_user_enroll(uuid)');
SELECT pg_temp.safe_set_search_path('public.get_user_document_requirements(uuid)');
SELECT pg_temp.safe_set_search_path('public.get_user_document_requirements()');
SELECT pg_temp.safe_set_search_path('public.get_tax_document_stats(integer)');
SELECT pg_temp.safe_set_search_path('public.get_tax_document_stats()');
SELECT pg_temp.safe_set_search_path('public.admin_upsert_push_token(uuid, text, text)');
SELECT pg_temp.safe_set_search_path('public.cleanup_old_audit_logs(integer)');
SELECT pg_temp.safe_set_search_path('public.update_scorm_progress(uuid, text, jsonb)');
SELECT pg_temp.safe_set_search_path('public.calculate_course_progress(uuid, uuid)');
SELECT pg_temp.safe_set_search_path('public.calculate_course_progress(uuid)');
SELECT pg_temp.safe_set_search_path('public.nullify_blank_text(text)');
SELECT pg_temp.safe_set_search_path('public.claim_applications_by_email(uuid)');
SELECT pg_temp.safe_set_search_path('public.claim_applications_by_email()');
SELECT pg_temp.safe_set_search_path('public.get_tax_appointment_stats()');
SELECT pg_temp.safe_set_search_path('public.calculate_payroll(uuid, date, date)');
SELECT pg_temp.safe_set_search_path('public.external_modules_summary(uuid)');
SELECT pg_temp.safe_set_search_path('public.external_modules_summary()');
SELECT pg_temp.safe_set_search_path('public._col_is_uuid(text, text)');
SELECT pg_temp.safe_set_search_path('public.get_current_step(uuid)');
SELECT pg_temp.safe_set_search_path('public.advance_to_next_step(uuid)');
SELECT pg_temp.safe_set_search_path('public.mark_step_complete(uuid, text)');
SELECT pg_temp.safe_set_search_path('public._table_exists(text)');
SELECT pg_temp.safe_set_search_path('public.is_enrollment_complete(uuid)');
SELECT pg_temp.safe_set_search_path('public.initiate_enrollment_payment(uuid, numeric, text)');
SELECT pg_temp.safe_set_search_path('public._col_exists(text, text)');
SELECT pg_temp.safe_set_search_path('public._col_udt(text, text)');
SELECT pg_temp.safe_set_search_path('public.complete_enrollment_payment(uuid, text)');
SELECT pg_temp.safe_set_search_path('public.apply_stripe_subscription_update(text, text, text, timestamptz, timestamptz)');

-- Additional common functions
SELECT pg_temp.safe_set_search_path('public.handle_updated_at()');
SELECT pg_temp.safe_set_search_path('public.set_timestamp()');
SELECT pg_temp.safe_set_search_path('public.is_instructor()');
SELECT pg_temp.safe_set_search_path('public.is_staff()');
SELECT pg_temp.safe_set_search_path('public.refresh_leaderboards()');
SELECT pg_temp.safe_set_search_path('public.update_course_completion_timestamp()');
SELECT pg_temp.safe_set_search_path('public.update_user_streak(uuid)');
SELECT pg_temp.safe_set_search_path('public.check_first_course_badge()');
SELECT pg_temp.safe_set_search_path('public.check_five_courses_badge()');
SELECT pg_temp.safe_set_search_path('public.check_perfect_score_badge()');
SELECT pg_temp.safe_set_search_path('public.check_ten_courses_badge()');
SELECT pg_temp.safe_set_search_path('public.check_time_badges(uuid)');
SELECT pg_temp.safe_set_search_path('public.claim_applications_for_current_user()');
SELECT pg_temp.safe_set_search_path('public.get_invite_by_token(text)');
SELECT pg_temp.safe_set_search_path('public.get_org_invite_by_token(text)');
SELECT pg_temp.safe_set_search_path('public.get_user_by_email(text)');
SELECT pg_temp.safe_set_search_path('public._is_org_admin(uuid)');
SELECT pg_temp.safe_set_search_path('public._is_org_member(uuid)');
SELECT pg_temp.safe_set_search_path('public._is_super_admin()');

-- Drop the helper function
DROP FUNCTION pg_temp.safe_set_search_path(text);
