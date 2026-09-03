-- Scope organization administrators to RTI entries belonging to organizations
-- where they hold an active org_owner/org_admin membership. Platform sponsor
-- staff retain sponsor-wide review; assigned instructors remain program-scoped.
CREATE OR REPLACE FUNCTION public.verify_apprenticeship_rti_entry(
  p_entry_id uuid,
  p_minutes_verified integer,
  p_decision text,
  p_notes text DEFAULT NULL::text
)
RETURNS public.apprenticeship_rti_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_role text;
  v_row public.apprenticeship_rti_entries%rowtype;
  v_program_id uuid;
  v_organization_id uuid;
BEGIN
  IF auth.role() <> 'service_role' THEN
    IF v_actor IS NULL THEN
      RAISE EXCEPTION 'Authentication required' USING errcode='42501';
    END IF;

    SELECT lower(coalesce(role::text,'')) INTO v_role
    FROM public.profiles
    WHERE id = v_actor;

    IF v_role NOT IN ('admin','super_admin','staff','org_admin','instructor') THEN
      RAISE EXCEPTION 'Sponsor staff, organization admin, or assigned instructor role required' USING errcode='42501';
    END IF;
  END IF;

  IF p_decision NOT IN ('verified','rejected') THEN
    RAISE EXCEPTION 'Invalid decision' USING errcode='22023';
  END IF;

  SELECT * INTO v_row
  FROM public.apprenticeship_rti_entries
  WHERE id = p_entry_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RTI entry not found' USING errcode='P0002';
  END IF;

  IF auth.role() <> 'service_role' AND v_role IN ('instructor','org_admin') THEN
    SELECT pe.program_id, pe.organization_id
      INTO v_program_id, v_organization_id
    FROM public.program_enrollments pe
    WHERE pe.id = v_row.enrollment_id;

    IF v_role = 'instructor' AND (
      v_program_id IS NULL OR NOT EXISTS (
        SELECT 1
        FROM public.program_instructors pi
        WHERE pi.instructor_id = v_actor
          AND pi.program_id = v_program_id
      )
    ) THEN
      RAISE EXCEPTION 'Instructor is not assigned to this apprenticeship program' USING errcode='42501';
    END IF;

    IF v_role = 'org_admin' AND (
      v_organization_id IS NULL OR NOT EXISTS (
        SELECT 1
        FROM public.organization_users ou
        WHERE ou.user_id = v_actor
          AND ou.organization_id = v_organization_id
          AND ou.status = 'active'
          AND ou.role IN ('org_owner','org_admin')
      )
    ) THEN
      RAISE EXCEPTION 'Organization administrator is not assigned to this apprentice organization' USING errcode='42501';
    END IF;
  END IF;

  IF p_decision='verified' AND (
    p_minutes_verified IS NULL OR
    p_minutes_verified <= 0 OR
    p_minutes_verified > v_row.minutes_claimed
  ) THEN
    RAISE EXCEPTION 'Verified minutes must be between 1 and claimed minutes' USING errcode='22023';
  END IF;

  UPDATE public.apprenticeship_rti_entries
  SET status = p_decision,
      minutes_verified = CASE WHEN p_decision='verified' THEN p_minutes_verified ELSE NULL END,
      verified_by = coalesce(v_actor, verified_by),
      verified_at = now(),
      evidence_notes = coalesce(p_notes, evidence_notes),
      rejection_reason = CASE WHEN p_decision='rejected' THEN coalesce(p_notes,'Rejected by reviewer') ELSE NULL END,
      updated_at = now()
  WHERE id = p_entry_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$function$;

REVOKE ALL ON FUNCTION public.verify_apprenticeship_rti_entry(uuid,integer,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_apprenticeship_rti_entry(uuid,integer,text,text) TO authenticated, service_role;
