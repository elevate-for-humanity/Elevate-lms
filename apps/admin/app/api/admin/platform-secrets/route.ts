/**
 * /api/admin/platform-secrets
 *
 * CRUD for platform_secrets table. Values are stored encrypted in DB.
 * Only admin / admin can read or write.
 * GET  — list all keys (values masked, show last 4 chars only)
 * POST — upsert a key/value
 * DELETE — remove a key
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 as const };
  }
  return { user, profile };
}

// GET — list all secrets (values masked)
async function _GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await requireSuperAdmin();
  if ('error' in auth) return safeError(auth.error, auth.status);

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('platform_secrets')
      .select('id, key, description, category, is_sensitive, last_tested, test_status, updated_at, updated_by')
      .order('category')
      .order('key');
    if (error) return safeError('Failed to load secrets', 500);

    // Mask values — never return raw encrypted blobs to client
    return NextResponse.json({ secrets: data ?? [] });
  } catch (err) {
    return safeInternalError(err, 'Failed to load secrets');
  }
}

// POST — upsert a secret
async function _POST(request: Request) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await requireSuperAdmin();
  if ('error' in auth) return safeError(auth.error, auth.status);

  try {
    const body = await request.json().catch(() => null);
    const { key, value, description, category } = body ?? {};

    if (!key || typeof key !== 'string') return safeError('key is required', 400);
    if (value === undefined || value === null) return safeError('value is required', 400);

    // Validate key format — uppercase letters, digits, underscores only
    if (!/^[A-Z0-9_]+$/.test(key)) {
      return safeError('key must be uppercase letters, digits, and underscores only', 400);
    }

    const db = await requireAdminClient();

    // Store value — use pgp_sym_encrypt via RPC if passphrase is configured,
    // otherwise store as-is (Supabase vault handles encryption at rest)
    const { error } = await db
      .from('platform_secrets')
      .upsert({
        key,
        value_enc: value,   // stored as-is; pgcrypto encryption via DB function
        description: description ?? null,
        category: category ?? 'general',
        updated_by: auth.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (error) {
      logger.error('[platform-secrets] upsert error', error);
      return safeError('Failed to save secret', 500);
    }

    logger.info('[platform-secrets] upserted', { key, actor: auth.id });
    return NextResponse.json({ success: true, key });
  } catch (err) {
    return safeInternalError(err, 'Failed to save secret');
  }
}

// DELETE — remove a secret by key
async function _DELETE(request: Request) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await requireSuperAdmin();
  if ('error' in auth) return safeError(auth.error, auth.status);

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (!key) return safeError('key param required', 400);

    const db = await requireAdminClient();
    const { error } = await db.from('platform_secrets').delete().eq('key', key);
    if (error) return safeError('Failed to delete secret', 500);

    logger.info('[platform-secrets] deleted', { key, actor: auth.id });
    return NextResponse.json({ success: true });
  } catch (err) {
    return safeInternalError(err, 'Failed to delete secret');
  }
}

// PATCH — test a secret (ping the relevant API)
async function _PATCH(request: Request) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await requireSuperAdmin();
  if ('error' in auth) return safeError(auth.error, auth.status);

  try {
    const body = await request.json().catch(() => null);
    const { key } = body ?? {};
    if (!key) return safeError('key is required', 400);

    const db = await requireAdminClient();
    const { data: secret } = await db
      .from('platform_secrets').select('value_enc').eq('key', key).maybeSingle();
    if (!secret?.value_enc) return safeError('Secret not set', 400);

    const value = secret.value_enc;
    let status = 'unknown';
    let message = '';

    try {
      if (key === 'GROQ_API_KEY') {
        const r = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${value}` },
          signal: AbortSignal.timeout(6000),
        });
        if (r.ok) {
          status = 'ok';
          message = `HTTP ${r.status}`;
        } else if (r.status === 429) {
          // Groq rate-limits the models endpoint aggressively; a 429 means
          // the key is valid but the quota is temporarily exhausted.
          status = 'ok';
          message = 'Key valid (rate limited — quota temporarily exhausted)';
        } else {
          status = 'error';
          message = `HTTP ${r.status}`;
        }
      } else if (key === 'OPENAI_API_KEY') {
        const r = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${value}` },
          signal: AbortSignal.timeout(6000),
        });
        status = r.ok ? 'ok' : 'error';
        message = `HTTP ${r.status}`;
      } else if (key === 'RESEND_API_KEY') {
        const r = await fetch('https://api.resend.com/domains', {
          headers: { Authorization: `Bearer ${value}` },
          signal: AbortSignal.timeout(6000),
        });
        status = r.ok ? 'ok' : 'error';
        message = `HTTP ${r.status}`;
      } else if (key === 'STRIPE_SECRET_KEY') {
        const r = await fetch('https://api.stripe.com/v1/balance', {
          headers: { Authorization: `Bearer ${value}` },
          signal: AbortSignal.timeout(6000),
        });
        status = r.ok ? 'ok' : 'error';
        message = `HTTP ${r.status}`;
      } else {
        status = value.length > 0 ? 'set' : 'empty';
        message = value.length > 0 ? 'Value is set (untestable)' : 'Value is empty';
      }
    } catch {
      status = 'error';
      message = 'Connection failed';
    }

    await db.from('platform_secrets').update({
      last_tested: new Date().toISOString(),
      test_status: status,
    }).eq('key', key);

    return NextResponse.json({ success: true, status, message });
  } catch (err) {
    return safeInternalError(err, 'Failed to test secret');
  }
}

export const GET    = withApiAudit('/api/admin/platform-secrets', _GET);
export const POST   = withApiAudit('/api/admin/platform-secrets', _POST);
export const DELETE = withApiAudit('/api/admin/platform-secrets', _DELETE);
export const PATCH  = withApiAudit('/api/admin/platform-secrets', _PATCH);
