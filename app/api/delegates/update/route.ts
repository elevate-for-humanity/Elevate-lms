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
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (prof?.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const { id, field, value } = await req.json();

  if (!id || !field) {
    return new Response('Missing fields', { status: 400 });
  }

  const { error } = await supabase
    .from('delegates')
    .update({ [field]: value })
    .eq('id', id);

  if (error) {
    return safeInternalError(error as Error, 'Internal server error');
  }

  return Response.json({ ok: true });
}
export const POST = withApiAudit('/api/delegates/update', _POST);
