-- Serialize retries of the same public Program Holder application while an
-- existing request is awaiting review. Preserve previously submitted records.
CREATE INDEX IF NOT EXISTS idx_program_holder_open_application_identity
  ON public.program_holder_applications (lower(btrim(email)), lower(btrim(organization_name)))
  WHERE status IN ('pending', 'in_review');

CREATE OR REPLACE FUNCTION public.guard_pending_program_holder_applications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $guard$
DECLARE
  normalized_email text := lower(btrim(NEW.payload->>'email'));
  normalized_organization text := lower(btrim(NEW.payload->>'organization_name'));
BEGIN
  IF coalesce(normalized_email, '') = '' OR coalesce(normalized_organization, '') = '' THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(
    'public-program-holder:' || jsonb_build_array(normalized_email, normalized_organization)::text,
    0
  ));

  IF EXISTS (
    SELECT 1 FROM public.program_holder_applications AS application
    WHERE lower(btrim(application.email)) = normalized_email
      AND lower(btrim(application.organization_name)) = normalized_organization
      AND application.status IN ('pending', 'in_review')
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23505',
      MESSAGE = 'PROGRAM_HOLDER_APPLICATION_ALREADY_PENDING';
  END IF;

  RETURN NEW;
END;
$guard$;

REVOKE ALL ON FUNCTION public.guard_pending_program_holder_applications() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_pending_program_holder_applications() TO service_role;

CREATE OR REPLACE TRIGGER trg_guard_pending_program_holder_applications
BEFORE INSERT ON public.application_intake
FOR EACH ROW
WHEN (NEW.application_type = 'program_holder' AND NEW.status = 'received')
EXECUTE FUNCTION public.guard_pending_program_holder_applications();
