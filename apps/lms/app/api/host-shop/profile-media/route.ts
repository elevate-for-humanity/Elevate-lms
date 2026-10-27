import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const VIDEO_MAX_BYTES = 100 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

function ext(file: File) {
  if (file.type === 'video/mp4') return 'mp4';
  if (file.type === 'video/webm') return 'webm';
  if (file.type === 'video/quicktime') return 'mov';
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
  if (kind !== 'logo' && kind !== 'flyer' && kind !== 'photo' && kind !== 'video') {
    return NextResponse.json({ ok: false, error: 'Choose logo, flyer, photo, or video.' }, { status: 400 });
  }
  const isVideo = kind === 'video';
  const allowedTypes = isVideo ? VIDEO_TYPES : IMAGE_TYPES;
  const maxBytes = isVideo ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
  if (!(file instanceof File) || file.size <= 0 || file.size > maxBytes || !allowedTypes.has(file.type)) {
    return NextResponse.json({ ok: false, error: isVideo ? 'Upload an MP4, WEBM, or MOV video no larger than 100 MB.' : 'Upload a JPG, PNG, WEBP, or GIF image no larger than 10 MB.' }, { status: 400 });
  }

  const db = await requireAdminClient();
  if (!isVideo) {
    try {
      const sharp = (await import('sharp')).default;
      const buffer = Buffer.from(await file.arrayBuffer());
      const metadata = await sharp(buffer, { limitInputPixels: 40_000_000 }).metadata();
      if (!metadata.width || !metadata.height) {
        return NextResponse.json({ ok: false, error: 'Image was not approved: the file is not a readable image.' }, { status: 400 });
      }
      const minWidth = kind === 'logo' ? 240 : 800;
      const minHeight = kind === 'logo' ? 120 : 450;
      if (metadata.width < minWidth || metadata.height < minHeight) {
        return NextResponse.json({ ok: false, error: `Image was not approved: ${kind === 'logo' ? 'logo' : 'shop image'} resolution is too small. Minimum ${minWidth}×${minHeight}px.` }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ ok: false, error: 'Image was not approved: the image could not be decoded. Export it as JPG, PNG, WebP, or GIF and try again.' }, { status: 400 });
    }
  }
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
  let updateError: { message: string } | null = null;
  if (kind === 'photo') {
    // Compare the previous gallery before replacing it so concurrent uploads
    // cannot silently discard another photo.
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: current, error: readError } = await db.from('partners')
        .select('media_gallery,updated_at').eq('id', partnerId).single();
      if (readError || !current) { updateError = readError || { message: 'Partner not found.' }; break; }
      const gallery = Array.isArray(current.media_gallery) ? current.media_gallery : [];
      const mutation = db.from('partners').update({
        media_gallery: [{ url: publicUrl, alt: `${board.partner?.name || 'Shop'} portfolio photo` }, ...gallery],
        updated_at: new Date().toISOString(),
      }).eq('id', partnerId);
      const { data: saved, error } = await (current.updated_at
        ? mutation.eq('updated_at', current.updated_at)
        : mutation.is('updated_at', null)).select('id');
      if (error) { updateError = error; break; }
      if (saved?.length) { updateError = null; break; }
      updateError = { message: 'Another upload updated this gallery. Please try again.' };
    }
  } else {
    const field = kind === 'logo' ? 'logo_url' : kind === 'flyer' ? 'flyer_url' : 'video_url';
    const result = await db.from('partners')
      .update({ [field]: publicUrl, updated_at: new Date().toISOString() }).eq('id', partnerId);
    updateError = result.error;
  }

  if (updateError) {
    await db.storage.from('website-assets').remove([path]);
    return NextResponse.json({ ok: false, error: `Profile update failed: ${updateError.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, kind, url: publicUrl, validation: isVideo ? 'accepted' : 'automatically_approved', reason: isVideo ? 'Supported video type and file size.' : 'Readable supported image with sufficient resolution.', publicProfile: board.partner?.approval_status === 'approved' ? `/host-shops/${(board.partner as any).public_slug || ''}` : null });
}
