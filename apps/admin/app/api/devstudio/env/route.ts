import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeDbError, safeError, safeInternalError } from '@/lib/api/safe-error';
import { refreshSecrets } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SecretScope = 'runtime' | 'build' | 'unused';

function isValidKey(key: string) {
  return /^[A-Z][A-Z0-9_]{1,127}$/.test(key);
}

function normalizeScope(scope?: string): SecretScope {
  if (scope === 'build' || scope === 'unused') return scope;
  return 'runtime';
}

function maskValue(value: string) {
  if (!value) return '••••••••';
  if (value.length <= 8) return '••••••••';
  return `••••••••${value.slice(-4)}`;
}

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('app_secrets')
      .select('key, value, scope, description, note, updated_at')
      .order('key', { ascending: true });

    // Table doesn't exist yet — return empty list rather than 500
    if (error) {
      if (error.code === '42P01') return NextResponse.json({ entries: [] });
      return safeDbError(error, 'Failed to load container environment');
    }

    const entries = (data ?? []).map((row) => ({
      key: row.key,
      scope: normalizeScope(row.scope ?? 'runtime'),
      description: row.description ?? row.note ?? '',
      masked_value: maskValue(row.value ?? ''),
      has_value: !!(row.value && row.value.length > 0),
      updated_at: row.updated_at,
    }));

    return NextResponse.json({ entries });
  } catch (err) {
    return safeInternalError(err, 'Failed to load container environment');
  }
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => null);
  const entries = body?.entries as Array<{
    key: string;
    value: string;
    scope?: string;
    description?: string;
  }> | undefined;

  if (!Array.isArray(entries) || entries.length === 0) {
    return safeError('entries array is required', 400);
  }

  if (entries.length > 50) {
    return safeError('Maximum 50 entries per request', 400);
  }

  const rows = entries.map((entry) => {
    const key = String(entry.key ?? '').trim();
    if (!isValidKey(key)) {
      throw new Error(`Invalid key format: ${key || 'empty'}`);
    }
    if (typeof entry.value !== 'string') {
      throw new Error(`Missing value for key: ${key}`);
    }
    const description = String(entry.description ?? '').trim();

    return {
      key,
      value: entry.value,
      scope: normalizeScope(entry.scope),
      note: description || null,
      description: description || null,
      updated_at: new Date().toISOString(),
    };
  });

  try {
    const db = await requireAdminClient();
    const { error } = await db.from('app_secrets').upsert(rows, { onConflict: 'key' });
    if (error) return safeDbError(error, 'Failed to save container environment');

    // Non-fatal — secrets cache refresh failure doesn't block the save response
    await refreshSecrets().catch(() => {});

    return NextResponse.json({ saved: rows.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith('Invalid key format') || message.startsWith('Missing value')) {
      return safeError(message, 400);
    }
    return safeInternalError(err, 'Failed to save container environment');
  }
}

export async function DELETE(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const key = new URL(req.url).searchParams.get('key')?.trim() || '';
  if (!isValidKey(key)) {
    return safeError('Valid key query param is required', 400);
  }

  const db = await requireAdminClient();
  const { error } = await db.from('app_secrets').delete().eq('key', key);
  if (error) return safeDbError(error, 'Failed to delete container environment key');

  await refreshSecrets().catch(() => {});

  return NextResponse.json({ deleted: key });
}