
import { createAdminClient } from '@/lib/supabase/admin';

// app/api/xapi/statement/route.ts
// xAPI Learning Record Store (LRS) endpoint
import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createSupabaseClient } from "@/lib/supabase-api";
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

/**
 * POST /api/xapi/statement
 * Receive and store xAPI statements
 */
async function _POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { apiAuthGuard } = await import('@/lib/admin/guards');
    try { await apiAuthGuard(request); } catch (e) { return e instanceof Response ? e : NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const supabase = createSupabaseClient();
  try {
    const body = await parseBody<Record<string, any>>(request);

    // xAPI statement can be single or array; normalize
    const statements = Array.isArray(body) ? body : [body];

    // Resolve tenant from the authenticated user's profile
    const db = createAdminClient();
    const { data: actorProfile } = await db
      .from('profiles')
      .select('tenant_id')
      .eq('id', auth.id)
      .maybeSingle();
    const tenantId = actorProfile?.tenant_id ?? null;

    const records = statements.map((st: any) => {
      const verbId = st?.verb?.id || null;
      const objectId = st?.object?.id || null;
      const objectType = st?.object?.objectType || 'Activity';
      // Use authenticated user id — never trust actor from request body
      const learnerId = auth.id;

      return {
        tenant_id: tenantId,
        learner_id: learnerId,
        raw: st,
        verb: verbId,
        object_id: objectId,
        object_type: objectType,
        result: st?.result || null,
        context: st?.context || null,
      };
    });

    const { error } = await supabase
      .from('xapi_statements')
      .insert(records);

    if (error) {
      logger.error('xAPI storage error:', error);
      return NextResponse.json(
        { error: 'Failed to store statements' },
        { status: 500 }
      );
    }

    return NextResponse.json({ stored: records.length });
  } catch (error) { 
    logger.error('xAPI endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/xapi/statement
 * Retrieve xAPI statements (LRS query)
 */
async function _GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = createSupabaseClient();
  try {
    const { searchParams } = new URL(request.url);
    const learnerId = searchParams.get('actor');
    const verb = searchParams.get('verb');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('xapi_statements')
      .select('*')
      .order('stored_at', { ascending: false })
      .limit(limit);

    if (learnerId) {
      query = query.eq('learner_id', learnerId);
    }

    if (verb) {
      query = query.eq('verb', verb);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('xAPI query error:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve statements' },
        { status: 500 }
      );
    }

    return NextResponse.json({ statements: data });
  } catch (error) { 
    logger.error('xAPI query endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/xapi/statement', _GET);
export const POST = withApiAudit('/api/xapi/statement', _POST);
