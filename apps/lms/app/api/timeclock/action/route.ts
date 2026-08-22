import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { checkBarberSuspension } from '@/lib/barber/suspension';
import { sendEmail } from '@/lib/email/service';
import { emitEvent } from '@/lib/events/emit';
import { syncProgressEntryToHourEntries } from '@/lib/timeclock/sync-to-hour-entries';

const MAX_ACCURACY_M = 50;
const LUNCH_DURATION_MINUTES = 60;
const MAX_OFFLINE_EVENT_AGE_MS = 72 * 60 * 60 * 1000;
const MAX_CLIENT_CLOCK_SKEW_MS = 5 * 60 * 1000;
const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

type TimeclockAction = 'clock_in' | 'lunch_start' | 'lunch_end' | 'clock_out';

type ActionPayload = {
  action: TimeclockAction;
  apprentice_id?: string;
  program_id?: string;
  site_id: string;
  progress_entry_id?: string;
  lat: number;
  lng: number;
  accuracy_m?: number;
  offline_replay?: boolean;
  client_shift_id?: string;
  client_recorded_at?: string;
};

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusM = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return earthRadiusM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function writeComplianceAlert(
  db: any,
  alertType: string,
  details: Record<string, unknown>,
) {
  const message =
    alertType === 'geofence_violation'
      ? `Geofence violation: ${details.distance_m}m from ${details.site_name ?? 'site'} (allowed ${details.radius_m}m) during ${details.action}`
      : alertType === 'missing_lunch'
        ? `No lunch break recorded for ${details.shift_hours}h shift`
        : alertType === 'excessive_lunch'
          ? `Lunch exceeded standard: ${details.lunch_minutes}min (standard ${details.standard_minutes}min)`
          : alertType.replace(/_/g, ' ');

  const { error } = await db.from('admin_alerts').insert({
    alert_type: alertType,
    severity: 'warning',
    apprentice_id: details.apprentice_id ?? null,
    progress_entry_id: details.progress_entry_id ?? null,
    site_id: details.site_id ?? null,
    message,
    metadata: details,
    created_at: new Date().toISOString(),
  });

  if (error) logger.error('[Timeclock] compliance alert insert failed', error);
}

async function emitGeofenceEvidence(params: {
  userId: string;
  apprenticeId: string;
  progressEntryId?: string | null;
  siteId: string;
  siteName: string | null;
  action: TimeclockAction;
  lat: number;
  lng: number;
  accuracyM: number | null;
  distanceM: number;
  radiusM: number;
  accepted: boolean;
  offlineReplay?: boolean;
  clientRecordedAt?: string | null;
  clientShiftId?: string | null;
}) {
  const eventType = params.accepted
    ? 'timeclock.geofence_verified'
    : 'timeclock.geofence_violation';

  await emitEvent(eventType, 'compliance', {
    severity: params.accepted ? 'info' : 'warning',
    actor_type: 'user',
    actor_id: params.userId,
    subject_id: params.progressEntryId ?? params.siteId,
    subject_type: params.progressEntryId ? 'progress_entry' : 'apprentice_site',
    payload: {
      apprentice_id: params.apprenticeId,
      progress_entry_id: params.progressEntryId ?? null,
      site_id: params.siteId,
      site_name: params.siteName,
      action: params.action,
      lat: params.lat,
      lng: params.lng,
      accuracy_m: params.accuracyM,
      distance_m: params.distanceM,
      radius_m: params.radiusM,
      accepted: params.accepted,
      offline_replay: Boolean(params.offlineReplay),
      client_recorded_at: params.clientRecordedAt ?? null,
      client_shift_id: params.clientShiftId ?? null,
      evaluated_at: new Date().toISOString(),
    },
    message: params.accepted
      ? `Geofence verified: ${params.distanceM}m from ${params.siteName ?? 'site'} during ${params.action}`
      : `Geofence violation: ${params.distanceM}m from ${params.siteName ?? 'site'} during ${params.action}`,
  }).catch((error) => logger.warn('[Timeclock] geofence event emission failed', error));
}

