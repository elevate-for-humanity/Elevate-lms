export const runtime = 'nodejs';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/xapi/route.ts
import { NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  // xAPI endpoint for receiving learning activity statements
  const body = await parseBody<Record<string, any>>(request);

  const statements = Array.isArray(body) ? body : [body];

  const data = statements.map((s: Record<string, any>) => ({
    actor: s.actor,
    verb: s.verb,
    object: s.object,
    context: s.context ?? null,
    result: s.result ?? null,
    timestamp: s.timestamp ?? new Date().toISOString(),
  }));

  if (!data.length) {
    return NextResponse.json({ error: 'No statements' }, { status: 400 });
  }

  const { error } = await supabase.from('xapi_statements').insert(data);

  if (error) {
    logger.error('xAPI insert error:', error);
    return NextResponse.json(
      { error: 'Failed to store statements' },
      { status: 500 }
    );
  }

  return NextResponse.json({ stored: data.length });
}

async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  // xAPI GET endpoint for retrieving statements
  const { searchParams } = new URL(request.url);
  const actor = searchParams.get('agent');
  const verb = searchParams.get('verb');
  const limit = parseInt(searchParams.get('limit') || '100');

  let query = supabase
    .from('xapi_statements')
    .select('*')
    .order('stored_at', { ascending: false })
    .limit(limit);

  if (actor) {
    query = query.contains('actor', { mbox: actor });
  }

  if (verb) {
    query = query.contains('verb', { id: verb });
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve statements' },
      { status: 500 }
    );
  }

  return NextResponse.json({ statements: data });
}
export const GET = withApiAudit('/api/xapi', _GET);
export const POST = withApiAudit('/api/xapi', _POST);
