import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

import { createRouteHandlerClient } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get user's program holder
  const { data: prof } = await supabase
    .from('user_profiles')
    .select('program_holder_id')
    .eq('user_id', user.id)
    .single();

  if (!prof?.program_holder_id) {
    return Response.json({ status: null });
  }

  // Get program holder status
  const { data: holder } = await supabase
    .from('program_holders')
    .select('status, mou_status')
    .eq('id', prof.program_holder_id)
    .single();

  return Response.json({
    status: holder?.status || null,
    mou_status: holder?.mou_status || null,
  });
}
export const GET = withApiAudit('/api/program-holder/status', _GET);
