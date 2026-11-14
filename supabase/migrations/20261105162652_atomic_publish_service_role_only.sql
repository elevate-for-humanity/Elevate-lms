-- Follow-up to an already-applied atomic publisher definition.
-- Restrict privileged version/publish writes to the trusted server role.
-- Never expose the SECURITY DEFINER entry point directly to authenticated users.
SET LOCAL lock_timeout = '5s';
REVOKE EXECUTE ON FUNCTION public.publish_course_with_version(uuid,uuid,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_course_with_version(uuid,uuid,text)
  TO service_role;
