-- Fix overly permissive RLS policies (safe version)
-- Only modifies policies that exist

-- Fix certificates cert_insert policy
DO $$
BEGIN
  DROP POLICY IF EXISTS "cert_insert" ON public.certificates;
  CREATE POLICY "cert_insert" ON public.certificates
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table certificates does not exist, skipping';
END $$;

-- Fix crm_contacts policy
DO $$
BEGIN
  DROP POLICY IF EXISTS "crm_contact_policy" ON public.crm_contacts;
  
  -- Check if policies already exist before creating
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crm_contacts' AND policyname = 'crm_contacts_select') THEN
    CREATE POLICY "crm_contacts_select" ON public.crm_contacts
      FOR SELECT TO authenticated
      USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crm_contacts' AND policyname = 'crm_contacts_insert') THEN
    CREATE POLICY "crm_contacts_insert" ON public.crm_contacts
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crm_contacts' AND policyname = 'crm_contacts_update') THEN
    CREATE POLICY "crm_contacts_update" ON public.crm_contacts
      FOR UPDATE TO authenticated
      USING (auth.uid() IS NOT NULL);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crm_contacts' AND policyname = 'crm_contacts_delete') THEN
    CREATE POLICY "crm_contacts_delete" ON public.crm_contacts
      FOR DELETE TO authenticated
      USING (auth.uid() IS NOT NULL);
  END IF;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table crm_contacts does not exist, skipping';
END $$;

-- Fix qa_checklists policy
DO $$
BEGIN
  DROP POLICY IF EXISTS "qa_checklist_policy" ON public.qa_checklists;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'qa_checklists' AND policyname = 'qa_checklists_select') THEN
    CREATE POLICY "qa_checklists_select" ON public.qa_checklists
      FOR SELECT TO authenticated
      USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'qa_checklists' AND policyname = 'qa_checklists_insert') THEN
    CREATE POLICY "qa_checklists_insert" ON public.qa_checklists
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'qa_checklists' AND policyname = 'qa_checklists_update') THEN
    CREATE POLICY "qa_checklists_update" ON public.qa_checklists
      FOR UPDATE TO authenticated
      USING (auth.uid() IS NOT NULL);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'qa_checklists' AND policyname = 'qa_checklists_delete') THEN
    CREATE POLICY "qa_checklists_delete" ON public.qa_checklists
      FOR DELETE TO authenticated
      USING (auth.uid() IS NOT NULL);
  END IF;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table qa_checklists does not exist, skipping';
END $$;

-- Fix notifications policy
DO $$
BEGIN
  DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
  CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table notifications does not exist, skipping';
END $$;
