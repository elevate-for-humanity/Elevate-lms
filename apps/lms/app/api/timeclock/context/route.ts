import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { getApprenticeshipRequiredHours } from '@/lib/compliance/apprenticeship';

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

  const { data: apprentice } = await db
    .from('apprentices')
    .select('id, user_id, program_id, shop_id, employer_id')
    .eq('user_id', subject.userId)
    .maybeSingle();
  const apprenticeSiteScopeId = apprentice?.shop_id || apprentice?.employer_id || null;

  // The action endpoint validates apprentice_sites.id, so the context must
  // return that same canonical site identity. Returning shops.id here makes the
  // UI look configured but every clock action fail with "Site not found".
  const { data: sites } = apprenticeSiteScopeId
    ? await db
        .from('apprentice_sites')
        .select('id,name,latitude,longitude,radius_meters,shop_id,partner_id,is_active')
        .eq('shop_id', apprenticeSiteScopeId)
        .eq('is_active', true)
    : { data: [] };
  const allowedSites = (sites || [])
    .filter(
      (site: any) =>
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

  const { data: enrollment } = await db.from('program_enrollments')
    .select('program_slug,program_id').eq('user_id', subject.userId)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  const { data: program } = enrollment?.program_id
    ? await db.from('programs').select('name').eq('id', enrollment.program_id).maybeSingle()
    : { data: null };
  const { data: approvedHours } = await db.from('hour_entries')
    .select('accepted_hours,hours_claimed').eq('user_id', subject.userId).eq('status', 'approved');
  const hoursCompleted = (approvedHours || []).reduce((sum: number, row: any) => sum + Number(row.accepted_hours || row.hours_claimed || 0), 0);

  let activeShift = null;
  if (apprentice) {
    const { data: shift } = await db
      .from('progress_entries')
      .select('id, clock_in_at, lunch_start_at, lunch_end_at, site_id')
      .eq('apprentice_id', apprentice.id)
      .is('clock_out_at', null)
      .order('clock_in_at', { ascending: false })
      .limit(1)
      .maybeSingle();
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
    activeShift,
    canClock: Boolean(apprentice && allowedSites.length && !subject.previewing),
    previewing: subject.previewing,
    configurationMessage: !apprentice
      ? 'Apprentice record is not configured.'
      : !allowedSites.length
        ? 'Host Shop geofence coordinates must be verified before clock-in is enabled.'
        : subject.previewing
          ? 'Admin preview is read-only. The learner can clock in from their own account at the verified Host Shop.'
          : null,
  });
}

export const GET = withApiAudit('/api/timeclock/context', _GET);
