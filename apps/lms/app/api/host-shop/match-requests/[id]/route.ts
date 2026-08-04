import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createSupabaseServer } from '@/lib/supabase/server';

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createSupabaseClient(url, key);
}

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
  const { status, shop_notes } = body;

  // Validate status
  if (!['approved', 'declined'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status. Must be "approved" or "declined"' }, { status: 400 });
  }

  // Use service client for admin operations
  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient
    .from('host_shop_match_requests')
    .update({
      status,
      shop_notes: shop_notes || null,
      responded_at: new Date().toISOString(),
      responded_by: user.id,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If approved, increment the shop's apprentice count
  if (status === 'approved' && req_data.host_shop_id) {
    // Get current shop data
    const { data: currentShop } = await serviceClient
      .from('host_shops')
      .select('current_apprentice_count, max_apprentices')
      .eq('id', req_data.host_shop_id)
      .single();

    if (currentShop) {
      const newCount = (currentShop.current_apprentice_count || 0) + 1;
      await serviceClient
        .from('host_shops')
        .update({ current_apprentice_count: newCount })
        .eq('id', req_data.host_shop_id);
    }
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
      shop:host_shops!host_shop_match_requests_host_shop_id_fkey(id, business_name, name, address_line1, city, state, zip_code, phone, image_url, owner_name, owner_email, owner_phone),
      placement:apprentice_placements(id, status, start_date)
    `)
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ request: data });
}
