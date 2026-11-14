-- Add ON DELETE CASCADE FK constraints to baseline_untracked_tables that have
-- bare user_id UUID columns with no REFERENCES auth.users.
--
-- Without these, deleting an auth.users row leaves orphaned user_id values
-- in all of these tables (no cascade fires).
--
-- Pattern: ADD CONSTRAINT IF NOT EXISTS ... FOREIGN KEY (user_id)
--          REFERENCES auth.users(id) ON DELETE CASCADE
--
-- Safe to re-run: each statement uses IF NOT EXISTS / DO block guards.
-- Apply: Supabase Dashboard → SQL Editor

DO $$
DECLARE
  tbl TEXT;

  -- Priority-ordered list: tables most likely to hold real user data.
  -- Grouped by category. All confirmed to have user_id UUID column in schema.
  tables TEXT[] := ARRAY[
    -- Learning & progress
    'enrollment_module_progress',
    'external_module_progress',
    'external_program_enrollments',
    'external_lms_enrollments',
    'scorm_progress',
    'scorm_registrations',
    'scorm_sessions',
    'scorm_completion_summary',
    'user_lesson_attempts',
    'user_progress',
    'progress',
    'learner_module_gate_state',
    'learning_analytics',
    'learning_activity_streaks',
    'learning_streaks',
    'user_streaks',
    'daily_activities',

    -- Credentials & compliance
    'student_credentials',
    'user_achievements',
    'user_badges',
    'point_transactions',
    'user_points',
    'leaderboard_entries',
    'leaderboard_scores',
    'global_leaderboard',
    'course_leaderboard',
    'learner_compliance',
    'learner_documents',
    'student_records',
    'ferpa_training_records',
    'user_compliance_status',

    -- Payments & billing
    'student_payments',
    'payment_plans',
    'payment_plan_selections',
    'payment_records',
    'payment_methods',
    'payment_splits',
    'tuition_payments',
    'bridge_payment_plans',
    'barber_payments',
    'invoices',
    'orders',
    'purchases',
    'subscriptions',
    'student_subscriptions',

    -- Applications & onboarding
    'student_applications',
    'employer_applications',
    'staff_applications',
    'affiliate_applications',
    'program_holder_applications',
    'funding_applications',
    'wioa_applications',
    'wioa_documents',
    'learner_onboarding',
    'onboarding_submissions',
    'onboarding_signatures',
    'onboarding_steps',
    'onboarding_events',
    'orientation_completions',

    -- Activity & engagement
    'user_activity_events',
    'user_activity_logs',
    'student_activity_log',
    'login_events',
    'analytics_events',
    'enrollment_events',
    'user_sessions',
    'video_playback_events',
    'video_bookmarks',
    'resource_bookmarks',
    'resource_downloads',
    'search_logs',

    -- Communication
    'direct_messages',
    'support_tickets',
    'support_messages',
    'chat_conversations',
    'ai_messages',
    'ai_assistant_messages',
    'discussion_posts',
    'forum_comments',
    'forum_members',
    'forum_reactions',
    'feedback',
    'user_feedback',
    'reviews',
    'course_reviews',
    'call_requests',
    'callback_requests',

    -- Profile/preferences
    'user_preferences',
    'user_consents',
    'consent_preferences',
    'accessibility_preferences',
    'audio_preferences',
    'user_capabilities',
    'user_entitlements',
    'user_permissions',
    'user_licenses',
    'user_files',
    'user_resumes',
    'user_websites',
    'user_onboarding',
    'user_tutorials',

    -- Security & audit
    'two_factor_auth',
    'two_factor_attempts',
    'password_history',
    'security_alerts',
    'security_audit_logs',
    'account_deletion_requests',
    'account_export_events',
    'gdpr_requests',
    'user_connections',

    -- AI / Studio
    'studio_sessions',
    'studio_settings',
    'studio_chat_history',
    'studio_favorites',
    'studio_repos',
    'devstudio_chat_log',
    'ai_generations',
    'ai_instructor_logs',
    'ai_audit_log',
    'copilot_usage_log'
  ];

BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    -- Only add FK if table exists AND user_id column exists AND FK not already present
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = tbl
        AND column_name  = 'user_id'
    ) AND NOT EXISTS (
      SELECT FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema    = kcu.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema    = 'public'
        AND tc.table_name      = tbl
        AND kcu.column_name    = 'user_id'
    ) THEN
      BEGIN
        EXECUTE format(
          'ALTER TABLE public.%I
             ADD CONSTRAINT %I
             FOREIGN KEY (user_id)
             REFERENCES auth.users(id)
             ON DELETE CASCADE',
          tbl,
          tbl || '_user_id_fk'
        );
        RAISE NOTICE 'Added FK cascade: %', tbl;
      EXCEPTION WHEN others THEN
        RAISE WARNING 'Skipped % — %: %', tbl, SQLSTATE, SQLERRM;
      END;
    ELSE
      RAISE NOTICE 'Skipped % (table missing, column missing, or FK already exists)', tbl;
    END IF;
  END LOOP;

  RAISE NOTICE 'Done — FK cascade migration complete.';
END $$;
