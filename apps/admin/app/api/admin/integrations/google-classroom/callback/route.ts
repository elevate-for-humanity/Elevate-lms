import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  exchangeGoogleClassroomCode,
  getGoogleClassroomCredentials,
  GOOGLE_CLASSROOM_SCOPES,
} from '@/lib/integrations/google-classroom';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'auth');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  const state = request.nextUrl.searchParams.get('state');
  const storedState = request.cookies.get('google_classroom_oauth_state')?.value;
  const code = request.nextUrl.searchParams.get('code');
  if (!state || !storedState || state !== storedState || !code)
    return NextResponse.redirect(
      new URL('/integrations/google-classroom?error=invalid_oauth_response', request.url),
    );
  try {
    const tokens = await exchangeGoogleClassroomCode(code, await getGoogleClassroomCredentials());
    const db = await requireAdminClient();
    const now = new Date();
    const { data: existing } = await db
      .from('integration_tokens')
      .select('refresh_token')
      .eq('user_id', auth.id)
      .eq('provider', 'google-classroom')
      .maybeSingle();
    const { error: tokenError } = await db
      .from('integration_tokens')
      .upsert(
        {
          user_id: auth.id,
          provider: 'google-classroom',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || existing?.refresh_token || null,
          expires_at: new Date(now.getTime() + tokens.expires_in * 1000).toISOString(),
          scopes: tokens.scope || GOOGLE_CLASSROOM_SCOPES.join(' '),
          metadata: { connected_at: now.toISOString() },
          updated_at: now.toISOString(),
        },
        { onConflict: 'user_id,provider' },
      );
    if (tokenError) throw tokenError;
    const { error: integrationError } = await db
      .from('integrations')
      .upsert(
        {
          slug: 'google-classroom',
          integration: 'Google Classroom',
          status: 'authorized',
          is_active: false,
          note: 'OAuth authorized; run and verify a course synchronization.',
          updated_at: now.toISOString(),
        },
        { onConflict: 'slug' },
      );
    if (integrationError) throw integrationError;
    const response = NextResponse.redirect(
      new URL('/integrations/google-classroom?connected=true', request.url),
    );
    response.cookies.set('google_classroom_oauth_state', '', { maxAge: 0, path: '/' });
    return response;
  } catch {
    return NextResponse.redirect(
      new URL('/integrations/google-classroom?error=connection_failed', request.url),
    );
  }
}
