import { cookies } from 'next/headers';

import { createRouteHandlerClient } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const { id } = await params;
  const supabase = await createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    return new Response('Forbidden', { status: 403 });
  }

  // Get program holder details
  const { data: ph, error } = await supabase
    .from('program_holders')
    .select(
      `
      id,
      name,
      organization_name,
      contact_name,
      contact_email,
      contact_phone,
      status,
      payout_share,
      mou_signed,
      mou_status,
      mou_holder_name,
      mou_holder_signed_at,
      mou_holder_sig_url,
      mou_final_pdf_url,
      approved_at,
      created_at,
      user_id
    `
    )
    .eq('id', id)
    .single();

  if (error || !ph) {
    return new Response('Program holder not found', { status: 404 });
  }

  return Response.json(ph);
}
export const GET = withApiAudit('/api/admin/program-holders/[id]', _GET);
