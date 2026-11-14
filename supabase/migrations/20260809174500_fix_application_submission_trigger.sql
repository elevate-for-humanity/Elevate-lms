-- Fix all application inserts failing in the submission audit trigger.
-- `applications` has program_slug/program_interest columns, not `program`.

CREATE OR REPLACE FUNCTION public.log_application_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $$
BEGIN
  INSERT INTO public.application_access_logs (
    application_id,
    action,
    ip_address,
    user_agent,
    metadata
  )
  VALUES (
    NEW.id,
    'submission_created',
    NEW.submission_ip::inet,
    NEW.submission_user_agent,
    jsonb_build_object(
      'request_fingerprint', NEW.request_fingerprint,
      'status', NEW.status,
      'program', COALESCE(NULLIF(NEW.program_slug, ''), NEW.program_interest)
    )
  );

  RETURN NEW;
END;
$$;
