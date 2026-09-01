import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeDbError, safeError, safeInternalError } from '@/lib/api/safe-error';
import { refreshSecrets } from '@/lib/secrets';
import { requireTypedConfirmation } from '@/lib/security/require-confirmation';

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
  if (!value || value.length <= 8) return '••••••••';
  return `••••••••${value.slice(-4)}`;
}

function inferCategory(key: string): string {
  if (/^(GROQ|OPENAI|ANTHROPIC|GEMINI|AZURE_OPENAI|ELEVENLABS|HEYGEN|DID_|STABILITY|RUNWAY|SUNO)/.test(key)) return 'ai';
  if (/^(NORTHFLANK|CLOUDFLARE|R2_|REDIS|UPSTASH|SUPABASE|DATABASE|POSTGRES|VAPID|SSN_|SESSION|NEXTAUTH|CRON|AUDIT|INTERNAL|STUDIO_SHELL)/.test(key)) return 'infra';
  if (/^(STRIPE|AFFIRM|SEZZLE|QB_)/.test(key)) return 'payments';
  if (/^(SMTP|SENDGRID|RESEND|EMAIL|MAIL|REPLY_TO|ALERT_EMAIL|ADMIN_ALERT|SPONSOR_FINANCE|MOU_ARCHIVE|NOTIFY|LEAD_NOTIFICATION|LICENSE_NOTIFICATION|SECURITY_EMAIL)/.test(key)) return 'email';
  if (/^(GITHUB|GOOGLE|LINKEDIN|FACEBOOK|TWITTER|INSTAGRAM|YOUTUBE|SLACK|TWILIO|HUBSPOT|SALESFORCE|ZAPIER|CALENDLY|JOTFORM|SENTRY|DURABLE|WORKOS|ZOOM|TEAMS)/.test(key)) return 'integrations';
  return 'general';
}

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('platform_secrets')
      .select('key,value_enc,scope,description,category,updated_at')
      .order('key', { ascending: true });

    if (error) return safeDbError(error, 'Failed to load Studio environment');

    const entries = (data ?? []).map((row) => ({
      key: row.key,
      scope: normalizeScope(row.scope),
      description: row.description ?? '',
      category: row.category ?? inferCategory(row.key),
      masked_value: maskValue(row.value_enc ?? ''),
      has_value: Boolean(row.value_enc?.length),
      updated_at: row.updated_at,
      source: 'platform_secrets',
    }));

    return NextResponse.json({ entries, source: 'platform_secrets' });
  } catch (error) {
    return safeInternalError(error, 'Failed to load Studio environment');
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

  if (!Array.isArray(entries) || entries.length === 0) return safeError('entries array is required', 400);
  if (entries.length > 50) return safeError('Maximum 50 entries per request', 400);

  try {
    const rows = entries.map((entry) => {
      const key = String(entry.key ?? '').trim().toUpperCase();
      if (!isValidKey(key)) throw new Error(`Invalid key format: ${key || 'empty'}`);
      if (typeof entry.value !== 'string' || entry.value.length === 0) {
        throw new Error(`Missing value for key: ${key}`);
      }
      const description = String(entry.description ?? '').trim();
      return {
        key,
        value_enc: entry.value,
        scope: normalizeScope(entry.scope),
        description: description || null,
        category: inferCategory(key),
        is_sensitive: true,
        updated_by: auth.id,
        updated_at: new Date().toISOString(),
      };
    });

    const db = await requireAdminClient();
    const { error } = await db.from('platform_secrets').upsert(rows, { onConflict: 'key' });
    if (error) return safeDbError(error, 'Failed to save Studio environment');

    // Remove matching legacy values so deleting the canonical value later cannot
    // silently resurrect an old app_secrets value through the hydration fallback.
    const keys = rows.map((row) => row.key);
    const legacyDelete = await db.from('app_secrets').delete().in('key', keys);
    if (legacyDelete.error && legacyDelete.error.code !== '42P01') {
      return safeDbError(legacyDelete.error, 'Canonical secrets saved but legacy cleanup failed');
    }

    await refreshSecrets();
    return NextResponse.json({ saved: rows.length, source: 'platform_secrets' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('Invalid key format') || message.startsWith('Missing value')) {
      return safeError(message, 400);
    }
    return safeInternalError(error, 'Failed to save Studio environment');
  }
}

export async function DELETE(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const key = req.nextUrl.searchParams.get('key')?.trim().toUpperCase() ?? '';
  if (!isValidKey(key)) return safeError('Valid key query param is required', 400);
  const confirmation = requireTypedConfirmation(req.headers.get('x-confirmation'), 'delete_secret');
  if (!confirmation.ok) {
    return NextResponse.json({ error: 'Deleting a canonical secret requires typed confirmation.', requiredConfirmation: confirmation.required }, { status: 409 });
  }

  try {
    const db = await requireAdminClient();
    const { error } = await db.from('platform_secrets').delete().eq('key', key);
    if (error) return safeDbError(error, 'Failed to delete Studio environment key');

    const legacyDelete = await db.from('app_secrets').delete().eq('key', key);
    if (legacyDelete.error && legacyDelete.error.code !== '42P01') {
      return safeDbError(legacyDelete.error, 'Canonical secret deleted but legacy cleanup failed');
    }

    await refreshSecrets();
    return NextResponse.json({ deleted: key, source: 'platform_secrets' });
  } catch (error) {
    return safeInternalError(error, 'Failed to delete Studio environment key');
  }
}
