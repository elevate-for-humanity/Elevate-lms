import { safeInternalError } from '@/lib/api/safe-error';

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

async function _GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await getAdminClient();
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'super_admin'].includes(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await db.from('platform_settings').select('key, value');
  if (error) {
    logger.error('[settings] GET failed:', error.message);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }

  const settings = Object.fromEntries((data || []).map(r => [r.key, r.value]));
  return NextResponse.json({ settings });
}

async function _POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await getAdminClient();
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'super_admin'].includes(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const allowed = ['site_name', 'support_email', 'email_notifications', 'system_alerts'];
  const updates = Object.entries(body)
    .filter(([k]) => allowed.includes(k))
    .map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }));

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No valid settings provided' }, { status: 400 });
  }

  const { error } = await db
    .from('platform_settings')
    .upsert(updates, { onConflict: 'key' });

  if (error) {
    logger.error('[settings] POST failed:', error.message);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }

  logger.info('[settings] Updated by', user.id, ':', updates.map(u => u.key).join(', '));
  return NextResponse.json({ success: true });
}

export const GET = withApiAudit('/api/admin/settings', _GET, { actor_type: 'admin' });
export const POST = withApiAudit('/api/admin/settings', _POST, { actor_type: 'admin' });
