import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { eroService } from '@/lib/franchise/ero-service';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const officeId = searchParams.get('officeId');

    if (!officeId) {
      return NextResponse.json({ error: 'Office ID required' }, { status: 400 });
    }

    // Check access
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'franchise_admin';

    if (!isAdmin) {
      const { data: office } = await db
        .from('franchise_offices')
        .select('owner_id')
        .eq('id', officeId)
        .single();

      if (office?.owner_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const config = await eroService.getEROConfig(officeId);
    const validation = await eroService.validateERO(officeId);

    return NextResponse.json({
      config,
      validation
    });
  } catch (error) {
    logger.error('Error getting ERO config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.office_id || !body.ero_preparer_id || !body.efin || !body.firm_name) {
      return NextResponse.json(
        { error: 'Missing required fields: office_id, ero_preparer_id, efin, firm_name' },
        { status: 400 }
      );
    }

    // Check access - only admins and office owners can set ERO config
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'franchise_admin';

    if (!isAdmin) {
      const { data: office } = await db
        .from('franchise_offices')
        .select('owner_id')
        .eq('id', body.office_id)
        .single();

      if (office?.owner_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const config = await eroService.setEROConfig(body, user.id);

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    logger.error('Error setting ERO config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/franchise/ero', _GET);
export const POST = withApiAudit('/api/franchise/ero', _POST);
