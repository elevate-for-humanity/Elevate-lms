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

    // Check access - only ERO or office owner can view pending signatures
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
        // Check if user is the designated ERO
        const config = await eroService.getEROConfig(officeId);
        if (config) {
          const { data: eroPreparer } = await db
            .from('franchise_preparers')
            .select('user_id')
            .eq('id', config.ero_preparer_id)
            .single();

          if (eroPreparer?.user_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
        } else {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    const pending = await eroService.getPendingSignatures(officeId);

    return NextResponse.json({ pending, count: pending.length });
  } catch (error) {
    logger.error('Error getting pending signatures:', error);
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

    if (!body.officeId || !body.submissionIds || !Array.isArray(body.submissionIds)) {
      return NextResponse.json(
        { error: 'Missing required fields: officeId, submissionIds (array)' },
        { status: 400 }
      );
    }

    // Check access - only ERO or office owner can sign
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
        .eq('id', body.officeId)
        .single();

      if (office?.owner_id !== user.id) {
        // Check if user is the designated ERO
        const config = await eroService.getEROConfig(body.officeId);
        if (config) {
          const { data: eroPreparer } = await db
            .from('franchise_preparers')
            .select('user_id')
            .eq('id', config.ero_preparer_id)
            .single();

          if (eroPreparer?.user_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
        } else {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    // Validate ERO before signing
    const validation = await eroService.validateERO(body.officeId);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'ERO validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Get IP address from request
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') ||
                      undefined;

    const result = await eroService.batchSign(
      body.submissionIds,
      body.officeId,
      ipAddress,
      user.id
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error signing returns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/franchise/ero/sign', _GET);
export const POST = withApiAudit('/api/franchise/ero/sign', _POST);
