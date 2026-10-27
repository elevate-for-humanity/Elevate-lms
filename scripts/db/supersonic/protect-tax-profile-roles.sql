-- Dedicated Supersonic Starter only (jlqrfwxuhpzmuivdxvvz).
-- Tax authorization reads profiles.role; self-service profile updates must never change it.
-- Keep the existing owner row policy and service-role administration privileges.
REVOKE UPDATE ON public.profiles FROM PUBLIC, anon, authenticated;
REVOKE UPDATE (id, email, full_name, role, created_at, updated_at)
  ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT UPDATE (full_name) ON public.profiles TO authenticated;
DO $verify$
BEGIN
  IF has_column_privilege('authenticated','public.profiles','role','UPDATE')
    OR has_column_privilege('anon','public.profiles','role','UPDATE')
    OR has_column_privilege('authenticated','public.profiles','id','UPDATE')
  THEN RAISE EXCEPTION 'Tax profile privilege escalation must be denied'; END IF;
  IF NOT has_column_privilege('authenticated','public.profiles','full_name','UPDATE')
    OR NOT has_column_privilege('service_role','public.profiles','role','UPDATE')
  THEN RAISE EXCEPTION 'Owner display-name updates and service administration must remain available'; END IF;
END
$verify$;

