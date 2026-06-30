import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { checkBarberSuspension } from '@/lib/barber/suspension';
import { sendEmail } from '@/lib/email/service';
import { emitEvent } from '@/lib/events/emit';

const MAX_ACCURACY_M = 50;
const LUNCH_DURATION_MINUTES = 60;

type TimeclockAction = 'clock_in' | 'lunch_start' | 'lunch_end' | 'clock_out';

interface ActionPayload {
  action: TimeclockAction;
  apprentice_id?: string;
  partner_id?: string;
  program_id?: string;
  site_id: string;
  progress_entry_id?: string;
  lat: number;
  lng: number;
  accuracy_m?: number;
}

/**
 * Haversine formula to calculate distance between two GPS coordinates
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';
const FROM_EMAIL = 'noreply@elevateforhumanity.org';

/**
 * Write an admin alert with full operational context in metadata.
 * The details object is stored verbatim — include apprentice_id, site_id,
 * distances, shift_id, hours, and any violation metadata so downstream
 * AI, investigations, and escalation workflows have the full picture.
 *
 * For missing_lunch and excessive_lunch, also emails the apprentice and admin.
 * Geofence violation emails are sent inline at the call site (with emitEvent).
 *
 * @param userId - authenticated user id; used to look up profile for email
 */
async function raiseAdminAlert(
  supabase: any,
  alertType: string,
  details: Record<string, any>,
  userId?: string,
) {
  try {
    const message = buildAlertMessage(alertType, details);
    await supabase.from('admin_alerts').insert({
      alert_type: alertType,
      severity: details.severity ?? 'warning',
      apprentice_id: details.apprentice_id ?? null,
      progress_entry_id: details.progress_entry_id ?? null,
      site_id: details.site_id ?? null,
      message,
      metadata: details,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[Timeclock] Failed to raise admin alert:', error);
  }

  // Send escalation emails for lunch compliance violations.
  // Geofence violations are emailed inline at the call site.
  const lunchAlertTypes = new Set(['missing_lunch', 'excessive_lunch']);
  if (!lunchAlertTypes.has(alertType) || !userId) return;

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .maybeSingle();

    const name = profile?.full_name || 'Apprentice';
    const email = profile?.email || '';
    const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

    if (alertType === 'missing_lunch') {
      const { shift_hours } = details;
      if (email) {
        await sendEmail({
          to: email,
          subject: 'Timeclock alert: no lunch break recorded',
          html: `
            <p>Hi ${name},</p>
            <p>You clocked out after a <strong>${shift_hours}-hour shift</strong> without recording a lunch break.</p>
            <p>Shifts of 6 hours or more require a meal break. Please speak with your supervisor to correct your timesheet if needed.</p>
            <p>— Elevate for Humanity</p>
          `,
        }).catch((err) => logger.warn('[Timeclock] missing_lunch email failed', { userId, err }));
      }
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `[Admin] Missing lunch break — ${name}`,
        html: `
          <p><strong>${name}</strong> clocked out after a <strong>${shift_hours}-hour shift</strong> with no lunch break recorded.</p>
          <p>User ID: ${userId}</p>
          <p><a href="https://www.elevateforhumanity.org/admin/timeclock">Review in Admin →</a></p>
        `,
      }).catch((err) => logger.warn('[Timeclock] missing_lunch admin email failed', { err }));
    }

    if (alertType === 'excessive_lunch') {
      const { lunch_minutes, standard_minutes } = details;
      if (email) {
        await sendEmail({
          to: email,
          subject: 'Timeclock alert: extended lunch break',
          html: `
            <p>Hi ${name},</p>
            <p>Your lunch break today was <strong>${lunch_minutes} minutes</strong>, which exceeds the standard ${standard_minutes}-minute break.</p>
            <p>Extended breaks may affect your logged hours. Please speak with your supervisor if you have questions.</p>
            <p>— Elevate for Humanity</p>
          `,
        }).catch((err) => logger.warn('[Timeclock] excessive_lunch email failed', { userId, err }));
      }
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `[Admin] Extended lunch break — ${name}`,
        html: `
          <p><strong>${name}</strong> took a <strong>${lunch_minutes}-minute lunch break</strong> (standard: ${standard_minutes} min).</p>
          <p>User ID: ${userId}</p>
          <p><a href="https://www.elevateforhumanity.org/admin/timeclock">Review in Admin →</a></p>
        `,
      }).catch((err) => logger.warn('[Timeclock] excessive_lunch admin email failed', { err }));
    }
  } catch (err) {
    logger.warn('[Timeclock] raiseAdminAlert email lookup failed', { alertType, userId, err });
  }
}

