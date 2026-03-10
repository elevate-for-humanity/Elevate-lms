-- Fix handle_new_user trigger to read role from signup metadata
-- Previously always defaulted to 'student' regardless of what role was selected at signup
-- Now reads raw_user_meta_data->>'role' and uses it if it's a valid role

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_default_tenant uuid;
  v_full_name text;
  v_role text;
  v_allowed_roles text[] := ARRAY['student','staff','partner','employer','program_holder','instructor','admin','super_admin'];
BEGIN
  -- Get the default tenant
  SELECT id INTO v_default_tenant
  FROM public.tenants
  WHERE active = true
  ORDER BY created_at ASC
  LIMIT 1;

  -- Extract full_name from user metadata
  v_full_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    TRIM(COALESCE(NEW.raw_user_meta_data ->> 'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')),
    NULL
  );
  IF v_full_name = '' THEN v_full_name := NULL; END IF;

  -- Read role from signup metadata — fall back to 'student' if missing or invalid
  v_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'student');
  IF NOT (v_role = ANY(v_allowed_roles)) THEN
    v_role := 'student';
  END IF;

  -- Upsert profile so re-confirmation emails don't duplicate rows
  INSERT INTO public.profiles (id, email, role, tenant_id, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    v_role,
    v_default_tenant,
    v_full_name
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email     = EXCLUDED.email,
      role      = CASE
                    WHEN profiles.role = 'student' THEN EXCLUDED.role
                    ELSE profiles.role  -- never downgrade an existing non-student role
                  END,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      tenant_id = COALESCE(EXCLUDED.tenant_id, profiles.tenant_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
