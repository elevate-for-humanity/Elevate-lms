/**
 * Admin Environment Manager API. Credentials are encrypted in platform_secrets.
 * Runtime values are persisted in the encrypted platform secret store; Google runtime deployment consumes the canonical values.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { refreshSecrets } from '@/lib/secrets';
import {
  isElevateMediaRuntimeKey,
  validateElevateMediaUpdates,
} from '@/lib/northflank/elevate-media-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SECRET_PATTERNS = [
  /key$/i, /secret$/i, /token$/i, /password$/i, /pass$/i, /api_key/i,
  /private/i, /auth/i, /sid$/i, /dsn$/i, /salt$/i, /encryption/i, /webhook/i,
];

function isSecret(key: string): boolean {
  return key.startsWith('AGENT_MEMORY_') || key === 'ELEVATE_MEDIA_ACCESS_KEY_ID' ||
    SECRET_PATTERNS.some((pattern) => pattern.test(key));
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
        key: row.key, value: maskValue(row.key, row.value ?? ''),
        is_secret: isSecret(row.key), updated_at: row.updated_at,
      })),
      ...(secrets ?? []).map((row) => ({
        key: row.key, value: '••••••••', is_secret: true, updated_at: row.updated_at,
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

  let body: { entries?: { key?: string; value?: string }[] } | null;
  try {
    body = await req.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }
  if (!body || !Array.isArray(body.entries) || body.entries.length === 0) {
    return safeError('entries array required', 400);
  }
  if (body.entries.length > 50) return safeError('Maximum 50 entries per request', 400);
  const seen = new Set<string>();
  for (const entry of body.entries) {
    if (!entry || typeof entry.key !== 'string' || typeof entry.value !== 'string') {
      return safeError('Each entry must have a string key and value', 400);
    }
    const key = entry.key.trim();
    if (!isAllowedKey(key)) return safeError('Invalid key format', 400);
    if (seen.has(key)) return safeError('Duplicate settings are not allowed', 400);
    seen.add(key);
    if ((key.startsWith('ELEVATE_MEDIA_') || key.startsWith('NEXT_PUBLIC_ELEVATE_MEDIA_')) &&
        !isElevateMediaRuntimeKey(key)) {
      return safeError('Unsupported Elevate Media setting; credentials must be server-only', 400);
    }
  }
  const entries = body.entries.map((entry) => ({ key: entry.key!.trim(), value: entry.value! }));
  const mediaUpdates = Object.fromEntries(
    entries.filter((entry) => isElevateMediaRuntimeKey(entry.key)).map(({ key, value }) => [key, value]),
  );
  try {
    validateElevateMediaUpdates(mediaUpdates);
  } catch (error) {
    return safeError(error instanceof Error ? error.message : 'Invalid Elevate Media settings', 400);
  }
  const settingRows = entries.filter((entry) => !isSecret(entry.key)).map((entry) => ({
    ...entry, updated_at: new Date().toISOString(), updated_by: auth.id,
  }));
  const secretEntries = entries.filter((entry) => isSecret(entry.key));
  const db = await requireAdminClient();
  if (settingRows.length) {
    const { error } = await db.from('platform_settings').upsert(settingRows, { onConflict: 'key' });
    if (error) return safeDbError(error, 'Failed to save settings');
  }
  if (secretEntries.length) {
    for (const entry of secretEntries) {
      const { error } = await db.rpc('set_platform_secret', {
        p_key: entry.key, p_value: entry.value,
        p_description: `Updated through Admin Environment Manager by ${auth.id}`,
        p_category: 'integrations',
      });
      if (error) return safeDbError(error, `Failed to save encrypted secret ${entry.key}`);
    }
    await refreshSecrets();
  }
  const keys = entries.map((entry) => entry.key);
  // Persistence must remain auditable even when the external sync fails.
  await auditWrite(auth.id, 'upsert', keys);

  const runtimeSync = entries.some(entry=>entry.key.startsWith('AGENT_MEMORY_') || isElevateMediaRuntimeKey(entry.key))
    ? 'google-on-next-deploy' : 'not-requested';
  return NextResponse.json({
        error: 'Iris settings were encrypted in Supabase Vault, but Northflank control-plane access is not configured.',
        vaultSaved: true, runtimeSynced: false,
      }, { status: 503 });
    }
    for (const entry of agentMemoryEntries) {
      await upsertNorthflankServiceSecretVariable(projectId, 'admin', entry.key, entry.value);
    }
    runtimeSync = 'admin';
  }

  let mediaRuntimeSync: Awaited<ReturnType<typeof syncElevateMediaToNorthflank>> | null = null;
  if (Object.keys(mediaUpdates).length) {
    try {
      mediaRuntimeSync = await syncElevateMediaToNorthflank(mediaUpdates);
      runtimeSync = 'admin+lms';
    } catch {
      // A saved credential is not proof of a working Northflank/B2 connection.
      // Do not log provider response bodies or the credential-bearing request.
      logger.warn('[admin/env-vars] Elevate Media Northflank verification failed', { keys });
      return NextResponse.json({
        error: 'Settings were saved, but Elevate Media synchronization to Northflank could not be verified. Check Northflank access and overriding service variables before retrying. No bucket connection was tested and no restart was triggered.',
        settingsSaved: true, saved: keys.length, encrypted: secretEntries.length,
        runtimeSynced: false, configurationVerified: false,
        bucketConnectionTested: false,
      }, { status: 503 });
    }
  }
  return NextResponse.json({
    saved: keys.length, encrypted: secretEntries.length, runtimeSync,
    message: 'Settings saved in the canonical encrypted store. Google production consumes these values through the deployment secret binding.',
  });
}

export async function DELETE(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const key = new URL(req.url).searchParams.get('key')?.trim();
  if (!key) return safeError('key query param required', 400);
  if (!isAllowedKey(key)) return safeError(`Invalid key format: ${key}`, 400);
  if (isSecret(key) || isElevateMediaRuntimeKey(key)) {
    return safeError('Runtime-backed settings must be removed from both the owning runtime and saved settings.', 400);
  }
  const db = await requireAdminClient();
  const { error } = await db.from('platform_settings').delete().eq('key', key);
  if (error) return safeDbError(error, 'Failed to delete setting');
  await auditWrite(auth.id, 'delete', [key]);
  return NextResponse.json({ deleted: key });
}
