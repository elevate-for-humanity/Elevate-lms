-- Create missing RPC functions referenced by app routes

-- check_enrollment_duplicates: find duplicate program enrollments
CREATE OR REPLACE FUNCTION public.check_enrollment_duplicates()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'duplicate_count', (
      SELECT count(*) FROM (
        SELECT student_id, program_id, count(*)
        FROM program_enrollments
        GROUP BY student_id, program_id
        HAVING count(*) > 1
      ) dupes
    ),
    'checked_at', now()
  ) INTO result;
  RETURN result;
END;
$$;

-- expire_all_overdue_licenses: expire licenses past their end date
CREATE OR REPLACE FUNCTION public.expire_all_overdue_licenses()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count integer;
BEGIN
  UPDATE licenses
  SET status = 'expired', updated_at = now()
  WHERE status = 'active'
    AND expires_at < now();
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN json_build_object('expired', expired_count, 'at', now());
END;
$$;

-- sum_training_hours: total approved training hours
CREATE OR REPLACE FUNCTION public.sum_training_hours()
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total numeric;
BEGIN
  SELECT COALESCE(sum(COALESCE(accepted_hours, hours, hours_claimed, 0)), 0)
  INTO total
  FROM hour_entries
  WHERE status = 'approved';
  RETURN total;
END;
$$;
