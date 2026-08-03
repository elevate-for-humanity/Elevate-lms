import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createSupabaseClient(url, key);
}

export async function GET() {
  const supabase = createAnonClient();

  const { data: shops, error, count } = await supabase
    .from('host_shops')
    .select('*', { count: 'exact' })
    .eq('is_accepting_apprentices', true)
    .filter('shop_status', 'eq', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const shopsWithSlots = (shops || []).map(shop => ({
    id: shop.id,
    name: shop.name,
    address: shop.address,
    city: shop.city,
    state: shop.state,
    phone: shop.phone,
    image_url: shop.image_url,
    services: shop.services,
    specializations: shop.specializations,
    slots_available: Math.max(0, (shop.max_apprentices || 2) - (shop.current_apprentice_count || 0)),
    request_status: null,
  })).filter(shop => shop.slots_available > 0);

  return NextResponse.json({
    shops: shopsWithSlots,
    total: count || 0,
    page: 1,
    pages: 1,
  });
}
