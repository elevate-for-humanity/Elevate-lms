import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const MAX_ACCURACY_M = 50;

/**
 * Haversine formula to calculate distance between two GPS coordinates
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { progress_entry_id, lat, lng, accuracy_m } = body;

    // Validate payload
    if (!progress_entry_id || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: progress_entry_id, lat, lng' },
        { status: 400 }
      );
    }

    // Reject low-accuracy GPS readings
    if (accuracy_m && accuracy_m > MAX_ACCURACY_M) {
      return NextResponse.json(
        { error: 'GPS accuracy too low', accuracy_m, max_allowed: MAX_ACCURACY_M },
        { status: 400 }
      );
    }

    // Verify authenticated user
    const authClient = await createClient();
    if (!authClient) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }
    
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Load progress_entries row with apprentice ownership check
    const { data: entry, error: entryError } = await supabase
      .from('progress_entries')
      .select(`
        id, clock_in_at, clock_out_at, site_id, auto_clocked_out, auto_clock_out_reason,
        apprentice_id,
        apprentices!inner(user_id)
      `)
      .eq('id', progress_entry_id)
      .single();
    
    // Verify user owns this entry via apprentice relationship
    if (entry && entry.apprentices && (entry.apprentices as any).user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: entry does not belong to you' },
        { status: 403 }
      );
    }

    if (entryError || !entry) {
      return NextResponse.json(
        { error: 'Progress entry not found' },
        { status: 404 }
      );
    }

    // If already clocked out, return closed status
    if (entry.clock_out_at) {
      return NextResponse.json({
        closed: true,
        clock_out_at: entry.clock_out_at,
        auto_clocked_out: entry.auto_clocked_out,
        auto_clock_out_reason: entry.auto_clock_out_reason,
      });
    }

    // Load site geofence
    const { data: site, error: siteError } = await supabase
      .from('partner_sites')
      .select('id, center_lat, center_lng, radius_m')
      .eq('id', entry.site_id)
      .single();

    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Site geofence not found' },
        { status: 404 }
      );
    }

    // Compute within_geofence using haversine
    const distance = haversineDistance(lat, lng, site.center_lat, site.center_lng);
    const withinGeofence = distance <= site.radius_m;

    // Call update_geofence_state DB function
    const { error: geofenceError } = await supabase.rpc('update_geofence_state', {
      progress_entry_id,
      within_geofence: withinGeofence,
      seen_at: new Date().toISOString(),
    });

    if (geofenceError) {
      logger.error('[Heartbeat] update_geofence_state error:', geofenceError);
    }

    // Call auto_clock_out_if_needed DB function
    const { error: autoClockError } = await supabase.rpc('auto_clock_out_if_needed', {
      progress_entry_id,
      now: new Date().toISOString(),
    });

    if (autoClockError) {
      logger.error('[Heartbeat] auto_clock_out_if_needed error:', autoClockError);
    }

    // Reload row to get updated state
    const { data: updatedEntry, error: reloadError } = await supabase
      .from('progress_entries')
      .select('clock_out_at, auto_clocked_out, auto_clock_out_reason')
      .eq('id', progress_entry_id)
      .single();

    if (reloadError) {
      return NextResponse.json(
        { error: 'Failed to reload entry state' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      within_geofence: withinGeofence,
      distance_m: Math.round(distance),
      auto_clocked_out: updatedEntry?.auto_clocked_out || false,
      clock_out_at: updatedEntry?.clock_out_at || null,
      auto_clock_out_reason: updatedEntry?.auto_clock_out_reason || null,
    });
  } catch (error) {
    logger.error('[Heartbeat] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
