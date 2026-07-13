-- GPS-Enforced Timeclock System for Apprentices
-- Indiana-compliant apprenticeship timekeeping with geofence enforcement

BEGIN;

-- ===========================================
-- PART 1: Add timeclock columns to progress_entries
-- ===========================================

-- Clock in/out timestamps
ALTER TABLE progress_entries 
ADD COLUMN IF NOT EXISTS clock_in_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS clock_out_at TIMESTAMPTZ;

-- Lunch tracking
ALTER TABLE progress_entries 
ADD COLUMN IF NOT EXISTS lunch_start_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS lunch_end_at TIMESTAMPTZ;

-- Site/geofence tracking
ALTER TABLE progress_entries 
ADD COLUMN IF NOT EXISTS site_id UUID,
ADD COLUMN IF NOT EXISTS last_known_lat DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS last_known_lng DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS last_location_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS outside_geofence_since TIMESTAMPTZ;

-- Auto clock-out tracking
ALTER TABLE progress_entries 
ADD COLUMN IF NOT EXISTS auto_clocked_out BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_clock_out_reason TEXT;

-- Weekly cap enforcement
ALTER TABLE progress_entries 
ADD COLUMN IF NOT EXISTS max_hours_per_week DECIMAL(5,2) DEFAULT 40.00;

-- ===========================================
-- PART 2: Sites table for geofence definitions
-- ===========================================

CREATE TABLE IF NOT EXISTS apprentice_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  
  -- Geofence center point
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  
  -- Geofence radius in meters
  radius_meters INTEGER NOT NULL DEFAULT 100,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE apprentice_sites ADD COLUMN IF NOT EXISTS partner_id UUID;
CREATE INDEX IF NOT EXISTS idx_apprentice_sites_partner ON apprentice_sites(partner_id);

ALTER TABLE apprentice_sites ENABLE ROW LEVEL SECURITY;

-- FK from progress_entries.site_id skipped: no sites table exists yet
-- Will be added when the sites table is created

-- ===========================================
-- PART 3: Geofence check function
-- ===========================================

