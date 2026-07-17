import { safeInternalError } from '@/lib/api/safe-error';
import { NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { data: prof } = await supabase
    .from('profiles')
    .select('role, program_holder_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!prof?.program_holder_id) {
    return new Response('No program holder', { status: 403 });
  }

  // Must be delegate or partner
  const { data: del } = await supabase
    .from('delegates')
    .select('can_view_reports')
    .eq('user_id', user.id)
    .eq('program_holder_id', prof.program_holder_id)
    .maybeSingle();

  if (!del && prof.role !== 'partner' && prof.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  const body = await req.json();
  const { user_id, course_id, status, note, follow_up_date } = body || {};

  if (!user_id || !course_id) {
    return new Response('Missing fields', { status: 400 });
  }

  const { error } = await supabase.from('program_holder_notes').insert({
    program_holder_id: prof.program_holder_id,
    user_id,
    course_id,
    status: status || null,
    note: note || null,
    follow_up_date: follow_up_date || null,
    follow_up_done: false,
    created_by: user.id,
  });

  if (error) {
    return safeInternalError(error as Error, 'Internal server error');
  }

  return Response.json({ ok: true });
}
export const POST = withApiAudit('/api/delegate/notes/add', _POST);
