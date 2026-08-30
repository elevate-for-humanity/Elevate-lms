import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';

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

async function getSessionContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('id, role, full_name, email, phone')
    .eq('id', user.id)
    .maybeSingle();

  return {
    user,
    db,
    profile,
    role: String(profile?.role || '').trim().toLowerCase(),
  };
}

async function activeApprovedShopIds(db: any, partnerId?: string | null) {
  let query = db
    .from('shops')
    .select('id, partner_id, active, partners!inner(id, status, approval_status, is_active)')
    .eq('active', true)
    .eq('partners.status', 'active')
    .eq('partners.approval_status', 'approved')
    .neq('partners.is_active', false);

  if (partnerId) query = query.eq('partner_id', partnerId);
  const { data } = await query;
  return (data || []).map((shop: any) => shop.id).filter(Boolean);
}

async function getAuthorizedHostShopIds(db: any, userId: string, role: string) {
  if (PLATFORM_ADMIN_ROLES.has(role)) {
    const cookieStore = await cookies();
    const selectedPartnerId = cookieStore.get(HOST_SHOP_ADMIN_COOKIE)?.value || null;
    return activeApprovedShopIds(db, selectedPartnerId);
  }

  if (!HOST_ROLES.has(role)) return [];

  const { data: partnerUser } = await db
    .from('partner_users')
    .select('partner_id, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  if (!partnerUser?.partner_id) return [];

  return activeApprovedShopIds(db, partnerUser.partner_id);
}

export async function GET(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status');
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('limit') || '10', 10) || 10));
  const offset = (page - 1) * limit;
  const { user, db, role } = ctx;
  const subject = await resolvePortalPreviewSubject(db, user.id);

  let query = db
    .from('host_shop_match_requests')
    .select(
      `
      id, apprentice_id, host_shop_id, status, message, apprentice_notes, shop_notes, created_at, responded_at, expires_at, program_slug,
      apprentice:profiles!host_shop_match_requests_apprentice_id_fkey(id, full_name, email, avatar_url, phone),
      shop:host_shops!host_shop_match_requests_host_shop_id_fkey(id, name, address, city, state, zip_code, phone, image_url, owner_name, owner_email, owner_phone, approval_status, is_approved),
      placement:apprentice_placements!host_shop_match_requests_placement_id_fkey(id, status, start_date, student_id, shop_id, program_slug)
    `,
      { count: 'exact' },
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (subject.previewing) {
    query = query.eq('apprentice_id', subject.userId);
  } else if (PLATFORM_ADMIN_ROLES.has(role) || HOST_ROLES.has(role)) {
    const shopIds = await getAuthorizedHostShopIds(db, user.id, role);
    if (!shopIds.length) {
      return NextResponse.json({ requests: [], pagination: { page, limit, total: 0, pages: 0 } });
    }
    query = query.in('host_shop_id', shopIds);
  } else if (APPRENTICE_ROLES.has(role)) {
    query = query.eq('apprentice_id', user.id);
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    },
  });
}

export async function POST(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { user, db, profile, role } = ctx;
  if (!APPRENTICE_ROLES.has(role)) {
    return NextResponse.json({ error: 'Only apprentices or learners can request a Host Shop match.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const hostShopId = typeof body?.host_shop_id === 'string' ? body.host_shop_id.trim() : '';
  const programSlug = typeof body?.program_slug === 'string' && body.program_slug.trim()
    ? body.program_slug.trim()
    : 'barber-apprenticeship';
  const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 4000) : null;
  const apprenticeNotes = typeof body?.apprentice_notes === 'string'
    ? body.apprentice_notes.trim().slice(0, 4000)
    : null;

  if (!hostShopId) return NextResponse.json({ error: 'host_shop_id required' }, { status: 400 });

  const { data: canonicalShop } = await db
    .from('shops')
    .select('id, active, partner_id, partners!inner(id, status, approval_status, is_active)')
    .eq('id', hostShopId)
    .eq('active', true)
    .eq('partners.status', 'active')
    .eq('partners.approval_status', 'approved')
    .neq('partners.is_active', false)
    .maybeSingle();

  if (!canonicalShop) {
    return NextResponse.json({ error: 'Host Shop is not active and approved.' }, { status: 404 });
  }

  const { data: shop } = await db
    .from('host_shops')
    .select('id, name, is_accepting_apprentices, max_apprentices, approval_status, is_approved, shop_status')
    .eq('id', hostShopId)
    .maybeSingle();

  if (!shop || shop.shop_status !== 'active' || shop.approval_status !== 'approved' || shop.is_approved !== true) {
    return NextResponse.json({ error: 'Host Shop matching profile is not approved.' }, { status: 400 });
  }
  if (!shop.is_accepting_apprentices) {
    return NextResponse.json({ error: 'Shop is not accepting apprentices.' }, { status: 400 });
  }

  const { count: activePlacementCount } = await db
    .from('apprentice_placements')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', hostShopId)
    .eq('status', 'active');
  if ((activePlacementCount || 0) >= (shop.max_apprentices || 2)) {
    return NextResponse.json({ error: 'Shop has no available apprentice slots.' }, { status: 400 });
  }

  const { data: existing } = await db
    .from('host_shop_match_requests')
    .select('id')
    .eq('apprentice_id', user.id)
    .eq('host_shop_id', hostShopId)
    .is('deleted_at', null)
    .in('status', ['pending', 'approved'])
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'You already have a pending or approved request for this shop.' }, { status: 409 });
  }

  const { data, error } = await db
    .from('host_shop_match_requests')
    .insert({
      apprentice_id: user.id,
      apprentice_name: profile?.full_name || user.email || 'Apprentice',
      apprentice_email: profile?.email || user.email || null,
      apprentice_phone: profile?.phone || null,
      host_shop_id: hostShopId,
      program_slug: programSlug,
      message,
      apprentice_notes: apprenticeNotes,
      status: 'pending',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ request: data }, { status: 201 });
}
