import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_PLATFORMS = ['facebook', 'instagram', 'youtube', 'linkedin'];

export async function POST(request: Request) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { platform } = await request.json();
    if (!platform || !VALID_PLATFORMS.includes(platform)) {
      return safeError('Invalid platform', 400);
    }

    const db = await requireAdminClient();
    const { error } = await db
      .from('social_media_settings')
      .delete()
      .eq('platform', platform);

    if (error) throw error;

    return NextResponse.json({ success: true, platform });
  } catch (err) {
    return safeInternalError(err, 'Failed to disconnect platform');
  }
}
