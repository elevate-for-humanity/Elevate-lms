import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const MAX_ACCURACY_M = 50;
const LUNCH_DURATION_MINUTES = 60;

type TimeclockAction = 'clock_in' | 'lunch_start' | 'lunch_end' | 'clock_out';

interface ActionPayload {
  action: TimeclockAction;
  apprentice_id: string;
  partner_id: string;
  program_id: string;
  site_id: string;
  progress_entry_id?: string;
  lat: number;
  lng: number;
  accuracy_m?: number;
}

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

/**
 * Log admin alert for compliance violations
 */
async function raiseAdminAlert(
  supabase: any,
  alertType: string,
  details: Record<string, any>
) {
  try {
    await supabase.from('admin_alerts').insert({
      alert_type: alertType,
      severity: 'warning',
      details,
      created_at: new Date().toISOString(),
      resolved: false,
    });
  } catch (error) {
    logger.error('[Timeclock] Failed to raise admin alert:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body: ActionPayload = await request.json();
    const {
      action,
      apprentice_id,
      partner_id,
      program_id,
      site_id,
      progress_entry_id,
      lat,
      lng,
      accuracy_m,
    } = body;

    // Validate required fields
    if (!action || !apprentice_id || !partner_id || !program_id || !site_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'GPS coordinates required' },
        { status: 400 }
      );
    }

    // Validate GPS accuracy
    if (accuracy_m && accuracy_m > MAX_ACCURACY_M) {
      return NextResponse.json(
        { error: 'GPS accuracy too low', accuracy_m, max_allowed: MAX_ACCURACY_M },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Load site geofence
    const { data: site, error: siteError } = await supabase
      .from('partner_sites')
      .select('id, center_lat, center_lng, radius_m, name')
      .eq('id', site_id)
      .single();

    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Validate inside geofence
    const distance = haversineDistance(lat, lng, site.center_lat, site.center_lng);
    const withinGeofence = distance <= site.radius_m;

    if (!withinGeofence) {
      // Raise admin alert for attempted action outside geofence
      await raiseAdminAlert(supabase, 'geofence_violation', {
        apprentice_id,
        site_id,
        site_name: site.name,
        action,
        distance_m: Math.round(distance),
        radius_m: site.radius_m,
        lat,
        lng,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          error: 'Outside geofence',
          distance_m: Math.round(distance),
          radius_m: site.radius_m,
        },
        { status: 403 }
      );
    }

    // Server time only - never trust client
    const serverNow = new Date().toISOString();
    const serverDate = serverNow.split('T')[0];

    // Calculate week_ending (Saturday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
    const weekEnding = new Date(today);
    weekEnding.setDate(today.getDate() + daysUntilSaturday);
    const weekEndingStr = weekEnding.toISOString().split('T')[0];

    switch (action) {
      case 'clock_in': {
        // Insert new progress_entries row
        const { data: newEntry, error: insertError } = await supabase
          .from('progress_entries')
          .insert({
            apprentice_id,
            partner_id,
            program_id,
            site_id,
            work_date: serverDate,
            week_ending: weekEndingStr,
            clock_in_at: serverNow,
            status: 'submitted',
            auto_clocked_out: false,
          })
          .select('id')
          .single();

        if (insertError) {
          logger.error('[Timeclock] clock_in insert error:', insertError);
          return NextResponse.json(
            { error: 'Failed to clock in', details: 'Database error' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          action: 'clock_in',
          progress_entry_id: newEntry.id,
          clock_in_at: serverNow,
        });
      }

      case 'lunch_start': {
        if (!progress_entry_id) {
          return NextResponse.json(
            { error: 'progress_entry_id required for lunch_start' },
            { status: 400 }
          );
        }

        // Verify open shift exists
        const { data: entry, error: entryError } = await supabase
          .from('progress_entries')
          .select('id, clock_in_at, clock_out_at, lunch_start_at')
          .eq('id', progress_entry_id)
          .single();

        if (entryError || !entry) {
          return NextResponse.json(
            { error: 'Progress entry not found' },
            { status: 404 }
          );
        }

        if (entry.clock_out_at) {
          return NextResponse.json(
            { error: 'Shift already closed' },
            { status: 400 }
          );
        }

        if (entry.lunch_start_at) {
          return NextResponse.json(
            { error: 'Lunch already started' },
            { status: 400 }
          );
        }

        const { error: updateError } = await supabase
          .from('progress_entries')
          .update({ lunch_start_at: serverNow })
          .eq('id', progress_entry_id);

        if (updateError) {
          return NextResponse.json(
            { error: 'Failed to start lunch' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          action: 'lunch_start',
          progress_entry_id,
          lunch_start_at: serverNow,
        });
      }

      case 'lunch_end': {
        if (!progress_entry_id) {
          return NextResponse.json(
            { error: 'progress_entry_id required for lunch_end' },
            { status: 400 }
          );
        }

        // Verify lunch was started
        const { data: entry, error: entryError } = await supabase
          .from('progress_entries')
          .select('id, clock_in_at, clock_out_at, lunch_start_at, lunch_end_at')
          .eq('id', progress_entry_id)
          .single();

        if (entryError || !entry) {
          return NextResponse.json(
            { error: 'Progress entry not found' },
            { status: 404 }
          );
        }

        if (!entry.lunch_start_at) {
          return NextResponse.json(
            { error: 'Lunch not started' },
            { status: 400 }
          );
        }

        if (entry.lunch_end_at) {
          return NextResponse.json(
            { error: 'Lunch already ended' },
            { status: 400 }
          );
        }

        // Check lunch duration
        const lunchStart = new Date(entry.lunch_start_at);
        const lunchEnd = new Date(serverNow);
        const lunchMinutes = (lunchEnd.getTime() - lunchStart.getTime()) / (1000 * 60);

        const { error: updateError } = await supabase
          .from('progress_entries')
          .update({ lunch_end_at: serverNow })
          .eq('id', progress_entry_id);

        if (updateError) {
          return NextResponse.json(
            { error: 'Failed to end lunch' },
            { status: 500 }
          );
        }

        // Raise alert if lunch exceeded standard duration
        if (lunchMinutes > LUNCH_DURATION_MINUTES) {
          await raiseAdminAlert(supabase, 'excessive_lunch', {
            apprentice_id,
            progress_entry_id,
            lunch_minutes: Math.round(lunchMinutes),
            standard_minutes: LUNCH_DURATION_MINUTES,
            timestamp: serverNow,
          });
        }

        return NextResponse.json({
          success: true,
          action: 'lunch_end',
          progress_entry_id,
          lunch_end_at: serverNow,
          lunch_duration_minutes: Math.round(lunchMinutes),
          exceeded_standard: lunchMinutes > LUNCH_DURATION_MINUTES,
        });
      }

      case 'clock_out': {
        if (!progress_entry_id) {
          return NextResponse.json(
            { error: 'progress_entry_id required for clock_out' },
            { status: 400 }
          );
        }

        // Verify open shift exists
        const { data: entry, error: entryError } = await supabase
          .from('progress_entries')
          .select('id, clock_in_at, clock_out_at, lunch_start_at, lunch_end_at')
          .eq('id', progress_entry_id)
          .single();

        if (entryError || !entry) {
          return NextResponse.json(
            { error: 'Progress entry not found' },
            { status: 404 }
          );
        }

        if (entry.clock_out_at) {
          return NextResponse.json(
            { error: 'Already clocked out' },
            { status: 400 }
          );
        }

        // Check for missing lunch after 6 hours
        const clockIn = new Date(entry.clock_in_at);
        const clockOut = new Date(serverNow);
        const shiftHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

        if (shiftHours >= 6 && !entry.lunch_start_at) {
          await raiseAdminAlert(supabase, 'missing_lunch', {
            apprentice_id,
            progress_entry_id,
            shift_hours: Math.round(shiftHours * 10) / 10,
            timestamp: serverNow,
          });
        }

        // DB trigger will derive hours_worked and enforce weekly cap
        const { error: updateError } = await supabase
          .from('progress_entries')
          .update({ clock_out_at: serverNow })
          .eq('id', progress_entry_id);

        if (updateError) {
          return NextResponse.json(
            { error: 'Failed to clock out' },
            { status: 500 }
          );
        }

        // Reload to get derived hours
        const { data: updatedEntry } = await supabase
          .from('progress_entries')
          .select('hours_worked')
          .eq('id', progress_entry_id)
          .single();

        return NextResponse.json({
          success: true,
          action: 'clock_out',
          progress_entry_id,
          clock_out_at: serverNow,
          hours_worked: updatedEntry?.hours_worked || null,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('[Timeclock] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
