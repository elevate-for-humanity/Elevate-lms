/**
 * /api/admin/platform-secrets
 *
 * CRUD for platform_secrets table. Values are stored encrypted in DB.
 * Only authenticated admins can read or write.
 */
import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireRoles } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireRoles(request, ['admin', 'super_admin'], { adminOverride: false });
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('platform_secrets')
      .select('id, key, description, category, is_sensitive, last_tested, test_status, updated_at, updated_by')
      .order('category')
      .order('key');
    if (error) return safeError('Failed to load secrets', 500);
    return NextResponse.json({ secrets: data ?? [] });
  } catch (err) {
    return safeInternalError(err, 'Failed to load secrets');
  }
}

async function _POST(request: Request) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireRoles(request, ['admin', 'super_admin'], { adminOverride: false });
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => null);
    const { key, value, description, category } = body ?? {};

    if (!key || typeof key !== 'string') return safeError('key is required', 400);
    if (value === undefined || value === null) return safeError('value is required', 400);
    if (!/^[A-Z0-9_]+$/.test(key)) {
      return safeError('key must be uppercase letters, digits, and underscores only', 400);
    }

    const db = await requireAdminClient();
    const { error } = await db
      .from('platform_secrets')
      .upsert({
        key,
        value_enc: value,
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

async function _DELETE(request: Request) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireRoles(request, ['admin', 'super_admin'], { adminOverride: false });
  if (auth.error) return auth.error;

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

async function _PATCH(request: Request) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireRoles(request, ['admin', 'super_admin'], { adminOverride: false });
  if (auth.error) return auth.error;

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

export const GET = withApiAudit('/api/admin/platform-secrets', _GET);
export const POST = withApiAudit('/api/admin/platform-secrets', _POST);
export const DELETE = withApiAudit('/api/admin/platform-secrets', _DELETE);
export const PATCH = withApiAudit('/api/admin/platform-secrets', _PATCH);
