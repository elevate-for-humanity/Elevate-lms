import { cookies } from 'next/headers';

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
    return Response.json(null);
  }

  // Get program holder details — all contact info lives on program_holders directly
  const { data: holder, error } = await supabase
    .from('program_holders')
    .select(
      `
      id,
      name,
      organization_name,
      status,
      payout_share,
      mou_status,
      mou_signed,
      mou_signed_at,
      mou_holder_name,
      mou_holder_signed_at,
      mou_holder_sig_url,
      contact_name,
      contact_email,
      contact_phone
    `
    )
    .eq('id', prof.program_holder_id)
    .single();

  if (error || !holder) {
    return Response.json(null);
  }

  return Response.json({
    program_holder_id: holder.id,
    program_holder_name: holder.name || holder.organization_name,
    status: holder.status,
    payout_share: holder.payout_share,
    mou_status: holder.mou_status,
    mou_signed: holder.mou_signed,
    mou_signed_at: holder.mou_signed_at,
    mou_holder_name: holder.mou_holder_name,
    mou_holder_signed_at: holder.mou_holder_signed_at,
    contact_name: holder.contact_name,
    contact_email: holder.contact_email,
    phone: holder.contact_phone,
  });
}
export const GET = withApiAudit('/api/program-holder/mou-data', _GET);
