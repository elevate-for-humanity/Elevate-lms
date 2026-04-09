import { cookies } from 'next/headers';

import { createRouteHandlerClient } from '@/lib/auth';
import { toErrorMessage } from '@/lib/safe';
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
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { data: prof } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (prof?.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const { data, error }: any = await supabase
    .from('program_holders')
    .select('id,name')
    .order('name');

  if (error) return new Response(toErrorMessage(error), { status: 500 });
  return Response.json(data || []);
}
export const GET = withApiAudit('/api/delegates/holders', _GET);
