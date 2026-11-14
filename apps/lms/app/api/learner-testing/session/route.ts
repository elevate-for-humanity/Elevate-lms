import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validTestCredential } from '@/lib/ultimate-course-builder/testing/learner-test-policy';
export const dynamic = 'force-dynamic';
// AUTH: authenticated internal runner, then verified Supabase QA identity.
export async function POST(req: NextRequest) {
  if (!validTestCredential(req.headers.get('authorization')?.replace(/^Bearer /, '') ?? '', process.env.ULTIMATE_LEARNER_RUNTHROUGH_SECRET))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const db = await createClient();
  const { data: identity, error } = await db.auth.getUser(body.accessToken);
  if (error || identity.user?.app_metadata?.ultimate_learner_test !== true)
    return NextResponse.json({ error: 'Test identity required' }, { status: 403 });
  const { error: sessionError } = await db.auth.setSession({ access_token: body.accessToken, refresh_token: body.refreshToken });
  return NextResponse.json(sessionError ? { error: 'Session failed' } : { ok: true }, { status: sessionError ? 401 : 200, headers: { 'Cache-Control': 'private, no-store' } });
}
