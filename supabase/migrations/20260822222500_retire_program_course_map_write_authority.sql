-- Retire legacy program_course_map as an active write authority.
-- programs owns program identity and program_courses owns program/course relationships.
-- Keep the legacy table in place for read-only compatibility while remaining callers are removed.
CREATE OR REPLACE FUNCTION public.sync_canonical_program_course_authority()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.program_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.program_courses (
    program_id,
    course_id,
    is_required,
    order_index
  )
  VALUES (
    NEW.program_id,
    NEW.id,
    true,
    0
  )
  ON CONFLICT (program_id, course_id) DO NOTHING;

  UPDATE public.programs
  SET has_lms_course = true,
      lms_model = 'internal',
      delivery_model = 'internal_lms',
      updated_at = now()
  WHERE id = NEW.program_id
    AND (
      has_lms_course IS DISTINCT FROM true
      OR lms_model IS DISTINCT FROM 'internal'
      OR delivery_model IS DISTINCT FROM 'internal_lms'
    );

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.sync_canonical_program_course_authority() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_canonical_program_course_authority() FROM anon;
REVOKE ALL ON FUNCTION public.sync_canonical_program_course_authority() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.sync_canonical_program_course_authority() TO service_role;
