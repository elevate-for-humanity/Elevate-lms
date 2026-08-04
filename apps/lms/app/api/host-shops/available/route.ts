import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createSupabaseClient(url, key);
}

export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  const offset = (page - 1) * limit;

  let query = supabase
    .from('host_shops')
    .select(`
      id, name, business_name, address_line1, city, state, zip_code, phone, email,
      owner_name, owner_phone, owner_email,
      services, specializations,
      years_experience, mentor_count,
      is_accepting_apprentices, max_apprentices, current_apprentice_count,
      availability_notes, active_days, open_time, close_time,
      image_url, rating, review_count, shop_status, created_at,
      description
    `, { count: 'exact' })
    .eq('shop_status', 'active')
    .eq('is_accepting_apprentices', true)
    .order('rating', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (city) {
    query = query.ilike('city', `%${city}%`);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,business_name.ilike.%${search}%,owner_name.ilike.%${search}%`);
  }

  const from = offset;
  const to = offset + limit - 1;
  query = query.range(from, to);

  const { data: shops, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formatted = (shops || []).map(shop => ({
    id: shop.id,
    name: shop.name || shop.business_name || 'Host Shop',
    address: shop.address_line1 || '',
    city: shop.city,
    state: shop.state,
    zip_code: shop.zip_code,
    phone: shop.phone,
    email: shop.email,
    owner_name: shop.owner_name,
    owner_phone: shop.owner_phone,
    owner_email: shop.owner_email,
    services: shop.services || [],
    specializations: shop.specializations || [],
    years_experience: shop.years_experience,
    mentor_count: shop.mentor_count,
    spots_available: Math.max(0, (shop.max_apprentices || 5) - (shop.current_apprentice_count || 0)),
    availability_notes: shop.availability_notes,
    active_days: (shop.active_days || []).map(d => dayName(d)),
    hours: shop.open_time && shop.close_time
      ? `${formatTime(shop.open_time)} - ${formatTime(shop.close_time)}`
      : null,
    image_url: shop.image_url,
    rating: shop.rating ? parseFloat(String(shop.rating)) : null,
    review_count: shop.review_count || 0,
    description: shop.description,
    created_at: shop.created_at,
  })).filter(shop => shop.spots_available > 0);

  return NextResponse.json({
    shops: formatted,
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    },
  });
}

function formatTime(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

function dayName(abbrev: string): string {
  const days: Record<string, string> = {
    mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
    thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
  };
  return days[abbrev] || abbrev;
}
