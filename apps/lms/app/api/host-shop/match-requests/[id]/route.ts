import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseServer } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();

  // Get the request
  const { data: req_data } = await supabase
    .from('host_shop_match_requests').select('*').eq('id', id).single();

  if (!req_data) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  const { data: shop } = await supabase
    .from('host_shops').select('*').eq('owner_id', user.id).single();

  // Only shop owner or admin can update
  if (req_data.host_shop_id !== shop?.id && !['admin', 'super_admin'].includes(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { action, shop_notes } = body; // action: 'approve' | 'decline' | 'withdraw'

  let newStatus: string;
  if (action === 'approve') newStatus = 'approved';
  else if (action === 'decline') newStatus = 'declined';
  else if (action === 'withdraw') newStatus = 'withdrawn';
  else return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  const { data, error } = await supabase
    .from('host_shop_match_requests')
    .update({
      status: newStatus,
      shop_notes,
      responded_at: new Date().toISOString(),
      responded_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If approved, send notification to apprentice
  if (newStatus === 'approved' && req_data.apprentice_email) {
    // TODO: Send email
  }

  return NextResponse.json({ request: data });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('host_shop_match_requests')
    .select(`
      id, status, message, apprentice_notes, shop_notes, created_at, responded_at, expires_at, program_slug,
      apprentice:profiles!host_shop_match_requests_apprentice_id_fkey(id, full_name, email, avatar_url, phone),
      shop:host_shops!host_shop_match_requests_host_shop_id_fkey(id, name, address, city, state, phone, image_url, owner_name),
      placement:apprentice_placements(id, status, start_date)
    `)
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ request: data });
}
