import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: { settings?: Record<string, string> };
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid JSON body', 400);
  }

  const { settings } = body;
  if (!settings || typeof settings !== 'object') {
    return safeError('settings object required', 400);
  }

  // Validate all keys are ferpa_dir_* to prevent arbitrary platform_settings writes
  const allowed = new Set([
    'ferpa_dir_name',
    'ferpa_dir_address',
    'ferpa_dir_phone',
    'ferpa_dir_email',
    'ferpa_dir_photo',
    'ferpa_dir_enrollment',
    'ferpa_dir_program',
    'ferpa_dir_dates',
    'ferpa_dir_degrees',
    'ferpa_dir_honors',
  ]);
  for (const key of Object.keys(settings)) {
    if (!allowed.has(key)) {
      return safeError(`Unknown setting key: ${key}`, 400);
    }
  }

  const db = await requireAdminClient();

  const upserts = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
    updated_by: auth.id,
  }));

  const { error } = await db.from('platform_settings').upsert(upserts, { onConflict: 'key' });

  if (error) return safeInternalError(error, 'Failed to save directory info settings');

  return NextResponse.json({ ok: true });
}
