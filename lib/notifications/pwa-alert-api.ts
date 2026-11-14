import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getSecrets } from '@/lib/secrets';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { normalizeAlertSettings, isPushEndpoint } from './pwa-alert-settings';
async function identity(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return { error: limited };
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  return { user, db, isAdmin: ['admin', 'super_admin'].includes(profile?.role ?? '') };
}
export async function GET(request: NextRequest) {
  const auth = await identity(request);
  if (auth.error) return auth.error;
  const { data, error } = await auth
    .db!.from('pwa_alert_preferences')
    .select('*')
    .eq('user_id', auth.user!.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Alert settings unavailable' }, { status: 503 });
  const config = await getSecrets(['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY']);
  const publicKey = config.VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || '';
  return NextResponse.json(
    {
      settings: normalizeAlertSettings(data),
      publicKey,
      pushConfigured: Boolean(
        publicKey && (config.VAPID_PRIVATE_KEY || process.env.VAPID_PRIVATE_KEY),
      ),
      isAdmin: auth.isAdmin,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
export async function PUT(request: NextRequest) {
  const auth = await identity(request);
  if (auth.error) return auth.error;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid settings' }, { status: 400 });
  }
  const settings = normalizeAlertSettings(body);
  if (
    !auth.isAdmin &&
    (settings.student_sign_in || settings.student_sign_out || settings.student_inactive)
  )
    return NextResponse.json(
      { error: 'Student monitoring settings require an administrator' },
      { status: 403 },
    );
  const { error } = await auth
    .db!.from('pwa_alert_preferences')
    .upsert(
      { user_id: auth.user!.id, ...settings, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
  return error
    ? NextResponse.json({ error: 'Alert settings could not be saved' }, { status: 503 })
    : NextResponse.json({ settings });
}
export async function registerDevice(request: NextRequest) {
  const auth = await identity(request);
  if (auth.error) return auth.error;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid device subscription' }, { status: 400 });
  }
  if (
    !isPushEndpoint(body.endpoint) ||
    !['p256dh', 'auth'].every(
      (k) =>
        typeof body.keys?.[k] === 'string' && /^[A-Za-z0-9_-]{16,256}={0,2}$/.test(body.keys[k]),
    )
  )
    return NextResponse.json(
      { error: 'Unsupported or invalid push subscription' },
      { status: 400 },
    );
  const { error } = await auth
    .db!.from('push_subscriptions')
    .upsert(
      {
        user_id: auth.user!.id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,endpoint' },
    );
  return error
    ? NextResponse.json({ error: 'Device subscription could not be saved' }, { status: 503 })
    : NextResponse.json({ success: true });
}
