import { safeInternalError } from '@/lib/api/safe-error';

import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
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

  const { data, error }: any = await supabase
    .from('program_holders')
    .select('id,name')
    .order('name');

  if (error) return safeInternalError(error as Error, 'Internal server error');
  return Response.json(data || []);
}
export const GET = withApiAudit('/api/delegates/holders', _GET);
