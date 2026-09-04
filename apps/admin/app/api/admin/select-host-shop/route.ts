import { NextRequest, NextResponse } from 'next/server';
import { apiRequireRoles } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createPortalPreviewHandoff } from '@/lib/admin/portal-preview-handoff';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const actor = await apiRequireRoles(request, ['admin', 'super_admin', 'org_admin'], { adminOverride: true });
  if (actor.error) return actor.error;
  const shopId = request.nextUrl.searchParams.get('shop_id')?.trim();
  if (!shopId) return NextResponse.json({ error: 'shop_id is required' }, { status: 400 });

  const db = await requireAdminClient();
  const { data: shop } = await db.from('shops').select('id,partner_id,active').eq('id', shopId).maybeSingle();
  if (!shop?.partner_id || shop.active === false) return NextResponse.json({ error: 'Active connected Host Shop not found' }, { status: 404 });

  const handoff = createPortalPreviewHandoff(actor.id, shop.partner_id);
  return NextResponse.redirect(`https://app.elevateforhumanity.org/api/admin/select-host-shop?handoff=${encodeURIComponent(handoff)}`);
}
