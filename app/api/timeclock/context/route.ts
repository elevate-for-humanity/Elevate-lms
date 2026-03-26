import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/timeclock/context
 * Returns the authenticated user's timeclock context.
 * 
 * Site access is role-based:
 * - admin/super_admin/staff: all active sites
 * - apprentice: only sites linked to their employer
 * - others: empty list
 */
async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'student';
    const isAdmin = ['admin', 'super_admin', 'staff'].includes(role);

    // Get apprentice record linked to this user via user_id or email match
    let apprentice = null;
    
    // First try direct user_id match
    const { data: apprenticeByUserId } = await supabase
      .from('apprentices')
      .select(`
        id,
        referral_id,
        employer_id,
        rapids_id,
        start_date,
        status
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();
    
    if (apprenticeByUserId) {
      apprentice = apprenticeByUserId;
    } else if (user.email) {
      // Fallback: match by email if user_id not set
      const { data: apprenticeByEmail } = await supabase
        .from('apprentices')
        .select(`
          id,
          referral_id,
          employer_id,
          rapids_id,
          start_date,
          status,
          email
        `)
        .eq('email', user.email)
        .eq('status', 'active')
        .maybeSingle();
      
      if (apprenticeByEmail) {
        apprentice = apprenticeByEmail;
        // Update the apprentice record with user_id for future lookups
        await supabase
          .from('apprentices')
          .update({ user_id: user.id })
          .eq('id', apprenticeByEmail.id);
      }
    }

    // Get employer/shop info
    let shopId: string | null = null;
    let shopName: string | null = null;
    if (apprentice?.employer_id) {
      const { data: shop } = await supabase
        .from('shops')
        .select('id, name')
        .eq('id', apprentice.employer_id)
        .single();
      if (shop) {
        shopId = shop.id;
        shopName = shop.name;
      }
    }

    // Build site query based on role
    let sitesQuery = supabase
      .from('apprentice_sites')
      .select(`
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
      `)
      .eq('is_active', true);

    // Restrict sites for non-admin users
    if (!isAdmin && apprentice?.employer_id) {
      // Apprentice: only sites linked to their employer
      sitesQuery = sitesQuery.eq('shop_id', apprentice.employer_id);
    } else if (!isAdmin) {
      // No apprentice record and not admin: no sites
      sitesQuery = sitesQuery.eq('id', '00000000-0000-0000-0000-000000000000'); // Returns empty
    }

    const { data: sites } = await sitesQuery;

    const allowedSites = (sites || []).map(site => ({
      id: site.id,
      name: site.name || (site.shops as { name: string } | null)?.name || 'Unknown Site',
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
        logger.error('Timeclock context: active shift lookup failed', err instanceof Error ? err : undefined);
      }
    }

    return NextResponse.json({
      apprenticeId: apprentice?.id || null,
      userId: user.id,
      userName: profile?.full_name || user.email,
      role,
      shopId,
      shopName,
      defaultSiteId: allowedSites[0]?.id || null,
      allowedSites,
      activeShift,
    });
  } catch (error) {
    logger.error('Timeclock context error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/timeclock/context', _GET);