async function notifyClockIn(
  db: any,
  params: { entryId: string; userId: string; siteName: string | null; clockInAt: string },
) {
  await db
    .from('notifications')
    .insert({
      user_id: params.userId,
      type: 'timeclock',
      title: 'Clock-in recorded',
      message: `Your clock-in was recorded${params.siteName ? ` at ${params.siteName}` : ''}.`,
      action_label: 'View timeclock',
      action_url: '/apprentice/timeclock',
      link: '/apprentice/timeclock',
      read: false,
      metadata: {
        progress_entry_id: params.entryId,
        site_name: params.siteName,
        clock_in_at: params.clockInAt,
      },
      idempotency_key: `timeclock-clock-in-${params.entryId}-${params.userId}`,
    })
    .then(() => {}, () => {});
}

function validateCoordinates(lat: number, lng: number, accuracyM?: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return 'Valid GPS coordinates are required';
  }
  if (accuracyM !== undefined && (!Number.isFinite(accuracyM) || accuracyM < 0 || accuracyM > MAX_ACCURACY_M)) {
    return `GPS accuracy must be between 0 and ${MAX_ACCURACY_M} meters`;
  }
  return null;
}

function resolveActionTimestamp(body: ActionPayload, serverNowMs: number) {
  if (!body.offline_replay) return { value: new Date(serverNowMs).toISOString(), error: null as string | null };
  if (!body.client_shift_id || !body.client_recorded_at) {
    return { value: '', error: 'Offline replay requires client_shift_id and client_recorded_at' };
  }
  const clientMs = Date.parse(body.client_recorded_at);
  if (!Number.isFinite(clientMs)) return { value: '', error: 'Invalid client_recorded_at' };
  if (clientMs > serverNowMs + MAX_CLIENT_CLOCK_SKEW_MS) {
    return { value: '', error: 'Offline event timestamp is too far in the future' };
  }
  if (serverNowMs - clientMs > MAX_OFFLINE_EVENT_AGE_MS) {
    return { value: '', error: 'Offline event is too old to replay automatically' };
  }
  return { value: new Date(clientMs).toISOString(), error: null as string | null };
}

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = (await request.json()) as ActionPayload;
    const {
      action,
      apprentice_id,
      program_id,
      site_id,
      progress_entry_id,
      lat,
      lng,
      accuracy_m,
      offline_replay = false,
      client_shift_id,
      client_recorded_at,
    } = body;

    if (!['clock_in', 'lunch_start', 'lunch_end', 'clock_out'].includes(action) || !site_id) {
      return NextResponse.json({ error: 'Valid action and site_id are required' }, { status: 400 });
    }

    const coordinateError = validateCoordinates(lat, lng, accuracy_m);
    if (coordinateError) {
      return NextResponse.json({ error: coordinateError }, { status: 400 });
    }

    const serverNowMs = Date.now();
    const actionTimestamp = resolveActionTimestamp(body, serverNowMs);
    if (actionTimestamp.error) {
      return NextResponse.json({ error: actionTimestamp.error }, { status: 400 });
    }
    const actionAt = actionTimestamp.value;

    const authClient = await createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await requireAdminClient();
    if (!db) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const suspended = await checkBarberSuspension(user.id, db);
    if (suspended) return suspended;

    const { data: apprentice } = await db
      .from('apprentices')
      .select('id, employer_id, shop_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!apprentice) {
      return NextResponse.json({ error: 'No active apprentice profile found' }, { status: 403 });
    }
    if (apprentice_id && apprentice_id !== apprentice.id) {
      return NextResponse.json({ error: 'Forbidden: apprentice_id does not match authenticated user' }, { status: 403 });
    }

    let resolvedProgramId = program_id ?? null;
    if (!resolvedProgramId) {
      const { data: enrollment } = await db
        .from('program_enrollments')
        .select('program_id')
        .eq('user_id', user.id)
        .in('status', ['active', 'enrolled', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      resolvedProgramId = enrollment?.program_id ?? null;
    }
    if (!resolvedProgramId) {
      return NextResponse.json({ error: 'No active enrollment found to determine program_id' }, { status: 400 });
    }

    const { data: site, error: siteError } = await db
      .from('apprentice_sites')
      .select('id, latitude, longitude, radius_meters, name, shop_id')
      .eq('id', site_id)
      .maybeSingle();
    if (siteError || !site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

    const assignedShopId = apprentice.shop_id || apprentice.employer_id;
    if (assignedShopId && site.shop_id !== assignedShopId) {
      return NextResponse.json({ error: 'Forbidden: selected site is not assigned to apprentice' }, { status: 403 });
    }

    const distanceM = Math.round(haversineDistance(lat, lng, Number(site.latitude), Number(site.longitude)));
    const radiusM = Number(site.radius_meters);
    const accepted = distanceM <= radiusM;

    if (!accepted) {
      const details = {
        apprentice_id: apprentice.id,
        progress_entry_id: progress_entry_id ?? null,
        site_id,
        site_name: site.name,
        action,
        distance_m: distanceM,
        radius_m: radiusM,
        lat,
        lng,
        accuracy_m: accuracy_m ?? null,
        offline_replay,
        client_recorded_at: client_recorded_at ?? null,
        client_shift_id: client_shift_id ?? null,
        timestamp: actionAt,
      };
      await writeComplianceAlert(db, 'geofence_violation', details);
      await emitGeofenceEvidence({
        userId: user.id,
        apprenticeId: apprentice.id,
        progressEntryId: progress_entry_id,
        siteId: site_id,
        siteName: site.name ?? null,
        action,
        lat,
        lng,
        accuracyM: accuracy_m ?? null,
        distanceM,
        radiusM,
        accepted: false,
        offlineReplay: offline_replay,
        clientRecordedAt: client_recorded_at ?? null,
        clientShiftId: client_shift_id ?? null,
      });
      sendEmail({
        to: ADMIN_EMAIL,
        subject: `Geofence violation: ${site.name ?? site_id}`,
        text: `Blocked ${action}: apprentice ${apprentice.id} was ${distanceM}m from the approved site (allowed ${radiusM}m).`,
        html: `<p>Blocked <strong>${action}</strong> for apprentice ${apprentice.id}.</p><p>Distance: ${distanceM}m; allowed radius: ${radiusM}m.</p><p>No time was accepted for this action.</p>`,
      }).catch((error) => logger.warn('[Timeclock] geofence email failed', error));
      return NextResponse.json({ error: 'Outside geofence', distance_m: distanceM, radius_m: radiusM }, { status: 403 });
    }

    const actionDate = actionAt.slice(0, 10);
    const weekEndingDate = new Date(`${actionDate}T12:00:00Z`);
    const daysToSaturday = (6 - weekEndingDate.getUTCDay() + 7) % 7;
    weekEndingDate.setUTCDate(weekEndingDate.getUTCDate() + daysToSaturday);
    const weekEnding = weekEndingDate.toISOString().slice(0, 10);
    const normalizedAccuracy = accuracy_m === undefined ? null : Math.round(accuracy_m);

    if (action === 'clock_in') {
      const { data: openShift } = await db
        .from('progress_entries')
        .select('id, site_id, clock_in_at')
        .eq('apprentice_id', apprentice.id)
        .is('clock_out_at', null)
        .order('clock_in_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (openShift) {
        if (offline_replay && openShift.site_id === site_id) {
          return NextResponse.json({
            success: true,
            action,
            progress_entry_id: openShift.id,
            clock_in_at: openShift.clock_in_at,
            geofence_verified: true,
            replayed: true,
          });
        }
        return NextResponse.json(
          { error: 'An open shift already exists', progress_entry_id: openShift.id },
          { status: 409 },
        );
      }

      const { data: newEntry, error: insertError } = await db
        .from('progress_entries')
        .insert({
          apprentice_id: apprentice.id,
          partner_id: apprentice.employer_id,
          program_id: resolvedProgramId,
          site_id,
          work_date: actionDate,
          week_ending: weekEnding,
          clock_in_at: actionAt,
          clock_in_lat: lat,
          clock_in_lng: lng,
          clock_in_accuracy_m: normalizedAccuracy,
          last_known_lat: lat,
          last_known_lng: lng,
          last_location_at: actionAt,
          status: 'submitted',
          auto_clocked_out: false,
        })
        .select('id')
        .single();

      if (insertError || !newEntry) {
        logger.error('[Timeclock] clock_in insert failed', insertError);
        return NextResponse.json({ error: 'Failed to clock in' }, { status: 500 });
      }

      await emitGeofenceEvidence({
        userId: user.id,
        apprenticeId: apprentice.id,
        progressEntryId: newEntry.id,
        siteId: site_id,
        siteName: site.name ?? null,
        action,
        lat,
        lng,
        accuracyM: normalizedAccuracy,
        distanceM,
        radiusM,
        accepted: true,
        offlineReplay: offline_replay,
        clientRecordedAt: client_recorded_at ?? null,
        clientShiftId: client_shift_id ?? null,
      });
      await notifyClockIn(db, { entryId: newEntry.id, userId: user.id, siteName: site.name ?? null, clockInAt: actionAt });

      return NextResponse.json({
        success: true,
        action,
        progress_entry_id: newEntry.id,
        clock_in_at: actionAt,
        geofence_verified: true,
        distance_m: distanceM,
        radius_m: radiusM,
        offline_replay,
      });
    }

    if (!progress_entry_id) {
      return NextResponse.json({ error: `progress_entry_id required for ${action}` }, { status: 400 });
    }

    const { data: entry, error: entryError } = await db
      .from('progress_entries')
      .select('id, site_id, clock_in_at, clock_out_at, lunch_start_at, lunch_end_at')
      .eq('id', progress_entry_id)
      .eq('apprentice_id', apprentice.id)
      .maybeSingle();
    if (entryError || !entry) return NextResponse.json({ error: 'Progress entry not found' }, { status: 404 });
    if (entry.site_id !== site_id) {
      return NextResponse.json({ error: 'Selected site does not match the active shift' }, { status: 403 });
    }
    if (entry.clock_out_at) {
      if (offline_replay && action === 'clock_out') {
        return NextResponse.json({
          success: true,
          action: 'clock_out',
          progress_entry_id: entry.id,
          clock_out_at: entry.clock_out_at,
          replayed: true,
        });
      }
      return NextResponse.json({ error: 'Shift already closed' }, { status: 400 });
    }

    const clockInMs = Date.parse(entry.clock_in_at);
    const actionMs = Date.parse(actionAt);
    if (Number.isFinite(clockInMs) && actionMs < clockInMs) {
      return NextResponse.json({ error: 'Offline event precedes clock-in time' }, { status: 400 });
    }

    if (action === 'lunch_start') {
      if (entry.lunch_start_at) {
        if (offline_replay) {
          return NextResponse.json({
            success: true,
            action,
            progress_entry_id: entry.id,
            lunch_start_at: entry.lunch_start_at,
            replayed: true,
          });
        }
        return NextResponse.json({ error: 'Lunch already started' }, { status: 400 });
      }
      const { error } = await db.from('progress_entries').update({ lunch_start_at: actionAt }).eq('id', entry.id);
      if (error) return NextResponse.json({ error: 'Failed to start lunch' }, { status: 500 });
      return NextResponse.json({ success: true, action, progress_entry_id: entry.id, lunch_start_at: actionAt, offline_replay });
    }

    if (action === 'lunch_end') {
      if (!entry.lunch_start_at) return NextResponse.json({ error: 'Lunch not started' }, { status: 400 });
      if (entry.lunch_end_at) {
        if (offline_replay) {
          return NextResponse.json({
            success: true,
            action,
            progress_entry_id: entry.id,
            lunch_end_at: entry.lunch_end_at,
            replayed: true,
          });
        }
        return NextResponse.json({ error: 'Lunch already ended' }, { status: 400 });
      }
      if (actionMs < Date.parse(entry.lunch_start_at)) {
        return NextResponse.json({ error: 'Lunch end precedes lunch start' }, { status: 400 });
      }
      const lunchMinutes = (actionMs - new Date(entry.lunch_start_at).getTime()) / 60000;
      const { error } = await db.from('progress_entries').update({ lunch_end_at: actionAt }).eq('id', entry.id);
      if (error) return NextResponse.json({ error: 'Failed to end lunch' }, { status: 500 });
      if (lunchMinutes > LUNCH_DURATION_MINUTES) {
        await writeComplianceAlert(db, 'excessive_lunch', {
          apprentice_id: apprentice.id,
          progress_entry_id: entry.id,
          site_id,
          lunch_minutes: Math.round(lunchMinutes),
          standard_minutes: LUNCH_DURATION_MINUTES,
          offline_replay,
          timestamp: actionAt,
        });
      }
      return NextResponse.json({
        success: true,
        action,
        progress_entry_id: entry.id,
        lunch_end_at: actionAt,
        lunch_duration_minutes: Math.round(lunchMinutes),
        exceeded_standard: lunchMinutes > LUNCH_DURATION_MINUTES,
        offline_replay,
      });
    }

    const shiftHours = (actionMs - new Date(entry.clock_in_at).getTime()) / 3600000;
    if (shiftHours < 0) {
      return NextResponse.json({ error: 'Clock-out precedes clock-in' }, { status: 400 });
    }
    if (shiftHours >= 6 && !entry.lunch_start_at) {
      await writeComplianceAlert(db, 'missing_lunch', {
        apprentice_id: apprentice.id,
        progress_entry_id: entry.id,
        site_id,
        shift_hours: Math.round(shiftHours * 10) / 10,
        offline_replay,
        timestamp: actionAt,
      });
    }

    const { error: clockOutError } = await db
      .from('progress_entries')
      .update({
        clock_out_at: actionAt,
        clock_out_lat: lat,
        clock_out_lng: lng,
        clock_out_accuracy_m: normalizedAccuracy,
        last_known_lat: lat,
        last_known_lng: lng,
        last_location_at: actionAt,
      })
      .eq('id', entry.id);
    if (clockOutError) return NextResponse.json({ error: 'Failed to clock out' }, { status: 500 });

    await emitGeofenceEvidence({
      userId: user.id,
      apprenticeId: apprentice.id,
      progressEntryId: entry.id,
      siteId: site_id,
      siteName: site.name ?? null,
      action: 'clock_out',
      lat,
      lng,
      accuracyM: normalizedAccuracy,
      distanceM,
      radiusM,
      accepted: true,
      offlineReplay: offline_replay,
      clientRecordedAt: client_recorded_at ?? null,
      clientShiftId: client_shift_id ?? null,
    });

    const syncResult = await syncProgressEntryToHourEntries(db, entry.id);
    if (!syncResult) logger.warn('[Timeclock] completed shift did not sync to hour_entries', { progress_entry_id: entry.id });

    if (syncResult?.hoursWorked && apprentice.id) {
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/rapids/safe-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apprentice_id: apprentice.id,
          trigger: 'clock_out',
          progress_entry_id: entry.id,
          hours_worked: syncResult.hoursWorked,
        }),
      }).catch((error) => logger.warn('[Timeclock] RAPIDS update failed (non-blocking)', error));
    }

    return NextResponse.json({
      success: true,
      action: 'clock_out',
      progress_entry_id: entry.id,
      clock_out_at: actionAt,
      hours_worked: syncResult?.hoursWorked ?? 0,
      geofence_verified: true,
      distance_m: distanceM,
      radius_m: radiusM,
      offline_replay,
    });
  } catch (error) {
    logger.error(
      '[Timeclock] Unexpected error',
      normalizeError(error, 'Timeclock unexpected error'),
      getErrorContext(error),
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/timeclock/action', _POST);
