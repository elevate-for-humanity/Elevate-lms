import { NextResponse } from 'next/server';
import { createClient as createSupabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  // Get all approved shops accepting apprentices with available slots
  const { data: shops, error } = await supabase
    .from('host_shops')
    .select(`
      id, name, address, city, state, phone, image_url, owner_name,
      services, specializations, description, is_accepting_apprentices,
      max_apprentices, current_apprentice_count
    `)
    .eq('approval_status', 'approved')
    .eq('is_accepting_apprentices', true)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If user is logged in, add their request status for each shop
  let requests: any[] = [];
  if (user) {
    const { data: userRequests } = await supabase
      .from('host_shop_match_requests')
      .select('id, host_shop_id, status')
      .eq('apprentice_id', user.id)
      .eq('deleted_at', null)
      .in('status', ['pending', 'approved']);

    requests = userRequests || [];
  }

  const shopsWithSlots = (shops || []).map(shop => {
    const max = shop.max_apprentices || 2;
    const current = shop.current_apprentice_count || 0;
    const slots_available = Math.max(0, max - current);

    // Find user's request for this shop
    const userRequest = requests.find(r => r.host_shop_id === shop.id);

    return {
      ...shop,
      slots_available,
      request_status: userRequest?.status || null,
      request_id: userRequest?.id || null,
    };
  }).filter(shop => shop.slots_available > 0);

  return NextResponse.json({ shops: shopsWithSlots });
}
