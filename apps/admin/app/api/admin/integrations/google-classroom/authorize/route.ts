import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import {
  buildGoogleClassroomAuthorizationUrl,
  getGoogleClassroomCredentials,
} from '@/lib/integrations/google-classroom';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'auth');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const state = randomBytes(32).toString('base64url');
    const response = NextResponse.redirect(
      buildGoogleClassroomAuthorizationUrl(await getGoogleClassroomCredentials(), state),
    );
    response.cookies.set('google_classroom_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });
    return response;
  } catch {
    return NextResponse.redirect(
      new URL('/integrations/google-classroom?error=credentials_missing', request.url),
    );
  }
}
