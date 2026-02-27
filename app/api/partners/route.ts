import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const program = searchParams.get('program');
    const status = searchParams.get('status') || 'active';
    const city = searchParams.get('city');
    const state = searchParams.get('state');

    let query = db
      .from('partners')
      .select('id, name, city, state, address, status, programs')
      .eq('status', status);

    // Filter by program if specified
    if (program) {
      query = query.contains('programs', [program.toUpperCase()]);
    }

    // Filter by location if specified
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }
    if (state) {
      query = query.eq('state', state.toUpperCase());
    }

    const { data: partners, error } = await query.order('name');

    if (error) {
      logger.error('Error fetching partners:', error);
      return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
    }

    return NextResponse.json({ 
      partners: partners || [],
      count: partners?.length || 0,
    });
  } catch (error) {
    logger.error('Partners API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/partners', _GET);
