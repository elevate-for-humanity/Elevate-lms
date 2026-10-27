import { NextRequest, NextResponse } from 'next/server';
import { apiRequireRoles } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createPortalPreviewHandoff } from '@/lib/admin/portal-preview-handoff';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function createPreview(request: NextRequest, shopId: string) {
  const actor = await apiRequireRoles(request, ['admin', 'super_admin', 'org_admin'], {
    adminOverride: true,
  });
  if (actor.error) return actor.error;
  if (!shopId) return NextResponse.json({ error: 'shop_id is required' }, { status: 400 });

  const db = await requireAdminClient();
  const { data: shop } = await db
    .from('shops')
    .select('id,partner_id,active')
    .eq('id', shopId)
    .maybeSingle();
  if (!shop?.partner_id || shop.active === false)
    return NextResponse.json({ error: 'Active connected Host Shop not found' }, { status: 404 });

  const handoff = createPortalPreviewHandoff(actor.id, shop.partner_id);
  return NextResponse.json({
    preview_url: 'https://app.elevateforhumanity.org/api/admin/select-host-shop',
    preview_handoff: handoff,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  return createPreview(request, String(body?.shop_id || '').trim());
}

export async function GET(request: NextRequest) {
  return createPreview(request, request.nextUrl.searchParams.get('shop_id')?.trim() || '');
}
