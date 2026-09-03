-- Timeclock site table alignment
-- The timeclock action/heartbeat routes query apprentice_sites but used
-- column names from the older partner_sites table (center_lat, center_lng, radius_m).
-- This migration adds those alias columns so both naming conventions work,
-- and adds is_active for the context route filter.

ALTER TABLE public.apprentice_sites
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS center_lat  DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS center_lng  DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS radius_m    INTEGER;

-- Back-fill alias columns from canonical columns
UPDATE public.apprentice_sites
SET
  center_lat = latitude,
  center_lng = longitude,
  radius_m   = radius_meters
WHERE center_lat IS NULL;

-- Keep alias columns in sync via trigger
CREATE OR REPLACE FUNCTION public.sync_apprentice_site_aliases()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.center_lat  := COALESCE(NEW.center_lat,  NEW.latitude);
  NEW.center_lng  := COALESCE(NEW.center_lng,  NEW.longitude);
  NEW.radius_m    := COALESCE(NEW.radius_m,    NEW.radius_meters);
  NEW.latitude    := COALESCE(NEW.latitude,    NEW.center_lat);
  NEW.longitude   := COALESCE(NEW.longitude,   NEW.center_lng);
  NEW.radius_meters := COALESCE(NEW.radius_meters, NEW.radius_m);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_apprentice_site_aliases ON public.apprentice_sites;
CREATE TRIGGER trg_sync_apprentice_site_aliases
  BEFORE INSERT OR UPDATE ON public.apprentice_sites
  FOR EACH ROW EXECUTE FUNCTION public.sync_apprentice_site_aliases();

-- shop_id column used by context route
ALTER TABLE public.apprentice_sites
  ADD COLUMN IF NOT EXISTS shop_id UUID;

COMMENT ON TABLE public.apprentice_sites IS
  'GPS geofence definitions for apprenticeship worksites. Canonical columns: latitude, longitude, radius_meters. Alias columns center_lat/center_lng/radius_m kept for backward compat.';
