/**
 * POST /api/devstudio/import-ssm
 *
 * Legacy AWS helper: pulls all parameters from AWS SSM at /elevate/* and upserts them into
 * platform_secrets. AWS credentials are read from platform_secrets first,
 * falling back to process.env.
 *
 * Super admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SSMClient, GetParametersByPathCommand } from '@aws-sdk/client-ssm';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function resolveSecret(db: Awaited<ReturnType<typeof requireAdminClient>>, key: string): Promise<string | null> {
  const envVal = process.env[key];
  if (envVal?.trim()) return envVal.trim();
  const { data } = await db
    .from('platform_secrets')
    .select('value_enc')
    .eq('key', key)
    .maybeSingle();
  return data?.value_enc?.trim() || null;
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();

    const accessKeyId     = await resolveSecret(db, 'AWS_ACCESS_KEY_ID');
    const secretAccessKey = await resolveSecret(db, 'AWS_SECRET_ACCESS_KEY');
    const region          = await resolveSecret(db, 'AWS_REGION') ?? 'us-east-1';

    if (!accessKeyId || !secretAccessKey) {
      return safeError('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set in platform_secrets before importing', 400);
    }

    const ssm = new SSMClient({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    // Paginate through all /elevate/* parameters
    const params: { key: string; value: string }[] = [];
    let nextToken: string | undefined;

    do {
      const cmd = new GetParametersByPathCommand({
        Path: '/elevate/',
        WithDecryption: true,
        Recursive: true,
        NextToken: nextToken,
      });
      const res = await ssm.send(cmd);
      for (const p of res.Parameters ?? []) {
        if (p.Name && p.Value) {
          params.push({
            key: p.Name.replace('/elevate/', ''),
            value: p.Value,
          });
        }
      }
      nextToken = res.NextToken;
    } while (nextToken);

    if (params.length === 0) {
      return safeError('No parameters found at /elevate/ in SSM', 404);
    }

    // Upsert all into platform_secrets
    const now = new Date().toISOString();
    const rows = params.map(({ key, value }) => ({
      key,
      value_enc: value,
      category: inferCategory(key),
      updated_by: auth.id,
      updated_at: now,
    }));

    const { error } = await db
      .from('platform_secrets')
      .upsert(rows, { onConflict: 'key' });

    if (error) {
      logger.error('[import-ssm] upsert error', error);
      return safeError('Failed to save secrets to platform_secrets', 500);
    }

    logger.info('[import-ssm] imported', { count: params.length, actor: auth.id });
    return NextResponse.json({ success: true, imported: params.length });

  } catch (err) {
    return safeInternalError(err, 'SSM import failed');
  }
}

function inferCategory(key: string): string {
  if (/^(GROQ|OPENAI|ANTHROPIC|GEMINI|AZURE_OPENAI|ELEVENLABS|HEYGEN|DID_|STABILITY|RUNWAY|SUNO)/.test(key)) return 'ai';
  if (/^(AWS|CLOUDFLARE|R2_|REDIS|UPSTASH|SUPABASE|DATABASE|POSTGRES|VAPID|SSN_|SESSION|NEXTAUTH|CRON|AUDIT|INTERNAL|STUDIO_SHELL)/.test(key)) return 'infra';
  if (/^(STRIPE|AFFIRM|SEZZLE|QB_)/.test(key)) return 'payments';
  if (/^(SMTP|SENDGRID|RESEND|EMAIL|MAIL|REPLY_TO|ALERT_EMAIL|ADMIN_ALERT|SPONSOR_FINANCE|MOU_ARCHIVE|NOTIFY|LEAD_NOTIFICATION|LICENSE_NOTIFICATION|SECURITY_EMAIL)/.test(key)) return 'email';
  if (/^(GITHUB|GOOGLE|LINKEDIN|FACEBOOK|TWITTER|INSTAGRAM|YOUTUBE|SLACK|TWILIO|HUBSPOT|SALESFORCE|ZAPIER|CALENDLY|JOTFORM|SENTRY|DURABLE|WORKOS|ZOOM|TEAMS)/.test(key)) return 'integrations';
  return 'general';
}
