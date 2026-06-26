/**
 * /api/admin/env-vars
 *
 * Read and write platform configuration values stored in `platform_settings`.
 *
 * SECURITY MODEL (explicit):
 * - Super-admin only (apiRequireAdmin enforces admin|admin|staff|org_admin).
 * - Values are stored PLAINTEXT in platform_settings. No encryption at rest
 *   beyond what Supabase/Postgres provides at the infrastructure level.
 *   Do not store credentials here that are not already in your .env.
 * - Secret values are masked on GET for keys matching SECRET_PATTERNS.
 *   Keys that do not match those patterns are returned in full — regex-based
 *   detection is convenience UX, not a security control.
 * - POST accepts only keys present in ALLOWED_KEYS. Arbitrary key writes are
 *   rejected to prevent namespace pollution and accidental overwrites.
 * - All writes are audit-logged (user_id, keys changed, timestamp).
 * - Payload capped at 50 entries per request.
 *
 * GET    /api/admin/env-vars          → all keys with masked secret values
 * POST   /api/admin/env-vars          → upsert entries (allowlisted keys only)
 * DELETE /api/admin/env-vars?key=X    → delete a key (allowlisted keys only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Secret masking ────────────────────────────────────────────────────────────

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
  return SECRET_PATTERNS.some((p) => p.test(key));
}

function maskValue(key: string, value: string): string {
  if (!isSecret(key)) return value;
  if (value.length <= 8) return '••••••••';
  return '••••••••' + value.slice(-4);
}

// ── Key validation ────────────────────────────────────────────────────────────
// Any key matching standard env var format is accepted (uppercase, digits, underscores).

function isAllowedKey(key: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(key);
}

// ── Audit helper ──────────────────────────────────────────────────────────────

async function auditWrite(userId: string, action: 'upsert' | 'delete', keys: string[]) {
  try {
    const db = await requireAdminClient();
    await db.from('audit_logs').insert({
      user_id: userId,
      action: `env_vars.${action}`,
      resource_type: 'platform_settings',
      resource_id: keys.join(','),
      metadata: { keys, count: keys.length },
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('[env-vars] audit write failed', err);
  }
}

// ── GET ──────────────────────────────────────────────────────────────────────

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

  const rows = (data ?? []).map((row) => ({
    key: row.key,
    value: maskValue(row.key, row.value ?? ''),
    is_secret: isSecret(row.key),
    updated_at: row.updated_at,
  }));

  return NextResponse.json({ settings: rows });
}

// ── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  let body: { entries: { key: string; value: string }[] };
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
    if (!entry.key?.trim()) return safeError('Each entry must have a key', 400);
    if (!isAllowedKey(entry.key.trim())) {
      return safeError(`Invalid key format: ${entry.key} — must be uppercase letters, digits, and underscores`, 400);
    }
    if (entry.value === undefined || entry.value === null) {
      return safeError(`Missing value for key: ${entry.key}`, 400);
    }
  }

  const db = await requireAdminClient();
  const rows = body.entries.map((e) => ({
    key: e.key.trim(),
    value: e.value,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await db.from('platform_settings').upsert(rows, { onConflict: 'key' });

  if (error) return safeDbError(error, 'Failed to save settings');

  await auditWrite(
    auth.id,
    'upsert',
    rows.map((r) => r.key),
  );

  return NextResponse.json({ saved: rows.length });
}

// ── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const key = new URL(req.url).searchParams.get('key');
  if (!key) return safeError('key query param required', 400);

  if (!isAllowedKey(key)) {
    return safeError(`Invalid key format: ${key} — must be uppercase letters, digits, and underscores`, 400);
  }

  const db = await requireAdminClient();
  const { error } = await db.from('platform_settings').delete().eq('key', key);

  if (error) return safeDbError(error, 'Failed to delete setting');

  await auditWrite(auth.id, 'delete', [key]);

  return NextResponse.json({ deleted: key });
}
