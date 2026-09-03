/**
 * Admin Environment Manager API.
 *
 * This route lives in the dedicated Admin app so /integrations/env-manager
 * does not depend on the retired apps/app container.
 *
 * platform_settings is plaintext configuration storage. Secret-looking keys
 * may be read in masked form for legacy visibility, but they cannot be written
 * here. Production secrets must be configured in the owning runtime service
 * environment (Northflank) and the service redeployed when necessary.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SECRET_PATTERNS = [
  /key$/i,
  /secret$/i,
  /token$/i,
  /password$/i,
  /pass$/i,
  /api_key/i,
  /private/i,
  /auth/i,
  /sid$/i,
  /dsn$/i,
  /salt$/i,
  /encryption/i,
  /webhook/i,
];

function isSecret(key: string): boolean {
  return SECRET_PATTERNS.some((pattern) => pattern.test(key));
}

function maskValue(key: string, value: string): string {
  if (!isSecret(key)) return value;
  if (value.length <= 8) return '••••••••';
  return `••••••••${value.slice(-4)}`;
}

function isAllowedKey(key: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(key);
}

async function auditWrite(userId: string, action: 'upsert' | 'delete', keys: string[]) {
  try {
    const db = await requireAdminClient();
    await db.from('audit_logs').insert({
      user_id: userId,
      action: `env_vars.${action}`,
      resource_type: 'platform_settings',
      resource_id: keys.join(','),
      metadata: { keys, count: keys.length, source: 'admin-env-manager' },
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[admin/env-vars] audit write failed', error);
  }
}

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('platform_settings')
    .select('key, value, updated_at')
    .order('key');

  if (error) return safeDbError(error, 'Failed to load settings');

  return NextResponse.json({
    settings: (data ?? []).map((row) => ({
      key: row.key,
      value: maskValue(row.key, row.value ?? ''),
      is_secret: isSecret(row.key),
      updated_at: row.updated_at,
    })),
    secretWritePolicy: 'runtime-environment-only',
  });
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  let body: { entries?: { key?: string; value?: string }[] };
  try {
    body = await req.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  if (!Array.isArray(body.entries) || body.entries.length === 0) {
    return safeError('entries array required', 400);
  }
  if (body.entries.length > 50) {
    return safeError('Maximum 50 entries per request', 400);
  }

  for (const entry of body.entries) {
    const key = entry.key?.trim() ?? '';
    if (!key) return safeError('Each entry must have a key', 400);
    if (!isAllowedKey(key)) {
      return safeError(`Invalid key format: ${key}`, 400);
    }
    if (isSecret(key)) {
      return safeError(
        `${key} is a secret credential. Configure it in the owning Northflank service environment, not plaintext platform_settings.`,
        400,
      );
    }
    if (entry.value === undefined || entry.value === null) {
      return safeError(`Missing value for key: ${key}`, 400);
    }
  }

  const rows = body.entries.map((entry) => ({
    key: entry.key!.trim(),
    value: entry.value!,
    updated_at: new Date().toISOString(),
    updated_by: auth.id,
  }));

  const db = await requireAdminClient();
  const { error } = await db.from('platform_settings').upsert(rows, { onConflict: 'key' });
  if (error) return safeDbError(error, 'Failed to save settings');

  await auditWrite(auth.id, 'upsert', rows.map((row) => row.key));
  return NextResponse.json({ saved: rows.length });
}

export async function DELETE(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const key = new URL(req.url).searchParams.get('key')?.trim();
  if (!key) return safeError('key query param required', 400);
  if (!isAllowedKey(key)) return safeError(`Invalid key format: ${key}`, 400);
  if (isSecret(key)) {
    return safeError('Secret credentials must be removed from the owning runtime environment.', 400);
  }

  const db = await requireAdminClient();
  const { error } = await db.from('platform_settings').delete().eq('key', key);
  if (error) return safeDbError(error, 'Failed to delete setting');

  await auditWrite(auth.id, 'delete', [key]);
  return NextResponse.json({ deleted: key });
}
