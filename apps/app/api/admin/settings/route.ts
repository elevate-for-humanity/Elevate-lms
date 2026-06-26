import { safeInternalError } from '@/lib/api/safe-error';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

async function _GET(_req: NextRequest) {
  const rateLimited = await applyRateLimit(_req, 'api');
  if (rateLimited) return rateLimited;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!['admin'].includes(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await db.from('platform_settings').select('key, value');
  if (error) {
    logger.error('[settings] GET failed:', error.message);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }

  const settings = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
  return NextResponse.json({ settings });
}

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!['admin'].includes(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();

  // Accept both payload shapes:
  //   { settings: Record<string, string> }  — canonical (used by SettingsFormClient)
  //   { entries: {key,value}[] }            — legacy (used by GeneralSettingsClient)
  //   flat object                           — legacy fallback
  let rawPairs: [string, string][];
  if (body.settings && typeof body.settings === 'object') {
    rawPairs = Object.entries(body.settings).map(([k, v]) => [k, String(v)]);
  } else if (Array.isArray(body.entries)) {
    rawPairs = body.entries
      .filter((e: any) => e?.key)
      .map((e: any) => [String(e.key), String(e.value ?? '')]);
  } else {
    rawPairs = Object.entries(body).map(([k, v]) => [k, String(v)]);
  }

  const allowed = [
    'site_name', 'support_email', 'contact_phone', 'timezone',
    'email_notifications', 'system_alerts',
    'sms_notifications', 'slack_webhook',
    'stripe_mode', 'currency', 'payment_methods',
    'email_from_name', 'email_from_address', 'email_provider',
    'mfa_required', 'session_timeout', 'ip_allowlist',
  ];

  const updates = rawPairs
    .filter(([k]) => allowed.includes(k.trim()))
    .map(([key, value]) => ({
      key: key.trim(),
      value,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }));

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No valid settings provided' }, { status: 400 });
  }

  const { error } = await db.from('platform_settings').upsert(updates, { onConflict: 'key' });

  if (error) {
    logger.error('[settings] POST failed:', error.message);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }

  logger.info('[settings] Updated by', user.id, ':', updates.map((u) => u.key).join(', '));
  return NextResponse.json({ success: true });
}

export const GET = withApiAudit('/api/admin/settings', _GET, { actor_type: 'admin' });
export const POST = withApiAudit('/api/admin/settings', _POST, { actor_type: 'admin' });
