/**
 * POST /api/admin/platform-settings
 *
 * Upserts one or more key/value rows in platform_settings.
 * Used by the Site Stats editor and any other admin UI that needs
 * to write runtime config without a deploy.
 *
 * Body: { settings: Record<string, string> }
 *
 * admin only — platform_settings controls live site behaviour.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { invalidateSecuritySettingsCache } from '@/lib/admin/security-settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — read one or many keys
export async function GET(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const keys = req.nextUrl.searchParams.get('keys')?.split(',').filter(Boolean);

  try {
    const db = createAdminClient();
    let q = db.from('platform_settings').select('key, value');
    if (keys?.length) q = q.in('key', keys) as typeof q;

    const { data, error } = await q.order('key');
    if (error) return safeInternalError(error, 'Failed to read settings');

    // Return as flat object for convenience
    const result: Record<string, string> = {};
    for (const row of data ?? []) result[row.key] = row.value ?? '';

    return NextResponse.json(result);
  } catch (err) {
    return safeInternalError(err, 'Failed to read settings');
  }
}

// POST — upsert settings
export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  let body: { settings?: Record<string, string> };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.settings || typeof body.settings !== 'object') {
    return NextResponse.json({ error: 'settings object required' }, { status: 400 });
  }

  const entries = Object.entries(body.settings).filter(([k]) => k.trim());
  if (entries.length === 0) {
    return NextResponse.json({ error: 'No settings provided' }, { status: 400 });
  }

  try {
    const db = createAdminClient();

    const rows = entries.map(([key, value]) => ({
      key: key.trim(),
      value: value ?? '',
      updated_at: new Date().toISOString(),
    }));

    const { error } = await db
      .from('platform_settings')
      .upsert(rows, { onConflict: 'key' });

    if (error) return safeInternalError(error, 'Failed to save settings');

    logger.info('[platform-settings] upserted', { keys: rows.map(r => r.key), actor: auth.id });

    // Bust in-process caches so security settings take effect on the next request
    invalidateSecuritySettingsCache();

    return NextResponse.json({ ok: true, updated: rows.length });
  } catch (err) {
    return safeInternalError(err, 'Failed to save settings');
  }
}
