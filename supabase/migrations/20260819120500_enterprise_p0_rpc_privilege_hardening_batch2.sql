-- Enterprise P0/P1 privilege hardening, batch 2.
REVOKE ALL ON FUNCTION public.advance_enrollment_state(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.advance_enrollment_state(uuid, text) TO service_role;
REVOKE ALL ON FUNCTION public.advance_to_next_step(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.advance_to_next_step(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.generate_enrollment_steps(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_enrollment_steps(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.increment_slot_booked_count(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_slot_booked_count(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.decrement_slot_booked_count(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_slot_booked_count(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.promote_to_course_lessons(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.promote_to_course_lessons(text) TO service_role;
REVOKE ALL ON FUNCTION public.record_application_state_event(uuid, public.application_state, public.application_state, uuid, text, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_application_state_event(uuid, public.application_state, public.application_state, uuid, text, jsonb, text) TO service_role;
REVOKE ALL ON FUNCTION public.snapshot_course_version(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.snapshot_course_version(uuid, uuid, text) TO service_role;
REVOKE ALL ON FUNCTION public.log_ferpa_access(uuid, uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_ferpa_access(uuid, uuid, text, text, text, text) TO service_role;
REVOKE ALL ON FUNCTION public.log_tax_audit_event(character varying, text, character varying, uuid, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_tax_audit_event(character varying, text, character varying, uuid, jsonb, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.complete_onboarding_step(p_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
      RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
    END IF;
  END IF;
  INSERT INTO public.onboarding_progress (user_id, role, agreements_completed, agreements_completed_at, updated_at)
  VALUES (p_user_id, p_role, true, now(), now())
  ON CONFLICT (user_id) DO UPDATE
  SET agreements_completed = true,
      agreements_completed_at = COALESCE(public.onboarding_progress.agreements_completed_at, now()),
      updated_at = now();
END;
$function$;

REVOKE ALL ON FUNCTION public.complete_onboarding_step(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_onboarding_step(uuid, text) TO authenticated, service_role;
