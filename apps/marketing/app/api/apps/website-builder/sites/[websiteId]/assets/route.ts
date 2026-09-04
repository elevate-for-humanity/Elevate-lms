import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 10 * 1024 * 1024;

function extensionFor(type: string) {
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  if (type === 'image/gif') return 'gif';
  return 'jpg';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const { websiteId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const access = await getWebsiteBuilderAccess(user.id, supabase);
  if (!access.allowed) {
    return NextResponse.json({ error: 'Website Builder subscription or active trial required', reason: access.reason, upgradeUrl: access.upgradeUrl }, { status: 403 });
  }

  const admin = await requireAdminClient();
  const { data: site } = await admin
    .from('user_websites')
    .select('id, user_id')
    .eq('id', websiteId)
    .maybeSingle();
  if (!site || site.user_id !== user.id) {
    return NextResponse.json({ error: 'Website not found' }, { status: 404 });
  }

  const form = await request.formData();
  const file = form.get('file');
  const kindRaw = form.get('kind');
  const kind = typeof kindRaw === 'string' && /^(logo|hero|gallery)$/.test(kindRaw) ? kindRaw : 'gallery';
  if (!(file instanceof File)) return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: 'Use JPG, PNG, WebP, or GIF' }, { status: 415 });
  if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error: 'Image must be 10 MB or smaller' }, { status: 413 });

  const ext = extensionFor(file.type);
  const assetId = crypto.randomUUID();
  const path = `${user.id}/${websiteId}/${kind}/${assetId}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from('website-assets')
    .upload(path, bytes, { contentType: file.type, cacheControl: '31536000', upsert: false });
  if (uploadError) return NextResponse.json({ error: uploadError.message || 'Could not upload image' }, { status: 500 });

  const { data } = admin.storage.from('website-assets').getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path, kind }, { status: 201 });
}
