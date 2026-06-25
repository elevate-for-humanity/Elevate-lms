import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/timeclock/context
 * Returns the authenticated user's timeclock context.
 *
 * Site access is role-based:
 * - admin/admin/staff: all active sites
 * - apprentice: only sites linked to their assigned shop/employer
 * - others: empty list
 */
async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // Use user-session client only for auth verification, then switch to admin
    // client for all DB queries so RLS policies don't block apprentice data reads.
    const authClient = await createClient();
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await requireAdminClient();

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || 'student';
    const isAdmin = ['admin', 'staff'].includes(role);

    // Get apprentice record linked to this user via user_id or email match
    let apprentice = null;

    // First try direct user_id match
    const { data: apprenticeByUserId } = await supabase
      .from('apprentices')
      .select(
        `
        id,
        referral_id,
        employer_id,
        shop_id,
        rapids_id,
        start_date,
        status
      `,
      )
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (apprenticeByUserId) {
      apprentice = apprenticeByUserId;
    } else if (user.email) {
      // Fallback: match by email via profiles join when user_id not set on apprentice row
      const { data: profileMatch } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (profileMatch) {
        const { data: apprenticeByEmail } = await supabase
          .from('apprentices')
          .select(
            `
            id,
            referral_id,
            employer_id,
            shop_id,
            rapids_id,
            start_date,
            status
          `,
          )
          .eq('user_id', profileMatch.id)
          .eq('status', 'active')
          .maybeSingle();

        if (apprenticeByEmail) {
          apprentice = apprenticeByEmail;
        }
      }
    }

    if (!isAdmin && !apprentice) {
      return NextResponse.json(
        { error: 'No active apprentice profile found for this account' },
        { status: 403 },
      );
    }

    // Resolve active enrollment context for timeclock payload and progress UI.
    const { data: activeEnrollment } = await supabase
      .from('program_enrollments')
      .select('program_id, required_hours, program_slug, programs(title, slug, total_hours)')
      .eq('user_id', user.id)
      .in('enrollment_state', ['active', 'enrolled', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const programId = activeEnrollment?.program_id || null;
    const programSlug = activeEnrollment?.program_slug || (activeEnrollment?.programs as any)?.slug;
    const programName = (activeEnrollment?.programs as any)?.title || 'Barber Apprenticeship';
    const hoursRequired =
      activeEnrollment?.required_hours || (activeEnrollment?.programs as any)?.total_hours || 2000;

    const { data: approvedEntries } = await supabase
      .from('hour_entries')
      .select('accepted_hours, hours_claimed')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .eq('program_slug', programSlug || 'barber-apprenticeship');

    const hoursCompleted = (approvedEntries || []).reduce(
      (sum: number, row: any) => sum + Number(row.accepted_hours ?? row.hours_claimed ?? 0),
      0,
    );

    // Get employer/shop info
    let shopId: string | null = null;
    let shopName: string | null = null;
    const apprenticeSiteScopeId = apprentice?.shop_id || apprentice?.employer_id || null;
    if (apprenticeSiteScopeId) {
      const { data: shop } = await supabase
        .from('shops')
        .select('id, name')
        .eq('id', apprenticeSiteScopeId)
        .maybeSingle();
      if (shop) {
        shopId = shop.id;
        shopName = shop.name;
      }
    }

    // Build site query based on role
    let sitesQuery = supabase
      .from('apprentice_sites')
      .select(
        `
        id,
        name,
        latitude,
        longitude,
        radius_meters,
        shop_id,
        shops:shop_id (
          id,
          name
        )
      `,
      )
      .eq('is_active', true);

    // Restrict sites for non-admin users
    if (!isAdmin && apprenticeSiteScopeId) {
      // Apprentice: only sites linked to their assigned shop/employer scope.
      sitesQuery = sitesQuery.eq('shop_id', apprenticeSiteScopeId);
    } else if (!isAdmin) {
      // No apprentice record and not admin: no sites
      sitesQuery = sitesQuery.eq('id', '00000000-0000-0000-0000-000000000000'); // Returns empty
    }

    const { data: sites } = await sitesQuery;

    const allowedSites = (sites || []).map((site) => ({
      id: site.id,
      name: site.name || (Array.isArray(site.shops) ? site.shops[0]?.name : (site.shops as { id: string; name: string } | null)?.name) || 'Unknown Site',
      lat: site.latitude,
      lng: site.longitude,
      radius_m: site.radius_meters || 100,
      shopId: site.shop_id,
    }));

    // Check for active shift from progress_entries (the table timeclock/action writes to)
    let activeShift = null;
    if (apprentice) {
      try {
        const { data: shift } = await supabase
          .from('progress_entries')
          .select('id, clock_in_at, lunch_start_at, lunch_end_at, site_id')
          .eq('apprentice_id', apprentice.id)
          .is('clock_out_at', null)
          .order('clock_in_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (shift) {
          activeShift = {
            entryId: shift.id,
            clockInAt: shift.clock_in_at,
            lunchStartAt: shift.lunch_start_at,
            lunchEndAt: shift.lunch_end_at,
            siteId: shift.site_id,
          };
        }
      } catch (err) {
        logger.error(
          'Timeclock context: active shift lookup failed',
          err instanceof Error ? err : undefined,
        );
      }
    }

    return NextResponse.json({
      apprenticeId: apprentice?.id || null,
      userId: user.id,
      userName: profile?.full_name || user.email,
      role,
      programId,
      programName,
      partnerId: apprentice?.employer_id || null,
      hoursCompleted,
      hoursRequired,
      shopId,
      shopName,
      defaultSiteId: allowedSites[0]?.id || null,
      allowedSites,
      activeShift,
    });
  } catch (error) {
    logger.error('Timeclock context error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/timeclock/context', _GET);
