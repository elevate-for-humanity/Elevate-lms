/**
 * /api/devstudio/container-env
 *
 * Northflank runtime environment sync for individual keys.
 * The dashboard stores keys in platform_secrets via /api/devstudio/env, then
 * this route pushes a selected key into the Northflank production secret group.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import {
  getNorthflankProjectId,
  getNorthflankSecretGroupId,
  isNorthflankReady,
  upsertNorthflankSecretVariable,
} from '@/lib/northflank/runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function readStoredValue(key: string): Promise<string | null> {
  const envValue = process.env[key];
  if (envValue?.trim()) return envValue.trim();

  const db = await requireAdminClient();
  const { data } = await db.from('platform_secrets').select('value_enc').eq('key', key).maybeSingle();
  return data?.value_enc?.trim() || null;
}

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  return NextResponse.json({
    provider: 'northflank',
    configured: isNorthflankReady(),
    secretGroup: getNorthflankSecretGroupId(),
    fetchedAt: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json().catch(() => null);
    const { key, value } = body ?? {};

    if (!key || typeof key !== 'string') return safeError('key is required', 400);
    if (!/^[A-Z0-9_]+$/.test(key)) return safeError('key must be uppercase letters, digits, underscores', 400);

    const projectId = getNorthflankProjectId();
    if (!projectId || !isNorthflankReady()) {
      return safeError('Northflank API credentials are not configured', 503);
    }

    const resolvedValue =
      typeof value === 'string' && value.length > 0 ? value : await readStoredValue(key);
    if (!resolvedValue) {
      return safeError(`No value found for ${key}. Save the key first, then push it to Northflank.`, 400);
    }

    const db = await requireAdminClient();
    await db.from('platform_secrets').upsert(
      {
        key,
        value_enc: resolvedValue,
        category: inferCategory(key),
        updated_by: auth.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' },
    );

    const result = await upsertNorthflankSecretVariable(projectId, key, resolvedValue);

    logger.info('[container-env] pushed to Northflank', {
      key,
      secretGroup: result.groupId,
      actor: auth.id,
    });
    return NextResponse.json({
      success: true,
      key,
      provider: 'northflank',
      secretGroup: result.groupId,
      variableCount: result.variableCount,
      updatedServices: ['lms', 'admin'],
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to push container env var to Northflank');
  }
}

export async function DELETE(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  return safeError('Delete from Northflank secret groups is not exposed here. Delete the key in /api/devstudio/env, then sync the full secret group.', 409);
}

function inferCategory(key: string): string {
  if (/^(GROQ|OPENAI|ANTHROPIC|GEMINI|AZURE_OPENAI|ELEVENLABS|HEYGEN|DID_|STABILITY|RUNWAY|SUNO)/.test(key)) return 'ai';
  if (/^(NORTHFLANK|CLOUDFLARE|R2_|REDIS|UPSTASH|SUPABASE|DATABASE|POSTGRES|VAPID|SSN_|SESSION|NEXTAUTH|CRON|AUDIT|INTERNAL|STUDIO_SHELL)/.test(key)) return 'infra';
  if (/^(STRIPE|AFFIRM|SEZZLE|QB_)/.test(key)) return 'payments';
  if (/^(SMTP|SENDGRID|RESEND|EMAIL|MAIL|REPLY_TO|ALERT_EMAIL|ADMIN_ALERT|SPONSOR_FINANCE|MOU_ARCHIVE|NOTIFY|LEAD_NOTIFICATION|LICENSE_NOTIFICATION|SECURITY_EMAIL)/.test(key)) return 'email';
  if (/^(GITHUB|GOOGLE|LINKEDIN|FACEBOOK|TWITTER|INSTAGRAM|YOUTUBE|SLACK|TWILIO|HUBSPOT|SALESFORCE|ZAPIER|CALENDLY|JOTFORM|SENTRY|DURABLE|WORKOS|ZOOM|TEAMS)/.test(key)) return 'integrations';
  return 'general';
}
