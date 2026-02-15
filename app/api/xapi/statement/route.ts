
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/xapi/statement/route.ts
// xAPI Learning Record Store (LRS) endpoint
import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createSupabaseClient } from "@/lib/supabase-api";
import { logger } from '@/lib/logger';

/**
 * POST /api/xapi/statement
 * Receive and store xAPI statements
 */
export async function POST(request: NextRequest) {
  const supabase = createSupabaseClient();
  try {
    const body = await parseBody<Record<string, any>>(request);

    // xAPI statement can be single or array; normalize
    const statements = Array.isArray(body) ? body : [body];

    const records = statements.map((item: any) => {
      const verbId = st?.verb?.id || null;
      const objectId = st?.object?.id || null;
      const objectType = st?.object?.objectType || 'Activity';
      const learnerId = st?.actor?.account?.name || st?.actor?.mbox || null;

      return {
        tenant_id: null, // Note: Extract from auth or statement context
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
  } catch (error) { /* Error handled silently */ 
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
export async function GET(request: NextRequest) {
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
  } catch (error) { /* Error handled silently */ 
    logger.error('xAPI query endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
