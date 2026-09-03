-- Add geocoding columns to shops table for distance-based routing

ALTER TABLE shops ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS geocode_source VARCHAR(20); -- 'google', 'mapbox', 'manual'

-- Index for spatial queries
CREATE INDEX IF NOT EXISTS idx_shops_coords ON shops (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Track geocoding failures
ALTER TABLE shops ADD COLUMN IF NOT EXISTS geocode_failed_at TIMESTAMPTZ;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS geocode_error TEXT;

COMMENT ON COLUMN shops.latitude IS 'Latitude coordinate for distance calculations';
COMMENT ON COLUMN shops.longitude IS 'Longitude coordinate for distance calculations';
COMMENT ON COLUMN shops.geocode_source IS 'Source of geocoding: google, mapbox, or manual';
