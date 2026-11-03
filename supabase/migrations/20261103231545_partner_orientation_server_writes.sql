DO $migration$
DECLARE item record; op text; column_name text; predicate text; policy_name text;
BEGIN
  FOR item IN SELECT * FROM (VALUES ('onboarding_video_assignments', 'video_key'), ('program_holder_acknowledgements', 'document_type')) AS targets(table_name, key_column)
  LOOP
    predicate := format('coalesce(%I, '''') !~ ''^partner-onboarding-''', item.key_column);
    FOREACH op IN ARRAY ARRAY['insert','update','delete']
    LOOP
      policy_name := 'partner_orientation_server_' || op;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=item.table_name AND policyname=policy_name) THEN
        IF op='insert' THEN
          EXECUTE format('CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (%s)', policy_name,item.table_name,predicate);
        ELSIF op='update' THEN
          EXECUTE format('CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (%s) WITH CHECK (%s)',policy_name,item.table_name,predicate,predicate);
        ELSE
          EXECUTE format('CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (%s)',policy_name,item.table_name,predicate);
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END $migration$;
