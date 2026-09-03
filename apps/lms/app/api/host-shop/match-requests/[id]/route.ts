import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const HOST_SHOP_ADMIN_COOKIE = '__efh_host_shop_partner';
const PLATFORM_ADMIN_ROLES = new Set(['admin', 'super_admin', 'org_admin']);
const HOST_ROLES = new Set(['partner', 'host_shop', 'host_shop_admin', 'program_holder']);
const APPRENTICE_ROLES = new Set([
  'student',
  'learner',
  'apprentice',
  'barber_apprentice',
  'cosmetology_apprentice',
]);

async function getContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle();

  return {
    user,
    db,
    role: String(profile?.role || '').trim().toLowerCase(),
  };
}

async function authorizedShopIds(db: any, userId: string, role: string) {
  let partnerId: string | null = null;

  if (PLATFORM_ADMIN_ROLES.has(role)) {
    const cookieStore = await cookies();
    partnerId = cookieStore.get(HOST_SHOP_ADMIN_COOKIE)?.value || null;
  } else if (HOST_ROLES.has(role)) {
    const { data: partnerUser } = await db
      .from('partner_users')
      .select('partner_id, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    partnerId = partnerUser?.partner_id || null;
  } else {
    return [];
  }

  let query = db
    .from('shops')
    .select('id, partner_id, active, partners!inner(id, status, approval_status, is_active)')
    .eq('active', true)
    .eq('partners.status', 'active')
    .eq('partners.approval_status', 'approved')
    .neq('partners.is_active', false);

  if (partnerId) query = query.eq('partner_id', partnerId);
  else if (!PLATFORM_ADMIN_ROLES.has(role)) return [];

  const { data } = await query;
  return (data || []).map((shop: any) => shop.id).filter(Boolean);
}

async function loadRequest(db: any, id: string) {
  const { data } = await db
    .from('host_shop_match_requests')
    .select('id, apprentice_id, host_shop_id, program_slug, status, deleted_at')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  return data;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { user, db, role } = ctx;
  if (!PLATFORM_ADMIN_ROLES.has(role) && !HOST_ROLES.has(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const requestRecord = await loadRequest(db, id);
  if (!requestRecord) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  const shopIds = await authorizedShopIds(db, user.id, role);
  if (!requestRecord.host_shop_id || !shopIds.includes(requestRecord.host_shop_id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const status = typeof body?.status === 'string' ? body.status.trim().toLowerCase() : '';
  const shopNotes = typeof body?.shop_notes === 'string' ? body.shop_notes.trim().slice(0, 4000) : null;
  if (!['approved', 'declined'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status. Must be approved or declined.' }, { status: 400 });
  }

  const { data: result, error: rpcError } = await db.rpc('respond_host_shop_match_request', {
    p_request_id: id,
    p_responder_id: user.id,
    p_status: status,
    p_shop_notes: shopNotes,
  });

  if (rpcError) {
    const message = rpcError.message || 'Unable to respond to match request.';
    const conflict = /already resolved|no available apprentice slots/i.test(message);
    return NextResponse.json({ error: message }, { status: conflict ? 409 : 400 });
  }

  const { data: updated, error: loadError } = await db
    .from('host_shop_match_requests')
    .select(`
      id, apprentice_id, host_shop_id, status, message, apprentice_notes, shop_notes, created_at, responded_at, expires_at, program_slug,
      apprentice:profiles!host_shop_match_requests_apprentice_id_fkey(id, full_name, email, avatar_url, phone),
      shop:host_shops!host_shop_match_requests_host_shop_id_fkey(id, name, address, city, state, zip_code, phone, image_url, owner_name, owner_email, owner_phone, approval_status, is_approved),
      placement:apprentice_placements!host_shop_match_requests_placement_id_fkey(id, status, start_date, student_id, shop_id, program_slug)
    `)
    .eq('id', id)
    .single();

  if (loadError) return NextResponse.json({ result });
  return NextResponse.json({ request: updated, result });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { user, db, role } = ctx;
  const requestRecord = await loadRequest(db, id);
  if (!requestRecord) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (APPRENTICE_ROLES.has(role)) {
    if (requestRecord.apprentice_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else if (PLATFORM_ADMIN_ROLES.has(role) || HOST_ROLES.has(role)) {
    const shopIds = await authorizedShopIds(db, user.id, role);
    if (!requestRecord.host_shop_id || !shopIds.includes(requestRecord.host_shop_id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await db
    .from('host_shop_match_requests')
    .select(`
      id, apprentice_id, host_shop_id, status, message, apprentice_notes, shop_notes, created_at, responded_at, expires_at, program_slug,
      apprentice:profiles!host_shop_match_requests_apprentice_id_fkey(id, full_name, email, avatar_url, phone),
      shop:host_shops!host_shop_match_requests_host_shop_id_fkey(id, name, address, city, state, zip_code, phone, image_url, owner_name, owner_email, owner_phone, approval_status, is_approved),
      placement:apprentice_placements!host_shop_match_requests_placement_id_fkey(id, status, start_date, student_id, shop_id, program_slug)
    `)
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ request: data });
}
