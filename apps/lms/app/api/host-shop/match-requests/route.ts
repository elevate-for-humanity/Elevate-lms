import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  
  let query = supabase
    .from('host_shop_match_requests')
    .select(`
      id, status, message, apprentice_notes, shop_notes, created_at, responded_at, expires_at, program_slug,
      apprentice:profiles!host_shop_match_requests_apprentice_id_fkey(id, full_name, email, avatar_url, phone),
      shop:host_shops!host_shop_match_requests_host_shop_id_fkey(id, business_name, name, address_line1, city, state, zip_code, phone, image_url, owner_name, owner_email),
      placement:apprentice_placements(id, status, start_date)
    `, { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Shop owners see their own shop's requests
  const { data: ownShop } = await supabase
    .from('host_shops').select('id').eq('owner_id', user.id).single();
  
  if (ownShop) {
    query = query.eq('host_shop_id', ownShop.id);
  } else if (profile?.role === 'admin' || profile?.role === 'super_admin') {
    // admin sees all
  } else {
    // apprentices see their own
    query = query.eq('apprentice_id', user.id);
  }

  if (status) query = query.eq('status', status);
  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json({
    requests: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    }
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { host_shop_id, program_slug, message, apprentice_notes } = body;

  if (!host_shop_id) return NextResponse.json({ error: 'host_shop_id required' }, { status: 400 });

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();

  // Check if shop exists and is accepting apprentices
  const { data: shop } = await supabase
    .from('host_shops').select('*').eq('id', host_shop_id).single();
  
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
  if (!shop.is_accepting_apprentices) return NextResponse.json({ error: 'Shop is not accepting apprentices' }, { status: 400 });
  if ((shop.current_apprentice_count || 0) >= (shop.max_apprentices || 2)) {
    return NextResponse.json({ error: 'Shop has no available slots' }, { status: 400 });
  }

  // Check for existing pending/approved request
  const { data: existing } = await supabase
    .from('host_shop_match_requests')
    .select('id')
    .eq('apprentice_id', user.id)
    .eq('host_shop_id', host_shop_id)
    .eq('deleted_at', null)
    .in('status', ['pending', 'approved'])
    .single();

  if (existing) return NextResponse.json({ error: 'You already have a pending or approved request for this shop' }, { status: 409 });

  const { data, error } = await supabase
    .from('host_shop_match_requests')
    .insert({
      apprentice_id: user.id,
      apprentice_name: profile?.full_name,
      apprentice_email: profile?.email,
      apprentice_phone: profile?.phone,
      host_shop_id,
      program_slug: program_slug || 'barber-apprenticeship',
      message,
      apprentice_notes,
      status: 'pending',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // TODO: Send email/SMS notification to shop owner
  return NextResponse.json({ request: data }, { status: 201 });
}
