-- Pin the execution namespace for every public function flagged by the
-- Supabase security advisor. This prevents object-shadowing attacks without
-- changing function signatures, ownership, grants, or runtime semantics.

DO $$
DECLARE
  target regprocedure;
BEGIN
  FOR target IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (ARRAY[
        'update_workone_survey_updated_at', 'auto_assign_hvac_to_program_holder',
        'can_publish_program', 'compute_priority_score', 'decrement_slot_on_cancel',
        'enforce_funding_state_consistency', 'enqueue_automation_actions',
        'fn_enrollment_voucher_payout', 'get_accreditation_readiness_summary',
        'get_user_tenant_id', 'has_passed_checkpoint', 'match_lessons',
        'next_module_is_unlocked', 'pca_set_updated_at', 'prevent_attestation_mutation',
        'prevent_audit_ddl_events_mutation', 'prevent_evidence_key_overwrite',
        'prevent_locked_hour_entry_delete', 'prevent_locked_hour_entry_update',
        'prevent_null_program_id', 'propagate_workflow_tenant_id',
        'set_emp_onboard_progress_updated_at', 'set_exam_booking_leads_updated_at',
        'set_payment_transactions_updated_at', 'set_ph_reports_updated_at',
        'set_updated_at', 'set_updated_at_fssa', 'set_video_jobs_updated_at',
        'set_program_pricing_updated_at', 'sync_apprentice_site_aliases',
        'sync_certificate_issued_at', 'sync_course_published_status',
        'sync_phc_credential_id', 'sync_phc_program_id',
        'sync_referral_acknowledgment', 'trg_assign_student_number',
        'trg_remove_program_catalog', 'update_eligibility_review_timestamp',
        'update_school_applications_updated_at', 'update_mou_templates_updated_at',
        'update_updated_at', 'update_updated_at_column', 'automation_in_cooldown',
        'cleanup_expired_ai_memory', 'decrement_slot_booked_count',
        'generate_student_number', 'is_super_admin', 'refresh_admin_priority_queue',
        'refresh_priority_score', 'prevent_terminal_workflow_run_mutation',
        'schedule_fssa_followups', 'sfc_leads_set_updated_at', 'sfc_set_tracking_id',
        'trg_warn_missing_certification_pathway', 'trg_sync_enrollment_from_profile',
        'update_studio_conversations_updated_at', 'update_ai_tasks_updated_at',
        'prevent_audit_log_mutation', 'check_partner_document_completion',
        'update_curriculum_updated_at', 'check_trial_expiration', 'ev2_audit_trigger',
        'update_ev2_timestamp'
      ]::name[])
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %s SET search_path = pg_catalog, public, extensions',
      target
    );
  END LOOP;
END;
$$;

-- This table contained no rows and had no dependent objects or policies. It
-- was an abandoned RLS test artifact, not an application data model.
DROP TABLE IF EXISTS public.test_user_id;