function buildAlertMessage(alertType: string, d: Record<string, any>): string {
  switch (alertType) {
    case 'geofence_violation':
      return `Geofence violation: ${d.distance_m}m from ${d.site_name ?? 'site'} (allowed ${d.radius_m}m) during ${d.action}`;
    case 'excessive_lunch':
      return `Lunch exceeded standard: ${d.lunch_minutes}min (standard ${d.standard_minutes}min)`;
    case 'missing_lunch':
      return `No lunch break recorded for ${d.shift_hours}h shift`;
    case 'missed_clock_out':
      return `Auto-closed shift after ${d.open_hours}h without clock-out`;
    case 'low_hours_pace':
      return `Behind OJL pace: ${d.completed_hours}h completed, need ${d.required_pace_hours}h/week to finish on time`;
    default:
      return alertType.replace(/_/g, ' ');
  }
}

/**
 * Sync a completed progress_entries shift to hour_entries (OJL timeclock bucket).
 * Idempotent: skips if hour_entry_id is already set on the progress entry.
 *
 * This is the authoritative bridge between the GPS timeclock and the
 * apprenticeship hours pipeline. Without this, clock-out events never
 * reach OJL totals, dashboards, or RAPIDS.
 */
async function syncShiftToHourEntries(
  supabase: any,
  params: {
    progressEntryId: string;
    apprenticeId: string;   // apprentices.id (UUID)
    programId: string;
    workDate: string;
    hoursWorked: number;
    siteId: string | null;
  },
): Promise<string | null> {
  const { progressEntryId, apprenticeId, programId, workDate, hoursWorked, siteId } = params;

  // Skip if already synced
  const { data: existing } = await supabase
    .from('progress_entries')
    .select('hour_entry_id')
    .eq('id', progressEntryId)
    .maybeSingle();

  if (existing?.hour_entry_id) {
    return existing.hour_entry_id;
  }

  // Resolve user_id from apprentices table
  const { data: apprentice } = await supabase
    .from('apprentices')
    .select('user_id, program_id')
    .eq('id', apprenticeId)
    .maybeSingle();

  if (!apprentice?.user_id) {
    logger.warn('[Timeclock] syncShiftToHourEntries: no user_id for apprentice', { apprenticeId });
    return null;
  }

  // Insert into hour_entries as a timeclock OJL entry (pending approval)
  const { data: hourEntry, error: insertError } = await supabase
    .from('hour_entries')
    .insert({
      user_id: apprentice.user_id,
      source_type: 'timeclock',
      work_date: workDate,
      hours_claimed: hoursWorked,
      status: 'pending',
      entered_by_email: apprentice.user_id,
      entered_at: new Date().toISOString(),
      program_slug: programId,
      notes: `Auto-synced from timeclock shift ${progressEntryId}`,
      legacy_source: 'progress_entries',
      legacy_id: progressEntryId,
    })
    .select('id')
    .maybeSingle();

  if (insertError) {
    logger.error('[Timeclock] syncShiftToHourEntries insert failed:', insertError);
    return null;
  }

  // Back-link the hour_entry_id onto the progress entry for idempotency
  await supabase
    .from('progress_entries')
    .update({ hour_entry_id: hourEntry.id })
    .eq('id', progressEntryId);

  return hourEntry.id;
}

