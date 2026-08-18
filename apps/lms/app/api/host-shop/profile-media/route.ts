import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function ext(file: File) {
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'image/gif') return 'gif';
  return 'jpg';
}

export async function POST(request: NextRequest) {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);
  const partnerId = board.partner?.id;
  if (!partnerId) return NextResponse.json({ ok: false, error: 'Host Shop partner record not found.' }, { status: 404 });

  const form = await request.formData();
  const kind = String(form.get('kind') || '');
  const file = form.get('file');
  if (kind !== 'logo' && kind !== 'flyer') {
    return NextResponse.json({ ok: false, error: 'Choose logo or flyer.' }, { status: 400 });
  }
  if (!(file instanceof File) || file.size <= 0 || file.size > MAX_BYTES || !ALLOWED.has(file.type)) {
    return NextResponse.json({ ok: false, error: 'Upload a JPG, PNG, WEBP, or GIF image no larger than 10 MB.' }, { status: 400 });
  }

  const db = await requireAdminClient();
  const path = `host-shops/${partnerId}/${kind}-${Date.now()}.${ext(file)}`;
  const { error: uploadError } = await db.storage.from('website-assets').upload(path, file, {
    contentType: file.type,
    upsert: false,
    cacheControl: '3600',
  });
  if (uploadError) {
    return NextResponse.json({ ok: false, error: `Media upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: publicData } = db.storage.from('website-assets').getPublicUrl(path);
  const publicUrl = publicData.publicUrl;
  const field = kind === 'logo' ? 'logo_url' : 'flyer_url';
  const { error: updateError } = await db
    .from('partners')
    .update({ [field]: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', partnerId);

  if (updateError) {
    await db.storage.from('website-assets').remove([path]);
    return NextResponse.json({ ok: false, error: `Profile update failed: ${updateError.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, kind, url: publicUrl, publicProfile: board.partner?.approval_status === 'approved' ? `/host-shops/${(board.partner as any).public_slug || ''}` : null });
}
