import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createRouteHandlerClient } from '@/lib/auth';

export async function GET() {
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

  // Get program holder details with application
  const { data: holder, error } = await supabase
    .from('program_holders')
    .select(
      `
      id,
      name,
      status,
      payout_share,
      mou_status,
      mou_signed_at,
      application:program_holder_applications(
        contact_name,
        contact_email,
        phone,
        site_address
      )
    `
    )
    .eq('id', prof.program_holder_id)
    .single();

  if (error || !holder) {
    return Response.json(null);
  }

  return Response.json({
    program_holder_id: holder.id,
    program_holder_name: holder.name,
    status: holder.status,
    payout_share: holder.payout_share,
    mou_status: holder.mou_status,
    mou_signed_at: holder.mou_signed_at,
    contact_name: holder.application?.[0]?.contact_name,
    contact_email: holder.application?.[0]?.contact_email,
    phone: holder.application?.[0]?.phone,
    site_address: holder.application?.[0]?.site_address,
  });
}
