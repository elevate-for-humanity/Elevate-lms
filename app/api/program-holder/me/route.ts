import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createRouteHandlerClient } from '@/lib/auth';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get user's program holder ID
  const { data: prof } = await supabase
    .from('user_profiles')
    .select('program_holder_id')
    .eq('user_id', user.id)
    .single();

  if (!prof?.program_holder_id) {
    return new Response('No program holder assigned', { status: 404 });
  }

  // Get program holder details
  const { data: ph, error } = await supabase
    .from('program_holders')
    .select(
      'id, name, payout_share, mou_status, mou_holder_name, mou_holder_signed_at'
    )
    .eq('id', prof.program_holder_id)
    .single();

  if (error) {
    return new Response(toErrorMessage(error), { status: 500 });
  }

  return Response.json(ph);
}
