import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createRouteHandlerClient } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  // Get program holder details
  const { data: ph, error } = await supabase
    .from('program_holders')
    .select(
      `
      id,
      name,
      payout_share,
      mou_status,
      mou_holder_name,
      mou_holder_signed_at,
      mou_holder_sig_url,
      mou_admin_name,
      mou_admin_signed_at,
      mou_admin_sig_url,
      mou_final_pdf_url
    `
    )
    .eq('id', id)
    .single();

  if (error || !ph) {
    return new Response('Program holder not found', { status: 404 });
  }

  return Response.json(ph);
}
