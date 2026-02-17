/**
 * Geocoding Utility
 * 
 * Converts addresses to lat/lng coordinates.
 * Uses OpenStreetMap Nominatim API (free, no API key required).
 * 
 * USAGE:
 * - Call geocodeAddress() when a partner is created/updated
 * - Store lat/lng in partners table
 * - Never geocode per-request (expensive and slow)
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export interface GeocodingResult {
  success: boolean;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
  error?: string;
}

/**
 * Geocode an address using OpenStreetMap Nominatim.
 * Rate limited to 1 request per second by Nominatim policy.
 */
export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zip: string
): Promise<GeocodingResult> {
  const fullAddress = `${address}, ${city}, ${state} ${zip}, USA`;
  
  try {
    const encodedAddress = encodeURIComponent(fullAddress);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ElevateForHumanity-LMS/1.0 (contact@elevateforhumanity.org)',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Geocoding API error: ${response.status}`,
      };
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'Address not found',
      };
    }

    const result = data[0];
    return {
      success: true,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      formattedAddress: result.display_name,
    };
  } catch (error) {
    logger.error('[Geocoding] Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Geocode a partner and update their record.
 */
export async function geocodePartner(partnerId: string): Promise<GeocodingResult> {
  const supabase = createAdminClient();

  // Get partner address
  const { data: partner, error: fetchError } = await supabase
    .from('partners')
    .select('address_line1, city, state, zip')
    .eq('id', partnerId)
    .single();

  if (fetchError || !partner) {
    return {
      success: false,
      error: 'Partner not found',
    };
  }

  if (!partner.address_line1 || !partner.city || !partner.state || !partner.zip) {
    return {
      success: false,
      error: 'Incomplete address',
    };
  }

  // Geocode
  const result = await geocodeAddress(
    partner.address_line1,
    partner.city,
    partner.state,
    partner.zip
  );

  if (!result.success) {
    return result;
  }

  // Update partner with coordinates
  const { error: updateError } = await supabase
    .from('partners')
    .update({
      lat: result.lat,
      lng: result.lng,
      geocoded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', partnerId);

  if (updateError) {
    return {
      success: false,
      error: `Failed to update partner: ${updateError.message}`,
    };
  }

  logger.info('[Geocoding] Partner geocoded', {
    partnerId,
    lat: result.lat,
    lng: result.lng,
  });

  return result;
}

/**
 * Batch geocode all partners missing coordinates.
 * Respects Nominatim rate limit (1 req/sec).
 */
export async function geocodeAllPartners(): Promise<{
  total: number;
  success: number;
  failed: number;
  errors: Array<{ partnerId: string; error: string }>;
}> {
  const supabase = createAdminClient();

  // Get partners without coordinates
  const { data: partners } = await supabase
    .from('partners')
    .select('id, name')
    .is('lat', null)
    .not('address_line1', 'is', null)
    .limit(100); // Process in batches

  if (!partners || partners.length === 0) {
    return { total: 0, success: 0, failed: 0, errors: [] };
  }

  const errors: Array<{ partnerId: string; error: string }> = [];
  let success = 0;

  for (const partner of partners) {
    const result = await geocodePartner(partner.id);
    
    if (result.success) {
      success++;
    } else {
      errors.push({ partnerId: partner.id, error: result.error || 'Unknown error' });
    }

    // Rate limit: wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1100));
  }

  return {
    total: partners.length,
    success,
    failed: errors.length,
    errors,
  };
}

/**
 * Admin fallback: manually set coordinates for a partner.
 */
export async function setPartnerCoordinates(
  partnerId: string,
  lat: number,
  lng: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('partners')
    .update({
      lat,
      lng,
      geocoded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', partnerId);

  if (error) {
    return { success: false, error: error.message };
  }

  logger.info('[Geocoding] Partner coordinates set manually', {
    partnerId,
    lat,
    lng,
  });

  return { success: true };
}
