import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ShopRelation = { id?: string; name?: string | null } | Array<{ id?: string; name?: string | null }> | null;

function relatedShopName(value: ShopRelation): string | null {
  const row = Array.isArray(value) ? value[0] : value;
  return row?.name ?? null;
}

async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const isAdmin = ['admin', 'super_admin'].includes(profile?.role ?? '');

  const { data: apprentice } = await supabase
    .from('apprentices')
    .select('id, shop_id, employer_id')
    .eq('user_id', user.id)
    .maybeSingle();
  const apprenticeSiteScopeId = apprentice?.shop_id || apprentice?.employer_id || null;

  let sitesQuery = supabase
    .from('work_sites')
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

  if (!isAdmin && apprenticeSiteScopeId) {
    sitesQuery = sitesQuery.eq('shop_id', apprenticeSiteScopeId);
  } else if (!isAdmin) {
    sitesQuery = sitesQuery.eq('id', '00000000-0000-0000-0000-000000000000');
  }

  const { data: sites } = await sitesQuery;
  const allowedSites = (sites || []).map((site: any) => ({
    id: site.id,
    name: site.name || relatedShopName(site.shops as ShopRelation) || 'Unknown Site',
    lat: site.latitude,
    lng: site.longitude,
    radius_m: site.radius_meters || 100,
    shopId: site.shop_id,
  }));

  let activeShift = null;
  if (apprentice) {
    const { data: shift } = await supabase
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
    allowedSites,
    activeShift,
    canClock: Boolean(apprentice || isAdmin),
  });
}

export const GET = withApiAudit('/api/timeclock/context', _GET);
