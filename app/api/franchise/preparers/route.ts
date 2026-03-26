import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { preparerService } from '@/lib/franchise/preparer-service';
import { CreatePreparerInput } from '@/lib/franchise/types';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const officeId = searchParams.get('officeId') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'franchise_admin';

    // Non-admins must specify an office they own
    if (!isAdmin && !officeId) {
      return NextResponse.json(
        { error: 'Office ID required' },
        { status: 400 }
      );
    }

    // Verify office ownership for non-admins
    if (!isAdmin && officeId) {
      const { data: office } = await supabase
        .from('franchise_offices')
        .select('owner_id')
        .eq('id', officeId)
        .single();

      if (office?.owner_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const result = await preparerService.listPreparers({
      officeId,
      status,
      limit,
      offset
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error listing preparers:', error);
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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreatePreparerInput = await request.json();

    // Validate required fields
    if (!body.office_id || !body.ptin || !body.first_name || !body.last_name || !body.email) {
      return NextResponse.json(
        { error: 'Missing required fields: office_id, ptin, first_name, last_name, email' },
        { status: 400 }
      );
    }

    // Check if user is admin or office owner
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'franchise_admin';

    if (!isAdmin) {
      const { data: office } = await supabase
        .from('franchise_offices')
        .select('owner_id')
        .eq('id', body.office_id)
        .single();

      if (office?.owner_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const preparer = await preparerService.createPreparer(body, user.id);

    return NextResponse.json(preparer, { status: 201 });
  } catch (error) {
    logger.error('Error creating preparer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/franchise/preparers', _GET);
export const POST = withApiAudit('/api/franchise/preparers', _POST);
