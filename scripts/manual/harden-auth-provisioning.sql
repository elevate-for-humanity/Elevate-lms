-- Authority is server-managed; public signup metadata supplies display names only.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_tenant uuid;
  v_full_name text;
  v_role text;
  v_metadata_tenant text;
  v_allowed_roles text[] := ARRAY['super_admin','admin','org_admin','advisor','staff','instructor','test_admin','proctor','student','learner','user','delegate','grant_client','apprentice','barber_apprentice','cosmetology_apprentice','sponsor','employer','recruiter','partner','host_shop','host_shop_admin','workforce_partner','parent','creator','case_manager','workforce_board','workforce_board_admin','program_holder','site_coordinator','provider','provider_admin','mentor','guest','applicant'];
BEGIN
  v_metadata_tenant := NEW.raw_app_meta_data ->> 'tenant_id';

  IF v_metadata_tenant IS NOT NULL AND v_metadata_tenant ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    SELECT id INTO v_tenant
    FROM public.tenants
    WHERE id = v_metadata_tenant::uuid
      AND COALESCE(status,'active') = 'active'
    LIMIT 1;
  END IF;

  IF NULLIF(v_metadata_tenant, '') IS NOT NULL AND v_tenant IS NULL THEN
    RAISE EXCEPTION 'Trusted profile tenant is not an active configured tenant';
  END IF;

  IF v_tenant IS NULL THEN
    SELECT id INTO v_tenant
    FROM public.tenants
    WHERE is_platform_owner = true
      AND COALESCE(status,'active') = 'active'
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'No active platform-owner tenant is configured for profile provisioning';
  END IF;

  v_full_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'full_name',''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'first_name','') || ' ' || COALESCE(NEW.raw_user_meta_data ->> 'last_name','')),'')
  );

  v_role := lower(COALESCE(NEW.raw_app_meta_data ->> 'role','student'));
  IF NOT (v_role = ANY(v_allowed_roles)) THEN
    v_role := 'student';
  END IF;

  INSERT INTO public.profiles (id,email,role,tenant_id,full_name,last_sign_in_at)
  VALUES (NEW.id,NEW.email,v_role,v_tenant,v_full_name,NEW.last_sign_in_at)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role = CASE WHEN profiles.role IN ('student','guest') THEN EXCLUDED.role ELSE profiles.role END,
        full_name = COALESCE(EXCLUDED.full_name,profiles.full_name),
        tenant_id = COALESCE(profiles.tenant_id,EXCLUDED.tenant_id),
        last_sign_in_at = COALESCE(NEW.last_sign_in_at,profiles.last_sign_in_at),
        updated_at = now();

  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
