-- QA ONLY: elevate-lms-qa / isdgjcdabhxxozarmxta.
-- Canonical public-submit edge function calls public.intake_rate_check.
-- Restore its original service-only behavior after the intake schema bootstrap.
-- No production use, data inserts, student records, payment or approval changes.
DO $qa_guard$
BEGIN
  IF to_regclass('public.application_intake') IS NULL
    OR to_regclass('public.program_holder_documents') IS NULL
    OR to_regprocedure('public.intake_rate_check(inet,integer,integer)') IS NOT NULL
  THEN RAISE EXCEPTION 'Intake rate guard QA prerequisites failed; refuse migration'; END IF;
END
$qa_guard$;

CREATE FUNCTION public.intake_rate_check(
  p_ip inet,
  p_window_minutes int DEFAULT 15,
  p_max_submissions int DEFAULT 5
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $rate$
  SELECT count(*) < p_max_submissions
  FROM public.application_intake
  WHERE ip_address = p_ip
    AND created_at > now() - (p_window_minutes || ' minutes')::interval;
$rate$;
REVOKE ALL ON FUNCTION public.intake_rate_check(inet,int,int)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.intake_rate_check(inet,int,int)
  TO service_role;

DO $verify$
BEGIN
  IF has_function_privilege('anon',
      'public.intake_rate_check(inet,integer,integer)','EXECUTE')
    OR has_function_privilege('authenticated',
      'public.intake_rate_check(inet,integer,integer)','EXECUTE')
    OR NOT has_function_privilege('service_role',
      'public.intake_rate_check(inet,integer,integer)','EXECUTE')
  THEN RAISE EXCEPTION 'Intake rate helper QA privilege mismatch'; END IF;
END
$verify$;
NOTIFY pgrst,'reload schema';
