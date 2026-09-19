/**
 * Admin Environment Manager API.
 *
 * This route lives in the dedicated Admin app so /integrations/env-manager
 * does not depend on the retired apps/app container.
 *
 * Non-secret settings live in platform_settings. Secret-looking keys are
 * transparently routed to encrypted platform_secrets so the fields rendered by
 * the Environment Manager actually persist to the canonical runtime store.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { refreshSecrets } from '@/lib/secrets';

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
  const [{ data, error }, { data: secrets, error: secretError }] = await Promise.all([
    db.from('platform_settings').select('key, value, updated_at').order('key'),
    db.from('platform_secrets').select('key, updated_at').order('key'),
  ]);

  if (error) return safeDbError(error, 'Failed to load settings');
  if (secretError) return safeDbError(secretError, 'Failed to load encrypted secrets');

  return NextResponse.json({
    settings: [
      ...(data ?? []).map((row) => ({
        key: row.key,
        value: maskValue(row.key, row.value ?? ''),
        is_secret: isSecret(row.key),
        updated_at: row.updated_at,
      })),
      ...(secrets ?? []).map((row) => ({
        key: row.key,
        value: '••••••••',
        is_secret: true,
        updated_at: row.updated_at,
      })),
    ],
    secretWritePolicy: 'encrypted-platform-secrets',
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
    if (entry.value === undefined || entry.value === null) {
      return safeError(`Missing value for key: ${key}`, 400);
    }
  }

  const settingRows = body.entries
    .filter((entry) => !isSecret(entry.key!.trim()))
    .map((entry) => ({
      key: entry.key!.trim(),
      value: entry.value!,
      updated_at: new Date().toISOString(),
      updated_by: auth.id,
    }));
  const secretRows = body.entries
    .filter((entry) => isSecret(entry.key!.trim()))
    .map((entry) => ({
      key: entry.key!.trim(),
      value_enc: entry.value!,
      scope: 'runtime',
      category: 'integrations',
      is_sensitive: true,
      updated_at: new Date().toISOString(),
      updated_by: auth.id,
    }));

  const db = await requireAdminClient();
  if (settingRows.length) {
    const { error } = await db.from('platform_settings').upsert(settingRows, { onConflict: 'key' });
    if (error) return safeDbError(error, 'Failed to save settings');
  }
  if (secretRows.length) {
    const { error } = await db.from('platform_secrets').upsert(secretRows, { onConflict: 'key' });
    if (error) return safeDbError(error, 'Failed to save encrypted secrets');
    await refreshSecrets();
  }

  const keys = body.entries.map((entry) => entry.key!.trim());
  await auditWrite(auth.id, 'upsert', keys);
  return NextResponse.json({ saved: keys.length, encrypted: secretRows.length });
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
    return safeError(
      'Secret credentials must be removed from the owning runtime environment.',
      400,
    );
  }

  const db = await requireAdminClient();
  const { error } = await db.from('platform_settings').delete().eq('key', key);
  if (error) return safeDbError(error, 'Failed to delete setting');

  await auditWrite(auth.id, 'delete', [key]);
  return NextResponse.json({ deleted: key });
}
