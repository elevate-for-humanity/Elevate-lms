-- Forward repair for installations that already applied the unique-index migration.
-- Keep references and call history intact; pause only surplus live routes.
-- Prefer the current default, then menu target, then linked destination.
LOCK TABLE public.phone_destinations IN SHARE ROW EXCLUSIVE MODE;
WITH ranked AS (
  SELECT d.id, row_number() OVER (
    PARTITION BY d.phone_system_id, d.extension_id
    ORDER BY (s.default_destination_id = d.id) DESC NULLS LAST,
      EXISTS (SELECT 1 FROM public.phone_menu_options m
              WHERE m.phone_system_id = d.phone_system_id AND m.destination_id = d.id AND m.enabled) DESC,
      (e.destination_id = d.id) DESC NULLS LAST, d.created_at, d.id
  ) AS route_rank
  FROM public.phone_destinations d
  JOIN public.phone_systems s ON s.id = d.phone_system_id
  LEFT JOIN public.communication_extensions e ON e.id = d.extension_id
  WHERE d.destination_type = 'webrtc' AND d.enabled AND d.extension_id IS NOT NULL
)
UPDATE public.phone_destinations d SET enabled = false, updated_at = now()
FROM ranked r WHERE d.id = r.id AND r.route_rank > 1;

-- The server authorizes the workspace; only the service role can invoke this RPC.
-- A workspace row lock serializes extension edits and all writes roll back together.
CREATE OR REPLACE FUNCTION public.save_phone_extension(
  p_workspace_id uuid, p_profile_id uuid, p_extension text, p_department text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
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
  IF p_extension IS NULL OR p_extension !~ '^(0|[0-9]{2,6})$' OR p_extension ~ '[[:space:]]' THEN
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
$$;
REVOKE ALL ON FUNCTION public.save_phone_extension(uuid,uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_phone_extension(uuid,uuid,text,text) TO service_role;
