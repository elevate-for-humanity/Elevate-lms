import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;


async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const formData = await request.formData();
    const preferences: Record<string, boolean> = {};

    for (const [key, value] of formData.entries()) {
      if (key.startsWith('notify_')) {
        preferences[key] = value === 'on' || value === 'true';
      }
    }

    await supabase.from('profiles').upsert(
      {
        user_id: user.id,
        preferences,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    return NextResponse.redirect(
      new URL('/account/settings/notifications?success=saved', request.url),
    );
  } catch {
    return NextResponse.redirect(
      new URL('/account/settings/notifications?error=server-error', request.url),
    );
  }
}
export const POST = withApiAudit('/api/account/notifications', _POST);
