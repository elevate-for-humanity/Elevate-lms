import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeDbError, safeError, safeInternalError } from '@/lib/api/safe-error';
import { hydrateProcessEnv, refreshSecrets } from '@/lib/secrets';
import {
  getNorthflankProjectId,
  getNorthflankSecretGroupId,
  getNorthflankServices,
  isNorthflankReady,
  type NorthflankServiceKey,
  upsertNorthflankServiceSecretVariable,
  upsertNorthflankSecretVariable,
} from '@/lib/northflank/runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const INFRA_OWNED_KEYS = new Set(['PORT', 'HOSTNAME', 'NODE_ENV', 'SERVICE_ROLE', 'SERVICE_NAME']);
const ADMIN_ONLY_PREFIXES = /^(FACEBOOK|INSTAGRAM|LINKEDIN|YOUTUBE|GOOGLE|META_)/;

function isValidKey(key: string) {
  return /^[A-Z][A-Z0-9_]{1,127}$/.test(key);
}

function inferCategory(key: string): string {
  if (/^(GROQ|OPENAI|ANTHROPIC|GEMINI|AZURE_OPENAI|ELEVENLABS|HEYGEN|DID_|STABILITY|RUNWAY|SUNO)/.test(key)) return 'ai';
  if (/^(NORTHFLANK|CLOUDFLARE|R2_|REDIS|UPSTASH|SUPABASE|DATABASE|POSTGRES|VAPID|SSN_|SESSION|NEXTAUTH|CRON|AUDIT|INTERNAL|STUDIO_SHELL)/.test(key)) return 'infra';
  if (/^(STRIPE|AFFIRM|SEZZLE|QB_)/.test(key)) return 'payments';
  if (/^(SMTP|SENDGRID|RESEND|EMAIL|MAIL|REPLY_TO|ALERT_EMAIL|ADMIN_ALERT|SPONSOR_FINANCE|MOU_ARCHIVE|NOTIFY|LEAD_NOTIFICATION|LICENSE_NOTIFICATION|SECURITY_EMAIL)/.test(key)) return 'email';
  if (/^(GITHUB|GOOGLE|LINKEDIN|FACEBOOK|TWITTER|INSTAGRAM|YOUTUBE|SLACK|TWILIO|HUBSPOT|SALESFORCE|ZAPIER|CALENDLY|JOTFORM|SENTRY|DURABLE|WORKOS|ZOOM|TEAMS)/.test(key)) return 'integrations';
  return 'general';
}

async function readCanonicalValue(key: string) {
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('platform_secrets')
    .select('value_enc,scope')
    .eq('key', key)
    .maybeSingle();
  if (error) throw error;
  if (data?.scope && data.scope !== 'runtime') return null;
  return data?.value_enc?.trim() || process.env[key]?.trim() || null;
}

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  try {
    await hydrateProcessEnv();
    const services = getNorthflankServices();
    return NextResponse.json({
      provider: 'northflank',
      configured: isNorthflankReady(),
      projectIdConfigured: Boolean(getNorthflankProjectId()),
      secretGroup: getNorthflankSecretGroupId(),
      services: services.map(({ key, id, label }) => ({ key, id, label })),
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to inspect Northflank environment sync');
  }
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  try {
    await hydrateProcessEnv();
    const body = await req.json().catch(() => null);
    const key = String(body?.key ?? '').trim().toUpperCase();
    const suppliedValue = typeof body?.value === 'string' ? body.value : '';
    const requestedService = typeof body?.service === 'string' ? body.service.trim() : '';

    if (!isValidKey(key)) return safeError('Valid ENV-style key is required', 400);
    if (INFRA_OWNED_KEYS.has(key)) return safeError(`${key} is infrastructure-owned and cannot be changed from Studio`, 409);
    if (!getNorthflankProjectId() || !isNorthflankReady()) {
      return safeError('Northflank API credentials are not configured', 503);
    }

    const db = await requireAdminClient();
    let resolvedValue = suppliedValue.trim();
    if (!resolvedValue) {
      try {
        resolvedValue = (await readCanonicalValue(key)) ?? '';
      } catch (error) {
        return safeDbError(error as any, `Failed to load ${key}`);
      }
    }
    if (!resolvedValue) return safeError(`No runtime value found for ${key}. Save it in Studio first.`, 400);

    // Direct pushes become canonical runtime values as well; this prevents the
    // deployment provider from receiving a value that the application DB does not know about.
    const { error: saveError } = await db.from('platform_secrets').upsert(
      {
        key,
        value_enc: resolvedValue,
        scope: 'runtime',
        category: inferCategory(key),
        is_sensitive: true,
        updated_by: auth.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' },
    );
    if (saveError) return safeDbError(saveError, `Failed to persist ${key}`);

    const legacyDelete = await db.from('app_secrets').delete().eq('key', key);
    if (legacyDelete.error && legacyDelete.error.code !== '42P01') {
      return safeDbError(legacyDelete.error, `Failed to remove legacy value for ${key}`);
    }

    await refreshSecrets();
    await hydrateProcessEnv();

    const projectId = getNorthflankProjectId();
    if (!projectId) return safeError('Northflank project id is not configured', 503);

    const serviceKeys = new Set(getNorthflankServices().map((service) => service.key));
    const targetService = (requestedService || (ADMIN_ONLY_PREFIXES.test(key) ? 'admin' : '')) as NorthflankServiceKey | '';
    if (targetService && !serviceKeys.has(targetService)) return safeError('Unknown target service', 400);

    const result = targetService
      ? await upsertNorthflankServiceSecretVariable(projectId, targetService, key, resolvedValue)
      : await upsertNorthflankSecretVariable(projectId, key, resolvedValue);
    const services = targetService ? [targetService] : [...serviceKeys];

    return NextResponse.json({
      success: true,
      key,
      provider: 'northflank',
      secretGroup: result.groupId,
      variableCount: result.variableCount,
      updatedServices: services,
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to push Studio environment variable to Northflank');
  }
}

export async function DELETE(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  return safeError(
    'Northflank secret deletion is intentionally not exposed by this endpoint. Delete the canonical Studio key first, then reconcile the shared secret group through deployment configuration.',
    409,
  );
}
