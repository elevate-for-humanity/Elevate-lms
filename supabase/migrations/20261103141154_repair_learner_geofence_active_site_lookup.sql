-- Use the same active-site flag, coordinates and radius as the learner clock.
CREATE OR REPLACE FUNCTION rpc_private.is_within_geofence(p_site_id uuid, p_lat numeric, p_lng numeric)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.apprentice_sites AS site
    WHERE site.id = p_site_id AND site.is_active
      AND site.latitude BETWEEN -90 AND 90 AND site.longitude BETWEEN -180 AND 180
      AND site.radius_meters > 0 AND p_lat BETWEEN -90 AND 90 AND p_lng BETWEEN -180 AND 180
      AND public.calculate_distance_meters(p_lat, p_lng, site.latitude, site.longitude) <= site.radius_meters
  )
$$;
