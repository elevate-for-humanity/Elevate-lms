-- ============================================================================
-- PHASE 1d: ENABLE RLS ON ALL REMAINING TENANT_ID TABLES
-- ============================================================================
-- View-safe: checks pg_class.relkind before ALTER TABLE.
-- ============================================================================

DO $$
DECLARE
  v_table text;
  v_tables text[] := ARRAY[
    'agreements',
    'ai_generated_courses',
    'api_keys',
    'apprentice_assignments',
    'apprentice_placements',
    'attendance_hours',
    'benefits_plans',
    'billing_cycles',
    'cohorts',
    'compliance_alerts',
    'compliance_audit_log',
    'content_pages',
    'credential_submissions',
    'data_retention_policies',
    'departments',
    'employees',
    'employer_applications',
    'enrollment_transitions',
    'franchises',
    'handbook_acknowledgments',
    'holidays',
    'intakes',
    'invoices',
    'ip_access_control',
    'leave_policies',
    'license_events',
    'license_purchases',
    'license_usage',
    'license_violations',
    'licenses',
    'marketing_campaigns',
    'marketing_contacts',
    'moderation_rules',
    'onboarding_progress',
    'partner_documents',
    'partner_lms_enrollment_failures',
    'partner_organizations',
    'partner_shops',
    'partner_sites',
    'payment_plans',
    'payroll_runs',
    'permission_groups',
    'positions',
    'program_holder_applications',
    'provisioning_events',
    'rapids_apprentice_data',
    'shop_staff',
    'shops',
    'social_media_settings',
    'sso_providers',
    'staff_applications',
    'staff_permissions',
    'student_applications',
    'subscriptions',
    'tax_clients',
    'tax_payments',
    'tenant_branding',
    'tenant_domains',
    'tenant_invitations',
    'tenant_licenses',
    'tenant_members',
    'tenant_memberships',
    'tenant_settings',
    'tenant_stripe_customers',
    'tenant_subscriptions',
    'tenant_usage',
    'tenant_usage_daily',
    'training_enrollments',
    'user_permissions',
    'user_roles',
    'wioa_participant_records'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    -- Only apply to real tables (relkind='r'), skip views ('v')
    IF EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = v_table AND n.nspname = 'public' AND c.relkind = 'r'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table);

      -- Create SELECT policy
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT USING (is_super_admin() OR tenant_id = get_current_tenant_id())',
        v_table || '_tenant_select', v_table
      );

      -- Create INSERT policy
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id())',
        v_table || '_tenant_insert', v_table
      );

      -- Create UPDATE policy
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR UPDATE USING (is_super_admin() OR tenant_id = get_current_tenant_id())',
        v_table || '_tenant_update', v_table
      );

      RAISE NOTICE 'RLS enabled on %', v_table;
    ELSE
      RAISE NOTICE 'Skipping % (view or missing)', v_table;
    END IF;
  END LOOP;
END $$;