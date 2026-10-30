import { recordedHours, isOjlEntry } from '@/lib/apprenticeship/recorded-hours';
import { readHoursPages } from '@/lib/apprenticeship/admin-hours';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { getApprenticeshipRequiredHours } from '@/lib/compliance/apprenticeship';
import { evaluateIdentityClockEligibility } from '@/lib/identity/clock-eligibility';
import { getTimeclockWorkDate, getTimeclockWeekEnding } from '@/lib/timeclock/work-date';
import { APPRENTICE_TIME_POLICY } from '@/lib/timeclock/policy';
import { provisionMissingTimeclockSite } from '@/lib/timeclock/provision-site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const db = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(db, user?.id);
  if (!subject.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: apprentice, error: apprenticeError } = await db
    .from('apprentices')
    .select('id, user_id, program_id, shop_id, employer_id, created_at')
    .eq('user_id', subject.userId)
    .eq('status', 'active')
    .maybeSingle();
  if (apprenticeError) return NextResponse.json({ error: 'Apprentice context unavailable' }, { status: 503 });
  const apprenticeSiteScopeId = apprentice?.shop_id || apprentice?.employer_id || null;
  const { data: identityDocuments, error: identityError } = apprentice
    ? await db
        .from('documents')
        .select('document_type,status,verification_status,verified,metadata')
        .eq('user_id', subject.userId)
        .eq('document_type', 'photo_id')
    : { data: [], error: null };
  const { data: providerIdentity, error: providerError } = apprentice
    ? await db
        .from('id_verifications')
        .select('id')
        .eq('user_id', subject.userId)
        .in('status', ['approved', 'verified'])
        .limit(1)
        .maybeSingle()
    : { data: null, error: null };
  if (identityError || providerError) return NextResponse.json({ error: 'Identity verification unavailable' }, { status: 503 });
  const identity = evaluateIdentityClockEligibility(
    apprentice?.created_at,
    identityDocuments || [],
    Boolean(providerIdentity),
  );

  // The action endpoint validates apprentice_sites.id, so the context must
  // return that same canonical site identity. Returning shops.id here makes the
  // UI look configured but every clock action fail with "Site not found".
  if (apprenticeSiteScopeId && !subject.previewing) {
    try {
      await provisionMissingTimeclockSite(db, apprenticeSiteScopeId);
    } catch {
      return NextResponse.json({ error: 'Approved site configuration unavailable' }, { status: 503 });
    }
  }
  const { data: sites, error: sitesError } = apprenticeSiteScopeId
    ? await db
        .from('apprentice_sites')
        .select('id,name,latitude,longitude,radius_meters,shop_id,partner_id,is_active')
        .eq('shop_id', apprenticeSiteScopeId)
        .eq('is_active', true)
    : { data: [], error: null };
  if (sitesError) return NextResponse.json({ error: 'Approved sites unavailable' }, { status: 503 });
  const allowedSites = (sites || [])
    .filter(
      (site: any) =>
        site.latitude != null && Math.abs(Number(site.latitude)) <= 90 &&
        site.longitude != null && Math.abs(Number(site.longitude)) <= 180 &&
        Number.isFinite(Number(site.latitude)) &&
        Number.isFinite(Number(site.longitude)) &&
        Number.isFinite(Number(site.radius_meters)) &&
        Number(site.radius_meters) > 0,
    )
    .map((site: any) => ({
      id: site.id,
      name: site.name || 'Approved Host Shop',
      lat: Number(site.latitude),
      lng: Number(site.longitude),
      radius_m: Number(site.radius_meters),
      shopId: site.shop_id,
    }));

  const { data: enrollment, error: enrollmentError } = await db.from('program_enrollments')
    .select('program_slug,program_id').or(`user_id.eq.${subject.userId},student_id.eq.${subject.userId}`)
    .in('status', ['active', 'enrolled', 'in_progress', 'confirmed'])
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (enrollmentError) return NextResponse.json({ error: 'Enrollment unavailable' }, { status: 503 });
  const { data: program } = enrollment?.program_id
    ? await db.from('programs').select('name').eq('id', enrollment.program_id).maybeSingle()
    : { data: null };
  let hoursCompleted = 0;
  if (enrollment?.program_slug) {
    try {
      const approvedHours = await readHoursPages<any>((from, to) => db.from('hour_entries')
        .select('id,accepted_hours,hours_claimed,source_type,category')
        .eq('user_id', subject.userId).eq('program_slug', enrollment.program_slug)
        .in('status', ['approved', 'locked']).order('id').range(from, to));
      hoursCompleted = approvedHours.filter(isOjlEntry).reduce((sum, row) => sum + recordedHours(row), 0);
    } catch {
      return NextResponse.json({ error: 'Recorded hours unavailable' }, { status: 503 });
    }
  }

  let activeShift = null;
  let weeklyOjlHours = 0;
  let weeklyTheoryRecordedHours = 0;
  let weeklyTheoryVerifiedHours = 0;
  if (apprentice) {
    const workDate = getTimeclockWorkDate();
    const weekEnding = getTimeclockWeekEnding(workDate);
    const weekStart = new Date(`${weekEnding}T12:00:00Z`);
    weekStart.setUTCDate(weekStart.getUTCDate() - 6);
    const weekStartDate = weekStart.toISOString().slice(0, 10);
    const weeklyResults = await Promise.all([
      db.from('progress_entries')
        .select('hours_worked')
        .eq('apprentice_id', apprentice.id)
        .gte('work_date', weekStartDate)
        .lte('work_date', weekEnding)
        .not('clock_out_at', 'is', null),
      db.from('apprenticeship_rti_entries')
        .select('minutes_verified')
        .eq('user_id', subject.userId)
        .eq('status', 'verified')
        .gte('instruction_date', weekStartDate)
        .lte('instruction_date', weekEnding),
      db.from('theory_activity_sessions')
        .select('active_seconds')
        .eq('user_id', subject.userId)
        .eq('week_ending', weekEnding),
    ]);
    if (weeklyResults.some(result => result.error)) {
      return NextResponse.json({ error: 'Weekly attendance unavailable' }, { status: 503 });
    }
    const [{ data: weeklyEntries }, { data: weeklyTheory }, { data: weeklyTheorySessions }] = weeklyResults;
    weeklyOjlHours = (weeklyEntries || []).reduce(
      (sum: number, row: any) => sum + Number(row.hours_worked || 0),
      0,
    );
    weeklyTheoryVerifiedHours = (weeklyTheory || []).reduce(
      (sum: number, row: any) => sum + Number(row.minutes_verified || 0) / 60,
      0,
    );
    weeklyTheoryRecordedHours = (weeklyTheorySessions || []).reduce(
      (sum: number, row: any) => sum + Number(row.active_seconds || 0) / 3600,
      0,
    );
    const { data: shift, error: shiftError } = await db
      .from('progress_entries')
      .select('id, clock_in_at, lunch_start_at, lunch_end_at, site_id')
      .eq('apprentice_id', apprentice.id)
      .eq('work_date', workDate)
      .not('clock_in_at', 'is', null)
      .is('clock_out_at', null)
      .order('clock_in_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (shiftError) return NextResponse.json({ error: 'Active shift unavailable' }, { status: 503 });
    activeShift = shift ?? null;
  }

  return NextResponse.json({
    success: true,
    apprenticeId: apprentice?.id ?? null,
    userId: subject.userId,
    programId: enrollment?.program_id ?? apprentice?.program_id ?? null,
    programName: program?.name || String(enrollment?.program_slug || '').replace(/-/g, ' '),
    partnerId: apprenticeSiteScopeId,
    defaultSiteId: allowedSites[0]?.id ?? null,
    allowedSites,
    hoursCompleted,
    hoursRequired: getApprenticeshipRequiredHours(enrollment?.program_slug ?? null) ?? 0,
    activeShift: activeShift
      ? {
          entryId: activeShift.id,
          clockInAt: activeShift.clock_in_at,
          lunchStartAt: activeShift.lunch_start_at,
          lunchEndAt: activeShift.lunch_end_at,
          siteId: activeShift.site_id,
        }
      : null,
    weeklyOjlHours: Math.round(weeklyOjlHours * 100) / 100,
    weeklyTheoryRecordedHours: Math.round(weeklyTheoryRecordedHours * 100) / 100,
    weeklyTheoryVerifiedHours: Math.round(weeklyTheoryVerifiedHours * 100) / 100,
    weeklyOjlMaxHours: APPRENTICE_TIME_POLICY.weeklyOjlMaxHours,
    weeklyTheoryTargetHours: APPRENTICE_TIME_POLICY.weeklyTheoryTargetHours,
    weeklyTheoryMaxHours: APPRENTICE_TIME_POLICY.weeklyTheoryMaxHours,
    weeklyCombinedMaxHours: APPRENTICE_TIME_POLICY.weeklyCombinedMaxHours,
    outsideGeofenceGraceMinutes: APPRENTICE_TIME_POLICY.outsideGeofenceGraceMinutes,
    canClock: Boolean(enrollment && apprentice && allowedSites.length && identity.eligible && !subject.previewing && weeklyOjlHours < APPRENTICE_TIME_POLICY.weeklyOjlMaxHours),
    identityVerification: identity,
    previewing: subject.previewing,
    configurationMessage: !apprentice
      ? 'Apprentice record is not configured.'
      : !allowedSites.length
        ? 'Host Shop geofence coordinates must be verified before clock-in is enabled.'
        : !identity.eligible
          ? 'Complete secure ID and selfie verification before clock-in is enabled.'
        : subject.previewing
          ? 'Admin preview is read-only. The learner can clock in from their own account at the verified Host Shop.'
          : weeklyOjlHours >= APPRENTICE_TIME_POLICY.weeklyOjlMaxHours
            ? `The ${APPRENTICE_TIME_POLICY.weeklyOjlMaxHours}-hour weekly OJL limit has been reached.`
          : null,
  });
}

export const GET = withApiAudit('/api/timeclock/context', _GET);
