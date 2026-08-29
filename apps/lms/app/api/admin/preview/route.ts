import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { PORTAL_PREVIEW_COOKIE } from '@/lib/admin/portal-preview';

const ADMIN_ROLES = new Set(['admin', 'super_admin']);

export async function GET(request: NextRequest) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org').replace(/\/$/, '');
  const targetUserId = request.nextUrl.searchParams.get('user_id')?.trim();
  const userDb = await createClient();
  const { data: { user } } = await userDb.auth.getUser();
  if (!user) {
    const previewPath = targetUserId
      ? `/api/admin/preview?user_id=${encodeURIComponent(targetUserId)}`
      : '/api/admin/preview';
    return NextResponse.redirect(
      `${appUrl}/login?redirect=${encodeURIComponent(previewPath)}`,
    );
  }

  const db = await requireAdminClient();
  const { data: actor } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!ADMIN_ROLES.has(String(actor?.role || ''))) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (request.nextUrl.searchParams.get('end') === '1') {
    const response = NextResponse.redirect('https://admin.elevateforhumanity.org/impersonate');
    response.cookies.set(PORTAL_PREVIEW_COOKIE, '', { expires: new Date(0), path: '/' });
    return response;
  }

  if (!targetUserId) return NextResponse.json({ error: 'user_id is required' }, { status: 400 });

  const { data: target } = await db.from('profiles').select('id,role').eq('id', targetUserId).maybeSingle();
  if (!target?.id || ADMIN_ROLES.has(String(target.role || ''))) {
    return NextResponse.json({ error: 'Eligible preview user not found' }, { status: 404 });
  }

  const response = NextResponse.redirect(`${appUrl}/apprentice`);
  response.cookies.set(PORTAL_PREVIEW_COOKIE, target.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60,
    path: '/',
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(PORTAL_PREVIEW_COOKIE, '', { expires: new Date(0), path: '/' });
  return response;
}