-- Haversine distance calculation (returns meters)
DROP FUNCTION IF EXISTS calculate_distance_meters(DECIMAL, DECIMAL, DECIMAL, DECIMAL);
CREATE OR REPLACE FUNCTION calculate_distance_meters(
  lat1 DECIMAL, lng1 DECIMAL,
  lat2 DECIMAL, lng2 DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  R CONSTANT DECIMAL := 6371000; -- Earth radius in meters
  dlat DECIMAL;
  dlng DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2) * sin(dlng/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN R * c;
END;
$$;

-- Check if coordinates are within a site's geofence
DROP FUNCTION IF EXISTS is_within_geofence(uuid, numeric, numeric);
CREATE OR REPLACE FUNCTION is_within_geofence(
  p_site_id UUID,
  p_lat DECIMAL,
  p_lng DECIMAL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_site apprentice_sites%ROWTYPE;
  v_distance DECIMAL;
BEGIN
  SELECT * INTO v_site FROM apprentice_sites WHERE id = p_site_id AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  v_distance := calculate_distance_meters(p_lat, p_lng, v_site.latitude, v_site.longitude);
  
  RETURN v_distance <= v_site.radius_meters;
END;
$$;

-- ===========================================
-- PART 4: Update geofence state function
-- ===========================================

DROP FUNCTION IF EXISTS update_geofence_state(uuid, numeric, numeric, integer);
CREATE OR REPLACE FUNCTION update_geofence_state(
  p_entry_id UUID,
  p_lat DECIMAL,
  p_lng DECIMAL
)
RETURNS TABLE(
  within_geofence BOOLEAN,
  outside_since TIMESTAMPTZ,
  auto_clocked_out BOOLEAN,
  clock_out_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry progress_entries%ROWTYPE;
  v_within BOOLEAN;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- Get current entry
  SELECT * INTO v_entry FROM progress_entries WHERE id = p_entry_id;
  
  IF NOT FOUND OR v_entry.clock_out_at IS NOT NULL THEN
    -- Already clocked out
    RETURN QUERY SELECT false, NULL::TIMESTAMPTZ, v_entry.auto_clocked_out, v_entry.clock_out_at;
    RETURN;
  END IF;
  
  -- Check geofence
  v_within := is_within_geofence(v_entry.site_id, p_lat, p_lng);
  
  -- Update location
  UPDATE progress_entries SET
    last_known_lat = p_lat,
    last_known_lng = p_lng,
    last_location_at = v_now
  WHERE id = p_entry_id;
  
  IF v_within THEN
    -- Inside geofence - clear outside timer
    UPDATE progress_entries SET outside_geofence_since = NULL WHERE id = p_entry_id;
    RETURN QUERY SELECT true, NULL::TIMESTAMPTZ, false, NULL::TIMESTAMPTZ;
  ELSE
    -- Outside geofence
    IF v_entry.outside_geofence_since IS NULL THEN
      -- Just left - start timer
      UPDATE progress_entries SET outside_geofence_since = v_now WHERE id = p_entry_id;
      RETURN QUERY SELECT false, v_now, false, NULL::TIMESTAMPTZ;
    ELSE
      -- Already outside - check if 15 minutes exceeded
      IF v_now - v_entry.outside_geofence_since >= interval '15 minutes' THEN
        -- Auto clock-out
        UPDATE progress_entries SET
          clock_out_at = v_now,
          auto_clocked_out = true,
          auto_clock_out_reason = 'Left site geofence for more than 15 minutes',
          hours_worked = EXTRACT(EPOCH FROM (v_now - clock_in_at)) / 3600.0
        WHERE id = p_entry_id;
        
        RETURN QUERY SELECT false, v_entry.outside_geofence_since, true, v_now;
      ELSE
        -- Still in grace period
        RETURN QUERY SELECT false, v_entry.outside_geofence_since, false, NULL::TIMESTAMPTZ;
      END IF;
    END IF;
  END IF;
END;
$$;

-- ===========================================
-- PART 5: Auto clock-out check function
-- ===========================================

DROP FUNCTION IF EXISTS auto_clock_out_if_needed(integer);
CREATE OR REPLACE FUNCTION auto_clock_out_if_needed(p_entry_id UUID)
RETURNS TABLE(
  was_clocked_out BOOLEAN,
  clock_out_at TIMESTAMPTZ,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry progress_entries%ROWTYPE;
  v_now TIMESTAMPTZ := now();
BEGIN
  SELECT * INTO v_entry FROM progress_entries WHERE id = p_entry_id;
  
  IF NOT FOUND OR v_entry.clock_out_at IS NOT NULL THEN
    RETURN QUERY SELECT false, v_entry.clock_out_at, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if outside geofence for 15+ minutes
  IF v_entry.outside_geofence_since IS NOT NULL 
     AND v_now - v_entry.outside_geofence_since >= interval '15 minutes' THEN
    
    UPDATE progress_entries SET
      clock_out_at = v_now,
      auto_clocked_out = true,
      auto_clock_out_reason = 'Left site geofence for more than 15 minutes',
      hours_worked = EXTRACT(EPOCH FROM (v_now - clock_in_at)) / 3600.0
    WHERE id = p_entry_id;
    
    RETURN QUERY SELECT true, v_now, 'Left site geofence for more than 15 minutes'::TEXT;
  ELSE
    RETURN QUERY SELECT false, NULL::TIMESTAMPTZ, NULL::TEXT;
  END IF;
END;
$$;

-- ===========================================
-- PART 6: Hours derivation trigger
-- ===========================================

CREATE OR REPLACE FUNCTION derive_hours_worked()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_lunch_duration INTERVAL;
BEGIN
  -- Only calculate if both clock in and out are set
  IF NEW.clock_in_at IS NOT NULL AND NEW.clock_out_at IS NOT NULL THEN
    -- Calculate lunch duration if taken
    IF NEW.lunch_start_at IS NOT NULL AND NEW.lunch_end_at IS NOT NULL THEN
      v_lunch_duration := NEW.lunch_end_at - NEW.lunch_start_at;
    ELSE
      v_lunch_duration := interval '0';
    END IF;
    
    -- Derive hours worked (total time minus lunch)
    NEW.hours_worked := EXTRACT(EPOCH FROM (NEW.clock_out_at - NEW.clock_in_at - v_lunch_duration)) / 3600.0;
    
    -- Ensure non-negative
    IF NEW.hours_worked < 0 THEN
      NEW.hours_worked := 0;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_derive_hours_worked ON progress_entries;
CREATE TRIGGER trigger_derive_hours_worked
BEFORE INSERT OR UPDATE ON progress_entries
FOR EACH ROW
EXECUTE FUNCTION derive_hours_worked();

-- ===========================================
-- PART 7: Weekly cap enforcement
-- ===========================================

CREATE OR REPLACE FUNCTION get_weekly_hours(
  p_apprentice_id UUID,
  p_week_ending DATE
)
RETURNS DECIMAL
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total DECIMAL;
BEGIN
  SELECT COALESCE(SUM(hours_worked), 0) INTO v_total
  FROM progress_entries
  WHERE apprentice_id = p_apprentice_id
    AND week_ending = p_week_ending
    AND clock_out_at IS NOT NULL;
  
  RETURN v_total;
END;
$$;

-- ===========================================
-- PART 8: RLS policies for sites
-- ===========================================

-- Partners can view their own sites
DROP POLICY IF EXISTS "Partner users can view own sites" ON apprentice_sites;
CREATE POLICY "Partner users can view own sites"
  ON apprentice_sites FOR SELECT
  USING (
    partner_id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Admins can manage sites
DROP POLICY IF EXISTS "Admins can manage sites" ON apprentice_sites;
CREATE POLICY "Admins can manage sites"
  ON apprentice_sites FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ===========================================
-- PART 9: Indexes for performance
-- ===========================================

ALTER TABLE progress_entries ADD COLUMN IF NOT EXISTS clock_in_at TEXT;
CREATE INDEX IF NOT EXISTS idx_progress_entries_clock_in ON progress_entries(clock_in_at);
ALTER TABLE progress_entries ADD COLUMN IF NOT EXISTS clock_out_at TEXT;
CREATE INDEX IF NOT EXISTS idx_progress_entries_clock_out ON progress_entries(clock_out_at);
ALTER TABLE progress_entries ADD COLUMN IF NOT EXISTS site_id UUID;
CREATE INDEX IF NOT EXISTS idx_progress_entries_site ON progress_entries(site_id);
ALTER TABLE progress_entries ADD COLUMN IF NOT EXISTS auto_clocked_out TEXT;
CREATE INDEX IF NOT EXISTS idx_progress_entries_auto_clocked ON progress_entries(auto_clocked_out) WHERE auto_clocked_out = true;

COMMIT;