async function notifyClockIn(
  supabase: any,
  params: {
    entryId: string;
    apprenticeUserId: string;
    siteName: string | null;
    clockInAt: string;
  },
) {
  const { entryId, apprenticeUserId, siteName, clockInAt } = params;

  await supabase
    .from('notifications')
    .insert({
      user_id: apprenticeUserId,
      type: 'timeclock',
      title: 'Clock-in recorded',
      message: `Your clock-in was recorded${siteName ? ` at ${siteName}` : ''}.`,
      action_label: 'View timeclock',
      action_url: '/apprentice/timeclock',
      link: '/apprentice/timeclock',
      read: false,
      metadata: {
        progress_entry_id: entryId,
        site_name: siteName,
        clock_in_at: clockInAt,
      },
      idempotency_key: `timeclock-clock-in-learner-${entryId}-${apprenticeUserId}`,
    })
    .catch(() => {});

  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'super_admin', 'staff'])
    .limit(200);

  if (admins?.length) {
    const adminRows = admins.map((admin: { id: string }) => ({
      user_id: admin.id,
      type: 'timeclock',
      title: 'Student clocked in',
      message: `A student clocked in${siteName ? ` at ${siteName}` : ''}.`,
      action_label: 'Review timeclock',
      action_url: '/admin/notifications',
      link: '/admin/notifications',
      read: false,
      metadata: {
        progress_entry_id: entryId,
        apprentice_user_id: apprenticeUserId,
        site_name: siteName,
        clock_in_at: clockInAt,
      },
      idempotency_key: `timeclock-clock-in-admin-${entryId}-${admin.id}`,
    }));
    await supabase.from('notifications').insert(adminRows).catch(() => {});
  }
}

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body: ActionPayload = await request.json();
    const {
      action,
      apprentice_id,
      program_id,
      site_id,
      progress_entry_id,
      lat,
      lng,
      accuracy_m,
    } = body;

    // Require authenticated user for all timeclock actions.
    const authClient = await createClient();
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Suspension gate — block hour logging for suspended/past-due accounts
    const db = await requireAdminClient();
    if (db) {
      const suspended = await checkBarberSuspension(user.id, db);
      if (suspended) return suspended;
    }

    if (!action || !site_id) {
      return NextResponse.json(
        { error: 'Missing required fields: action, site_id' },
        { status: 400 },
      );
    }

    if (lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'GPS coordinates required' }, { status: 400 });
    }

    // Validate GPS accuracy
    if (accuracy_m && accuracy_m > MAX_ACCURACY_M) {
      return NextResponse.json(
        { error: 'GPS accuracy too low', accuracy_m, max_allowed: MAX_ACCURACY_M },
        { status: 400 },
      );
    }

    const supabase = await requireAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Resolve apprentice from authenticated user (authoritative server-side mapping).
    let resolvedApprentice: { id: string; employer_id: string | null; shop_id: string | null } | null = null;
    const { data: byUserId } = await supabase
      .from('apprentices')
      .select('id, employer_id, shop_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();
    if (byUserId) {
      resolvedApprentice = byUserId;
    }

    if (!resolvedApprentice) {
      return NextResponse.json({ error: 'No active apprentice profile found' }, { status: 403 });
    }

    if (apprentice_id && apprentice_id !== resolvedApprentice.id) {
      return NextResponse.json(
        { error: 'Forbidden: apprentice_id does not match authenticated user' },
        { status: 403 },
      );
    }

    const resolvedApprenticeId = resolvedApprentice.id;
    const resolvedPartnerId = resolvedApprentice.employer_id;
    const resolvedShopId = resolvedApprentice.shop_id || resolvedApprentice.employer_id;

    // Resolve program id server-side when clients do not provide it.
    let resolvedProgramId = program_id;
    if (!resolvedProgramId) {
      const { data: enrollment } = await supabase
        .from('program_enrollments')
        .select('program_id')
        .eq('user_id', user.id)
        .in('status', ['active', 'enrolled', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      resolvedProgramId = enrollment?.program_id || null;
    }

    if (!resolvedProgramId) {
      return NextResponse.json(
        { error: 'No active enrollment found to determine program_id' },
        { status: 400 },
      );
    }

    // Load site geofence from apprentice_sites
    const { data: site, error: siteError } = await supabase
      .from('apprentice_sites')
      .select('id, latitude, longitude, radius_meters, name, shop_id')
      .eq('id', site_id)
      .maybeSingle();

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    if (resolvedShopId && site.shop_id !== resolvedShopId) {
      return NextResponse.json({ error: 'Forbidden: selected site is not assigned to apprentice' }, { status: 403 });
    }

    // Validate inside geofence
    const distance = haversineDistance(lat, lng, site.latitude, site.longitude);
    const withinGeofence = distance <= site.radius_meters;

    if (!withinGeofence) {
      const violationDetails = {
        apprentice_id: resolvedApprenticeId,
        site_id,
        site_name: site.name,
        action,
        distance_m: Math.round(distance),
        radius_m: site.radius_meters,
        lat,
        lng,
        timestamp: new Date().toISOString(),
      };

      // Write alert with full context
      await raiseAdminAlert(supabase, 'geofence_violation', violationDetails);

      // Escalate: email admin immediately (geofence violations are active compliance events)
      sendEmail({
        to: ADMIN_EMAIL,
        subject: `Geofence Violation: ${site.name ?? 'Unknown site'} — ${action}`,
        html: `
<h2>Geofence Violation Detected</h2>
<p><strong>Site:</strong> ${site.name ?? site_id}</p>
<p><strong>Action attempted:</strong> ${action}</p>
<p><strong>Distance from site:</strong> ${Math.round(distance)}m (allowed: ${site.radius_meters}m)</p>
<p><strong>GPS coordinates:</strong> ${lat}, ${lng}</p>
<p><strong>Time:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'America/Indiana/Indianapolis' })} ET</p>
<p>The clock-in was blocked. No hours were recorded.</p>
<p><a href="https://www.elevateforhumanity.org/admin/apprentices">Review in admin dashboard</a></p>
        `.trim(),
        text: `Geofence violation at ${site.name ?? site_id}: ${Math.round(distance)}m from site (allowed ${site.radius_meters}m) during ${action}. Clock-in blocked.`,
      }).catch(() => {});

      // Platform event for audit trail and AI review
      emitEvent('timeclock.geofence_violation', 'compliance', {
        severity: 'warning',
        actor_type: 'user',
        actor_id: user.id,
        subject_id: site_id,
        subject_type: 'apprentice_site',
        payload: violationDetails,
        message: `Geofence violation: ${Math.round(distance)}m from ${site.name ?? 'site'} during ${action}`,
      }).catch(() => {});

      return NextResponse.json(
        {
          error: 'Outside geofence',
          distance_m: Math.round(distance),
          radius_m: site.radius_meters,
        },
        { status: 403 },
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
            apprentice_id: resolvedApprenticeId,
            partner_id: resolvedPartnerId,
            program_id: resolvedProgramId,
            site_id,
            work_date: serverDate,
            week_ending: weekEndingStr,
            clock_in_at: serverNow,
            status: 'submitted',
            auto_clocked_out: false,
          })
          .select('id')
          .maybeSingle();

        if (insertError) {
          logger.error('[Timeclock] clock_in insert error:', insertError);
          return NextResponse.json({ error: 'Failed to clock in' }, { status: 500 });
        }

        await notifyClockIn(supabase, {
          entryId: newEntry.id,
          apprenticeUserId: user.id,
          siteName: site.name ?? null,
          clockInAt: serverNow,
        });

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
            { status: 400 },
          );
        }

        // Verify open shift exists
        const { data: entry, error: entryError } = await supabase
          .from('progress_entries')
          .select('id, clock_in_at, clock_out_at, lunch_start_at')
          .eq('id', progress_entry_id)
          .eq('apprentice_id', resolvedApprenticeId)
          .maybeSingle();

        if (entryError || !entry) {
          return NextResponse.json({ error: 'Progress entry not found' }, { status: 404 });
        }

        if (entry.clock_out_at) {
          return NextResponse.json({ error: 'Shift already closed' }, { status: 400 });
        }

        if (entry.lunch_start_at) {
          return NextResponse.json({ error: 'Lunch already started' }, { status: 400 });
        }

        const { error: updateError } = await supabase
          .from('progress_entries')
          .update({ lunch_start_at: serverNow })
          .eq('id', progress_entry_id);

        if (updateError) {
          return NextResponse.json({ error: 'Failed to start lunch' }, { status: 500 });
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
            { status: 400 },
          );
        }

        // Verify lunch was started
        const { data: entry, error: entryError } = await supabase
          .from('progress_entries')
          .select('id, clock_in_at, clock_out_at, lunch_start_at, lunch_end_at')
          .eq('id', progress_entry_id)
          .eq('apprentice_id', resolvedApprenticeId)
          .maybeSingle();

        if (entryError || !entry) {
          return NextResponse.json({ error: 'Progress entry not found' }, { status: 404 });
        }

        if (!entry.lunch_start_at) {
          return NextResponse.json({ error: 'Lunch not started' }, { status: 400 });
        }

        if (entry.lunch_end_at) {
          return NextResponse.json({ error: 'Lunch already ended' }, { status: 400 });
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
          return NextResponse.json({ error: 'Failed to end lunch' }, { status: 500 });
        }

        // Raise alert if lunch exceeded standard duration
        if (lunchMinutes > LUNCH_DURATION_MINUTES) {
          await raiseAdminAlert(supabase, 'excessive_lunch', {
            apprentice_id: resolvedApprenticeId,
            progress_entry_id,
            lunch_minutes: Math.round(lunchMinutes),
            standard_minutes: LUNCH_DURATION_MINUTES,
            timestamp: serverNow,
          }, user.id);
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
            { status: 400 },
          );
        }

        // Verify open shift exists
        const { data: entry, error: entryError } = await supabase
          .from('progress_entries')
          .select('id, clock_in_at, clock_out_at, lunch_start_at, lunch_end_at')
          .eq('id', progress_entry_id)
          .eq('apprentice_id', resolvedApprenticeId)
          .maybeSingle();

        if (entryError || !entry) {
          return NextResponse.json({ error: 'Progress entry not found' }, { status: 404 });
        }

        if (entry.clock_out_at) {
          return NextResponse.json({ error: 'Already clocked out' }, { status: 400 });
        }

        // Check for missing lunch after 6 hours
        const clockIn = new Date(entry.clock_in_at);
        const clockOut = new Date(serverNow);
        const shiftHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

        if (shiftHours >= 6 && !entry.lunch_start_at) {
          await raiseAdminAlert(supabase, 'missing_lunch', {
            apprentice_id: resolvedApprenticeId,
            progress_entry_id,
            shift_hours: Math.round(shiftHours * 10) / 10,
            timestamp: serverNow,
          }, user.id);
        }

        // DB trigger will derive hours_worked and enforce weekly cap
        const { error: updateError } = await supabase
          .from('progress_entries')
          .update({ clock_out_at: serverNow })
          .eq('id', progress_entry_id);

        if (updateError) {
          return NextResponse.json({ error: 'Failed to clock out' }, { status: 500 });
        }

        // Reload to get derived hours (DB trigger calculates hours_worked on clock_out_at update)
        const { data: updatedEntry } = await supabase
          .from('progress_entries')
          .select('hours_worked')
          .eq('id', progress_entry_id)
          .maybeSingle();

        const hoursWorked = updatedEntry?.hours_worked ?? 0;

        // Sync to hour_entries — this is the authoritative OJL pipeline bridge.
        // Without this, timeclock hours never reach dashboards, OJL totals, or RAPIDS.
        if (hoursWorked > 0) {
          const hourEntryId = await syncShiftToHourEntries(supabase, {
            progressEntryId: progress_entry_id,
            apprenticeId: resolvedApprenticeId,
            programId: resolvedProgramId,
            workDate: serverDate,
            hoursWorked,
            siteId: site_id,
          });
          if (!hourEntryId) {
            logger.warn('[Timeclock] clock_out: hour_entries sync failed for entry', { progress_entry_id });
          }

          // Non-blocking RAPIDS update — fire and forget so clock-out response is never delayed.
          if (resolvedApprenticeId) {
            fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/rapids/safe-update`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                apprentice_id: resolvedApprenticeId,
                trigger: 'clock_out',
                progress_entry_id,
                hours_worked: hoursWorked,
              }),
            }).catch((err) => logger.warn('[Timeclock] RAPIDS update failed (non-blocking)', err));
          }
        }

        return NextResponse.json({
          success: true,
          action: 'clock_out',
          progress_entry_id,
          clock_out_at: serverNow,
          hours_worked: hoursWorked,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('[Timeclock] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/timeclock/action', _POST);
