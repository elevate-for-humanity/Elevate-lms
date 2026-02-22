import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRoutingRecommendations, assignToShop } from '@/lib/automation/shop-routing';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/automation/routing
 * Get routing recommendations or assign to shop
 */
export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { action, application_id, shop_id } = body;

    if (!application_id) {
      return NextResponse.json({ error: 'application_id required' }, { status: 400 });
    }

    if (action === 'assign') {
      if (!shop_id) {
        return NextResponse.json({ error: 'shop_id required for assign' }, { status: 400 });
      }
      const result = await assignToShop(application_id, shop_id, user.id);
      return NextResponse.json(result);
    } else {
      // Default: get recommendations
      const result = await getRoutingRecommendations(application_id);
      return NextResponse.json(result);
    }
  } catch (error) {
    logger.error('Routing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
