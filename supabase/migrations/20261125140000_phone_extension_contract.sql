-- Tighten the phone extension contract to what the telephony layer can
-- actually route: the operator '0' or a 3-digit extension (100-999).
-- The PBX provisioner, the generated PWA dialplan (_XXX), the owned
-- voicemail installer, and PARIS all enforce exactly this shape. The
-- previous 2-to-6-digit rule let an admin save extensions that could
-- never be provisioned or dialed. Every existing communication_extensions
-- row already conforms to the strict pattern (verified 2026-11-25).
-- Function body is otherwise identical to the live definition.
CREATE OR REPLACE FUNCTION public.save_phone_extension(p_workspace_id uuid, p_profile_id uuid, p_extension text, p_department text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  w public.communication_workspaces%ROWTYPE;
  p public.profiles%ROWTYPE;
  e public.communication_extensions%ROWTYPE;
  route_id uuid;
BEGIN
  SELECT * INTO w FROM public.communication_workspaces WHERE id = p_workspace_id FOR UPDATE;
  IF NOT FOUND OR w.phone_system_id IS NULL THEN
    RAISE EXCEPTION 'The communications workspace has no phone system.';
  END IF;
  IF p_extension IS NULL OR p_extension !~ '^(0|[1-9][0-9]{2})$' OR p_extension ~ '[[:space:]]' THEN
    RAISE EXCEPTION 'Invalid phone extension';
  END IF;
  SELECT * INTO p FROM public.profiles WHERE id = p_profile_id
    AND role IN ('admin','super_admin','staff','program_holder','programholder','site_coordinator')
    AND coalesce(tenant_id, organization_id) IS NOT DISTINCT FROM w.tenant_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Select a valid team member in this organization.'; END IF;
  INSERT INTO public.communication_extensions
    (workspace_id,profile_id,extension,display_name,department,enabled,webrtc_provider,updated_at)
  VALUES (w.id,p.id,p_extension,coalesce(nullif(p.full_name,''),p.email,'Team member'),
          p_department,true,'asterisk',now())
  ON CONFLICT (workspace_id,profile_id) DO UPDATE SET
    extension=excluded.extension,display_name=excluded.display_name,department=excluded.department,
    enabled=true,webrtc_provider='asterisk',updated_at=now()
  RETURNING * INTO e;

  SELECT d.id INTO route_id FROM public.phone_destinations d
  WHERE d.phone_system_id = w.phone_system_id AND d.extension_id = e.id AND d.destination_type = 'webrtc'
  ORDER BY d.enabled DESC, (d.id = e.destination_id) DESC NULLS LAST, d.created_at, d.id
  LIMIT 1 FOR UPDATE;
  IF route_id IS NULL THEN
    INSERT INTO public.phone_destinations
      (phone_system_id,extension_id,name,department,destination_type,destination,ring_seconds,fallback_to_voicemail,enabled)
    VALUES (w.phone_system_id,e.id,e.display_name,e.department,'webrtc',NULL,20,true,true)
    RETURNING id INTO route_id;
  ELSE
    UPDATE public.phone_destinations SET name=e.display_name,department=e.department,
      enabled=true,updated_at=now() WHERE id=route_id;
  END IF;
  UPDATE public.communication_extensions SET destination_id=route_id,updated_at=now() WHERE id=e.id;
  RETURN e.id;
END;
$function$;
