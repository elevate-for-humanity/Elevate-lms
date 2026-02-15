import { logger } from '@/lib/logger';
/**
 * Geocoding utilities with Google Maps primary and Mapbox fallback.
 * Used for shop address geocoding and distance calculations.
 */

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  source: 'google' | 'mapbox' | 'manual';
  formattedAddress?: string;
}

export interface GeocodingError {
  error: string;
  source: 'google' | 'mapbox';
}

/**
 * Geocode an address using Google Maps API.
 */
async function geocodeWithGoogle(address: string): Promise<GeocodingResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    logger.warn('[geocode] GOOGLE_MAPS_API_KEY not configured');
    return null;
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', address);
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === 'OK' && data.results?.[0]) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
        source: 'google',
        formattedAddress: data.results[0].formatted_address,
      };
    }

    logger.warn('[geocode] Google returned status:', data.status);
    return null;
  } catch (error) {
    logger.error('[geocode] Google API error:', error);
    return null;
  }
}

/**
 * Geocode an address using Mapbox API.
 */
async function geocodeWithMapbox(address: string): Promise<GeocodingResult | null> {
  const accessToken = process.env.MAPBOX_ACCESS_TOKEN;
  if (!accessToken) {
    logger.warn('[geocode] MAPBOX_ACCESS_TOKEN not configured');
    return null;
  }

  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${accessToken}&country=US&limit=1`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.features?.[0]) {
      const [lng, lat] = data.features[0].center;
      return {
        latitude: lat,
        longitude: lng,
        source: 'mapbox',
        formattedAddress: data.features[0].place_name,
      };
    }

    logger.warn('[geocode] Mapbox returned no results');
    return null;
  } catch (error) {
    logger.error('[geocode] Mapbox API error:', error);
    return null;
  }
}

/**
 * Geocode an address with Google primary and Mapbox fallback.
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | GeocodingError> {
  if (!address || address.trim().length < 5) {
    return { error: 'Invalid address', source: 'google' };
  }

  // Try Google first
  const googleResult = await geocodeWithGoogle(address);
  if (googleResult) {
    return googleResult;
  }

  // Fallback to Mapbox
  const mapboxResult = await geocodeWithMapbox(address);
  if (mapboxResult) {
    return mapboxResult;
  }

  return { error: 'Geocoding failed with all providers', source: 'mapbox' };
}

/**
 * Build a full address string from components.
 */
export function buildAddressString(components: {
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
}): string {
  const parts = [
    components.address1,
    components.address2,
    components.city,
    components.state,
    components.zip,
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Calculate distance between two coordinates using Haversine formula.
 * Returns distance in miles.
 */
export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if geocoding result is valid.
 */
export function isGeocodingResult(result: GeocodingResult | GeocodingError): result is GeocodingResult {
  return 'latitude' in result && 'longitude' in result;
}
