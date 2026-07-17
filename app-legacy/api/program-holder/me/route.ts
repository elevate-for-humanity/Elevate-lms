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

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get user's program holder ID
  const { data: prof } = await supabase
    .from('profiles')
    .select('program_holder_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!prof?.program_holder_id) {
    return new Response('No program holder assigned', { status: 404 });
  }

  // Get program holder details
  const { data: ph, error } = await supabase
    .from('program_holders')
    .select('id, name, payout_share, mou_status, mou_holder_name, mou_holder_signed_at')
    .eq('id', prof.program_holder_id)
    .maybeSingle();

  if (error) {
    return safeInternalError(error as Error, 'Internal server error');
  }

  return Response.json(ph);
}
export const GET = withApiAudit('/api/program-holder/me', _GET);
